<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\MobileDataController;
use App\Http\Controllers\StudentController;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/mobile/bootstrap', [MobileDataController::class, 'bootstrap']);
    Route::post('/students', [StudentController::class, 'store']);
    Route::put('/students/{student}', [StudentController::class, 'update']);
    Route::delete('/students/{student}', [StudentController::class, 'destroy']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::put('/courses/{course}', [CourseController::class, 'update']);
    Route::delete('/courses/{course}', [CourseController::class, 'destroy']);
    Route::post('/attendance/sessions', [AttendanceController::class, 'createSession']);
    Route::post('/attendance/validate', [AttendanceController::class, 'validateAttendance']);
});
