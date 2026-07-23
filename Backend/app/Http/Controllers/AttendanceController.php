<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    public function createSession(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:120'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        if ($request->user()->role !== 'teacher') {
            return $this->rejected('Solo el docente puede generar sesiones de asistencia.', 403);
        }

        $course = Course::findOrFail($data['course_id']);
        if ((int) $course->teacher_id !== (int) $request->user()->id) {
            return $this->rejected('Esta materia no esta asignada a tu cuenta.', 403);
        }
        $startsAt = now();
        $expiresAt = $startsAt->copy()->addMinutes($data['duration_minutes'] ?? 10);

        $session = AttendanceSession::create([
            'course_id' => $course->id,
            'teacher_id' => $request->user()->id,
            'token' => Str::uuid()->toString(),
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'radius_meters' => $course->radius_meters,
            'status' => 'active',
        ]);

        return response()->json([
            'sessionId' => (string) $session->id,
            'courseId' => (string) $course->id,
            'courseName' => $course->name,
            'startsAt' => $session->starts_at->toISOString(),
            'expiresAt' => $session->expires_at->toISOString(),
            'room' => $course->room,
            'latitude' => $session->latitude,
            'longitude' => $session->longitude,
            'radiusMeters' => $session->radius_meters,
            'token' => $session->token,
        ], 201);
    }

    public function validateAttendance(Request $request): JsonResponse
    {
        $data = $request->validate([
            'qr.sessionId' => ['required'],
            'qr.courseId' => ['required'],
            'qr.token' => ['required', 'string'],
            'studentCode' => ['required', 'string'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'accuracy' => ['nullable', 'numeric'],
        ]);

        if ($request->user()->role !== 'student') {
            return $this->rejected('Solo el estudiante puede validar asistencia escaneando QR.', 403);
        }

        $session = AttendanceSession::where('id', $data['qr']['sessionId'])
            ->where('token', $data['qr']['token'])
            ->where('course_id', $data['qr']['courseId'])
            ->first();

        if (! $session || $session->status !== 'active') {
            return $this->rejected('QR invalido o sesion cerrada.', 404);
        }

        if (Carbon::parse($session->expires_at)->isPast()) {
            return $this->rejected('El QR ya vencio.', 422);
        }

        $student = $request->user();
        if ($student->student_code !== $data['studentCode']) {
            return $this->rejected('El codigo escaneado no coincide con tu cuenta.', 403);
        }

        $student = User::where('student_code', $data['studentCode'])->where('role', 'student')->first();
        if (! $student) {
            return $this->rejected('Estudiante no encontrado.', 404);
        }

        $isEnrolled = Enrollment::where('course_id', $session->course_id)->where('student_id', $student->id)->exists();
        if (! $isEnrolled) {
            return $this->rejected('El estudiante no esta matriculado en esta materia.', 403);
        }

        $distance = $this->distanceMeters($session->latitude, $session->longitude, $data['latitude'], $data['longitude']);
        if ($distance > $session->radius_meters) {
            return $this->rejected('Estas fuera del rango permitido del aula.', 422, $distance);
        }

        $status = now()->diffInMinutes($session->starts_at) > 15 ? 'Tardanza' : 'Presente';
        $record = AttendanceRecord::updateOrCreate(
            ['attendance_session_id' => $session->id, 'student_id' => $student->id],
            [
                'status' => $status,
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'accuracy' => $data['accuracy'] ?? null,
                'distance_meters' => round($distance, 2),
                'validated_at' => now(),
            ],
        );

        return response()->json([
            'status' => 'accepted',
            'attendanceStatus' => $record->status,
            'message' => $record->status === 'Tardanza' ? 'Asistencia registrada como tardanza.' : 'Asistencia registrada correctamente.',
            'distanceMeters' => round($distance, 2),
        ]);
    }

    public function closeSession(Request $request, AttendanceSession $session): JsonResponse
    {
        if ($request->user()->role !== 'teacher') {
            return $this->rejected('Solo el docente puede cerrar sesiones de asistencia.', 403);
        }

        if ((int) $session->teacher_id !== (int) $request->user()->id) {
            return $this->rejected('Esta sesion no pertenece a tu cuenta docente.', 403);
        }

        Enrollment::query()
            ->where('course_id', $session->course_id)
            ->with('student')
            ->get()
            ->each(function (Enrollment $enrollment) use ($session) {
                AttendanceRecord::firstOrCreate(
                    ['attendance_session_id' => $session->id, 'student_id' => $enrollment->student_id],
                    [
                        'status' => 'Ausente',
                        'latitude' => $session->latitude,
                        'longitude' => $session->longitude,
                        'accuracy' => null,
                        'distance_meters' => 0,
                        'validated_at' => now(),
                    ],
                );
            });

        $session->update(['status' => 'closed']);

        $records = AttendanceRecord::query()
            ->where('attendance_session_id', $session->id)
            ->with('session')
            ->get()
            ->keyBy('student_id');

        $attendance = Enrollment::query()
            ->where('course_id', $session->course_id)
            ->with('student')
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'id' => (string) $enrollment->student->id,
                'name' => $enrollment->student->name,
                'code' => $enrollment->student->student_code ?? '',
                'career' => $enrollment->student->career ?? '',
                'semester' => $enrollment->student->semester ?? '',
                'email' => $enrollment->student->email,
                'status' => $records->get($enrollment->student_id)?->status ?? 'Ausente',
            ])
            ->values()
            ->all();

        return response()->json([
            'message' => 'Sesion cerrada. Los estudiantes pendientes quedaron como ausentes.',
            'attendance' => $attendance,
        ]);
    }

    private function rejected(string $message, int $httpStatus, ?float $distance = null): JsonResponse
    {
        return response()->json([
            'status' => 'rejected',
            'message' => $message,
            'distanceMeters' => $distance ? round($distance, 2) : null,
        ], $httpStatus);
    }

    private function distanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
