<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['course_id', 'teacher_id', 'token', 'starts_at', 'expires_at', 'latitude', 'longitude', 'radius_meters', 'status'])]
class AttendanceSession extends Model
{
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'radius_meters' => 'integer',
        ];
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function records()
    {
        return $this->hasMany(AttendanceRecord::class);
    }
}
