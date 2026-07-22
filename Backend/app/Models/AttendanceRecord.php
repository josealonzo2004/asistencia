<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['attendance_session_id', 'student_id', 'status', 'latitude', 'longitude', 'accuracy', 'distance_meters', 'validated_at'])]
class AttendanceRecord extends Model
{
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'accuracy' => 'float',
            'distance_meters' => 'float',
            'validated_at' => 'datetime',
        ];
    }

    public function session()
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }
}
