<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    const ROLE_MEMBER = 'member';
    const ROLE_LEADER = 'leader';

    protected $fillable = [
        'name', 'email', 'password', 'role', 'major', 'bio', 'location', 'karma_points'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    /**
     * Check if the user has the 'leader' role.
     * Note: Users become leaders upon creating their first group.
     */
    public function isLeader() {
        return $this->role === self::ROLE_LEADER;
    }

    public function isMember() {
        return $this->role === self::ROLE_MEMBER;
    }

    public function createdGroups() {
        return $this->hasMany(StudyGroup::class, 'creator_id');
    }

    public function joinedGroups() {
        return $this->belongsToMany(StudyGroup::class, 'group_user', 'user_id', 'group_id')->withTimestamps();
    }

    public function messages() {
        return $this->hasMany(Message::class);
    }

    public function feedbacks() {
        return $this->hasMany(Feedback::class);
    }

    public function events() {
        return $this->hasMany(Event::class);
    }

    public function notifications() {
        return $this->hasMany(Notification::class)->latest();
    }
}