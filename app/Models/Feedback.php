<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $fillable = ['user_id', 'group_name', 'rating', 'text'];
    protected $appends = ['user_name'];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function getUserNameAttribute() {
        return $this->user->name ?? 'Anonymous';
    }
}