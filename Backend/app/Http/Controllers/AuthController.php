<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:teacher,student,admin'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password) || $user->role !== $data['role']) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales o rol incorrectos.'],
            ]);
        }

        return response()->json([
            'token' => $user->createToken('expo-go')->plainTextToken,
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'studentCode' => $user->student_code,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesion cerrada.']);
    }
}
