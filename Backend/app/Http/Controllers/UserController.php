<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
            'role' => $user->role,
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'regex:/^[A-Za-z0-9._%+-]+@uleam\\.edu\\.ec$/i', 'unique:users,email'],
            'role' => ['required', 'in:teacher,student'],
            'student_code' => ['nullable', 'required_if:role,student', 'string', 'max:50', 'unique:users,student_code'],
            'career' => ['nullable', 'required_if:role,student', 'string', 'max:255'],
            'semester' => ['nullable', 'required_if:role,student', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'student_code' => $data['role'] === 'student' ? $data['student_code'] : null,
            'career' => $data['role'] === 'student' ? $data['career'] : null,
            'semester' => $data['role'] === 'student' ? $data['semester'] : null,
        ]);

        return response()->json($this->payload($user), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        if ($user->role === 'admin') {
            abort(422, 'La cuenta de administrador no se edita desde este panel.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'regex:/^[A-Za-z0-9._%+-]+@uleam\\.edu\\.ec$/i', 'unique:users,email,'.$user->id],
            'student_code' => ['nullable', 'required_if:role,student', 'string', 'max:50', 'unique:users,student_code,'.$user->id],
            'career' => ['nullable', 'required_if:role,student', 'string', 'max:255'],
            'semester' => ['nullable', 'required_if:role,student', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'student_code' => $user->role === 'student' ? $data['student_code'] : null,
            'career' => $user->role === 'student' ? $data['career'] : null,
            'semester' => $user->role === 'student' ? $data['semester'] : null,
        ]);

        if (! empty($data['password'])) {
            $user->update(['password' => Hash::make($data['password'])]);
        }

        return response()->json($this->payload($user));
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);

        if ($user->role === 'admin') {
            abort(422, 'La cuenta de administrador no se puede desactivar.');
        }

        $user->update(['active' => ! $user->active]);

        return response()->json($this->payload($user));
    }

    private function payload(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'student_code' => $user->student_code,
            'career' => $user->career,
            'semester' => $user->semester,
            'active' => (bool) $user->active,
        ];
    }

    private function authorizeAdmin(Request $request): void
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Solo el administrador puede crear usuarios.');
        }
    }
}
