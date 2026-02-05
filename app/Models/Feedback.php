<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $table = 'feedback';

    protected $fillable = ['user_id', 'rating', 'comment'];

    protected $appends = ['user_name', 'user_email'];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function getUserNameAttribute() {
        return $this->user->name ?? 'Anonymous';
    }

    public function getUserEmailAttribute() {
        return $this->user->email ?? '';
    }
}