<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileDataController extends Controller
{
    public function bootstrap(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
            'students' => $this->students(),
            'courses' => $this->courses(),
            'users' => $this->users(),
            'attendance' => $this->attendance(),
            'studentHistory' => $this->studentHistory($request->user()),
        ]);
    }

    public function students(): array
    {
        return User::where('role', 'student')->orderBy('name')->get()->map(fn (User $user) => [
            'id' => (string) $user->id,
            'name' => $user->name,
            'code' => $user->student_code ?? '',
            'career' => 'Ingenieria de Software',
            'semester' => '7mo',
            'email' => $user->email,
        ])->values()->all();
    }

    public function courses(): array
    {
        return Course::withCount('enrollments')->with('teacher')->orderBy('name')->get()->map(fn (Course $course) => [
            'id' => (string) $course->id,
            'name' => $course->name,
            'code' => $course->code,
            'room' => $course->room,
            'schedule' => $course->schedule,
            'teacher' => $course->teacher?->name ?? 'Sin docente',
            'enrolled' => $course->enrollments_count,
        ])->values()->all();
    }

    public function users(): array
    {
        return User::orderBy('name')->get()->map(fn (User $user) => [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'active' => true,
        ])->values()->all();
    }

    public function attendance(): array
    {
        return collect($this->students())->map(fn (array $student, int $index) => [
            ...$student,
            'status' => $index === 0 ? 'Presente' : 'Ausente',
        ])->values()->all();
    }

    private function studentHistory(User $user): array
    {
        if ($user->role !== 'student') {
            return [];
        }

        return AttendanceRecord::query()
            ->where('student_id', $user->id)
            ->with('session.course')
            ->latest('validated_at')
            ->limit(10)
            ->get()
            ->map(fn (AttendanceRecord $record) => [
                'id' => (string) $record->id,
                'date' => $record->validated_at->format('d/m/Y H:i'),
                'course' => $record->session?->course?->name ?? 'Clase',
                'status' => $record->status,
                'note' => 'Validada con QR y GPS',
            ])
            ->values()
            ->all();
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'studentCode' => $user->student_code,
        ];
    }
}
