<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        User::where('email', 'like', '%@universidad.edu.ec')
            ->get()
            ->each(function (User $user) {
                $user->update([
                    'email' => str_replace('@universidad.edu.ec', '@uleam.edu.ec', $user->email),
                ]);
            });
    }

    public function down(): void
    {
        User::where('email', 'like', '%@uleam.edu.ec')
            ->get()
            ->each(function (User $user) {
                $user->update([
                    'email' => str_replace('@uleam.edu.ec', '@universidad.edu.ec', $user->email),
                ]);
            });
    }
};

