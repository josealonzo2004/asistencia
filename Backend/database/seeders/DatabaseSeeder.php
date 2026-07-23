<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::updateOrCreate([
            'email' => 'docente@uleam.edu.ec',
        ], [
            'name' => 'Maria Andrade',
            'password' => Hash::make('123456'),
            'role' => 'teacher',
            'student_code' => null,
        ]);

        $student = User::updateOrCreate([
            'email' => 'estudiante@uleam.edu.ec',
        ], [
            'name' => 'Ana Torres',
            'password' => Hash::make('123456'),
            'role' => 'student',
            'student_code' => '202310245',
        ]);

        User::updateOrCreate([
            'email' => 'admin@uleam.edu.ec',
        ], [
            'name' => 'Coordinacion Academica',
            'password' => Hash::make('123456'),
            'role' => 'admin',
            'student_code' => null,
        ]);

        $course = Course::updateOrCreate([
            'code' => 'ISW-702',
        ], [
            'teacher_id' => $teacher->id,
            'name' => 'Aplicaciones Moviles',
            'room' => 'Lab. 3',
            'schedule' => 'Lun 10:00 - 12:00',
            'latitude' => -2.170998,
            'longitude' => -79.922359,
            'radius_meters' => 120,
        ]);

        Enrollment::updateOrCreate([
            'course_id' => $course->id,
            'student_id' => $student->id,
        ]);
    }
}
