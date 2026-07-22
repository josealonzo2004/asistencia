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
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:users,student_code'],
            'email' => ['required', 'email', 'max:255', 'regex:/^[A-Za-z0-9._%+-]+@universidad\.edu\.ec$/i', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $student = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'student',
            'student_code' => $data['code'],
        ]);

        return response()->json($this->payload($student), 201);
    }

    public function update(Request $request, User $student): JsonResponse
    {
        $this->authorizeAdmin($request);

        if ($student->role !== 'student') {
            abort(404);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:users,student_code,'.$student->id],
            'email' => ['required', 'email', 'max:255', 'regex:/^[A-Za-z0-9._%+-]+@universidad\.edu\.ec$/i', 'unique:users,email,'.$student->id],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $student->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'student_code' => $data['code'],
        ]);

        if (! empty($data['password'] ?? null)) {
            $student->update(['password' => Hash::make($data['password'])]);
        }

        return response()->json($this->payload($student));
    }

    public function destroy(Request $request, User $student): JsonResponse
    {
        $this->authorizeAdmin($request);

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

    private function authorizeAdmin(Request $request): void
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Solo el administrador puede gestionar estudiantes.');
        }
    }
}
