<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = ['user_id', 'group_id', 'title', 'type', 'start_time', 'location'];

    public function group() {
        return $this->belongsTo(StudyGroup::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }
}