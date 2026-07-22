<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $this->authorizeTeacherOrAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:users,student_code'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        $student = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make('123456'),
            'role' => 'student',
            'student_code' => $data['code'],
        ]);

        return response()->json($this->payload($student), 201);
    }

    public function update(Request $request, User $student): JsonResponse
    {
        $this->authorizeTeacherOrAdmin($request);

        if ($student->role !== 'student') {
            abort(404);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:users,student_code,'.$student->id],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$student->id],
        ]);

        $student->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'student_code' => $data['code'],
        ]);

        return response()->json($this->payload($student));
    }

    public function destroy(Request $request, User $student): JsonResponse
    {
        $this->authorizeTeacherOrAdmin($request);

        if ($student->role !== 'student') {
            abort(404);
        }

        $student->delete();

        return response()->json(['message' => 'Estudiante eliminado.']);
    }

    private function payload(User $student): array
    {
        return [
            'id' => (string) $student->id,
            'name' => $student->name,
            'code' => $student->student_code,
            'career' => 'Ingenieria de Software',
            'semester' => '7mo',
            'email' => $student->email,
        ];
    }

    private function authorizeTeacherOrAdmin(Request $request): void
    {
        if (! in_array($request->user()->role, ['teacher', 'admin'], true)) {
            abort(403, 'No autorizado.');
        }
    }
}
