<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $this->authorizeTeacherOrAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:courses,code'],
            'room' => ['required', 'string', 'max:255'],
            'schedule' => ['required', 'string', 'max:255'],
            'enrolled' => ['nullable', 'integer', 'min:0'],
        ]);

        unset($data['enrolled']);

        $course = Course::create([
            ...$data,
            'teacher_id' => $request->user()->role === 'teacher' ? $request->user()->id : 1,
            'latitude' => -2.170998,
            'longitude' => -79.922359,
            'radius_meters' => 120,
        ]);

        return response()->json($this->payload($course), 201);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $this->authorizeTeacherOrAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:courses,code,'.$course->id],
            'room' => ['required', 'string', 'max:255'],
            'schedule' => ['required', 'string', 'max:255'],
            'enrolled' => ['nullable', 'integer', 'min:0'],
        ]);

        unset($data['enrolled']);

        $course->update($data);

        return response()->json($this->payload($course));
    }

    public function destroy(Request $request, Course $course): JsonResponse
    {
        $this->authorizeTeacherOrAdmin($request);
        $course->delete();

        return response()->json(['message' => 'Materia eliminada.']);
    }

    private function payload(Course $course): array
    {
        $course->loadCount('enrollments')->load('teacher');

        return [
            'id' => (string) $course->id,
            'name' => $course->name,
            'code' => $course->code,
            'room' => $course->room,
            'schedule' => $course->schedule,
            'teacher' => $course->teacher?->name ?? 'Sin docente',
            'enrolled' => $course->enrollments_count,
        ];
    }

    private function authorizeTeacherOrAdmin(Request $request): void
    {
        if (! in_array($request->user()->role, ['teacher', 'admin'], true)) {
            abort(403, 'No autorizado.');
        }
    }
}
