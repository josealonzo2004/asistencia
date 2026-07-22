<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function show(Request $request, Course $course): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'courseId' => (string) $course->id,
            'studentIds' => Enrollment::where('course_id', $course->id)
                ->pluck('student_id')
                ->map(fn (int $id) => (string) $id)
                ->values(),
        ]);
    }

    public function sync(Request $request, Course $course): JsonResponse
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'student_ids' => ['array'],
            'student_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $studentIds = User::whereIn('id', $data['student_ids'] ?? [])
            ->where('role', 'student')
            ->pluck('id');

        Enrollment::where('course_id', $course->id)
            ->whereNotIn('student_id', $studentIds)
            ->delete();

        foreach ($studentIds as $studentId) {
            Enrollment::updateOrCreate([
                'course_id' => $course->id,
                'student_id' => $studentId,
            ]);
        }

        $course->loadCount('enrollments')->load('teacher');

        return response()->json([
            'message' => 'Estudiantes asignados correctamente.',
            'course' => [
                'id' => (string) $course->id,
                'name' => $course->name,
                'code' => $course->code,
                'room' => $course->room,
                'schedule' => $course->schedule,
                'teacher' => $course->teacher?->name ?? 'Sin docente',
                'enrolled' => $course->enrollments_count,
            ],
            'studentIds' => $studentIds->map(fn (int $id) => (string) $id)->values(),
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Solo el administrador puede asignar estudiantes.');
        }
    }
}
