<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('career')->nullable()->after('student_code');
            $table->string('semester')->nullable()->after('career');
        });

        DB::table('users')
            ->where('role', 'student')
            ->whereNull('career')
            ->update([
                'career' => 'Ingenieria de Software',
                'semester' => '7mo',
            ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['career', 'semester']);
        });
    }
};
