<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:courses,code'],
            'room' => ['required', 'string', 'max:255'],
            'schedule' => ['required', 'string', 'max:255'],
            'teacher_id' => ['required', 'integer', 'exists:users,id'],
            'enrolled' => ['nullable', 'integer', 'min:0'],
        ]);

        unset($data['enrolled']);

        if (User::whereKey($data['teacher_id'])->where('role', 'teacher')->where('active', true)->doesntExist()) {
            abort(422, 'La materia debe asignarse a un docente valido.');
        }

        $course = Course::create([
            ...$data,
            'teacher_id' => $data['teacher_id'],
            'latitude' => -2.170998,
            'longitude' => -79.922359,
            'radius_meters' => 120,
        ]);

        return response()->json($this->payload($course), 201);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:courses,code,'.$course->id],
            'room' => ['required', 'string', 'max:255'],
            'schedule' => ['required', 'string', 'max:255'],
            'teacher_id' => ['required', 'integer', 'exists:users,id'],
            'enrolled' => ['nullable', 'integer', 'min:0'],
        ]);

        unset($data['enrolled']);

        if (User::whereKey($data['teacher_id'])->where('role', 'teacher')->where('active', true)->doesntExist()) {
            abort(422, 'La materia debe asignarse a un docente valido.');
        }

        $course->update($data);

        return response()->json($this->payload($course));
    }

    public function destroy(Request $request, Course $course): JsonResponse
    {
        $this->authorizeAdmin($request);
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
            'teacherId' => (string) $course->teacher_id,
            'enrolled' => $course->enrollments_count,
        ];
    }

    private function authorizeAdmin(Request $request): void
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Solo el administrador puede gestionar materias.');
        }
    }
}
