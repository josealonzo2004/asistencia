<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
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
        $query = User::where('role', 'student')->where('active', true)->orderBy('name');
        $currentUser = request()->user();
        if ($currentUser?->role === 'teacher') {
            $query->whereHas('enrollments', fn ($enrollments) => $enrollments->whereHas('course', fn ($courses) => $courses->where('teacher_id', $currentUser->id)));
        } elseif ($currentUser?->role === 'student') {
            $query->whereKey($currentUser->id);
        }

        return $query->get()->map(fn (User $user) => [
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
        $query = Course::withCount('enrollments')->with('teacher')->orderBy('name');
        $user = request()->user();
        if ($user?->role === 'teacher') {
            $query->where('teacher_id', $user->id);
        } elseif ($user?->role === 'student') {
            $query->whereHas('enrollments', fn ($enrollments) => $enrollments->where('student_id', $user->id));
        }

        return $query->get()->map(fn (Course $course) => [
            'id' => (string) $course->id,
            'name' => $course->name,
            'code' => $course->code,
            'room' => $course->room,
            'schedule' => $course->schedule,
            'teacher' => $course->teacher?->name ?? 'Sin docente',
            'teacherId' => (string) $course->teacher_id,
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
            'student_code' => $user->student_code,
            'active' => (bool) $user->active,
        ])->values()->all();
    }

    public function attendance(): array
    {
        $user = request()->user();
        if ($user?->role !== 'teacher') {
            return [];
        }

        $session = AttendanceSession::query()
            ->where('teacher_id', $user->id)
            ->with('records')
            ->latest()
            ->first();

        $records = $session?->records->keyBy('student_id') ?? collect();

        return collect($this->students())->map(fn (array $student) => [
            ...$student,
            'status' => $records->get((int) $student['id'])?->status ?? 'Pendiente',
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
