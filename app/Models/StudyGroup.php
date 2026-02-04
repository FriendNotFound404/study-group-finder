<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class StudyGroup extends Model
{
    protected $fillable = [
        'name', 'subject', 'faculty', 'description', 'max_members', 
        'location', 'creator_id', 'status'
    ];

    protected $appends = ['members_count', 'creator_name', 'is_member'];

    public function creator() {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function members() {
        return $this->belongsToMany(User::class, 'group_user', 'group_id', 'user_id')->withTimestamps();
    }

    public function messages() {
        return $this->hasMany(Message::class, 'group_id');
    }

    public function events() {
        return $this->hasMany(Event::class, 'group_id');
    }

    public function getMembersCountAttribute() {
        return $this->members()->count();
    }

    public function getCreatorNameAttribute() {
        return $this->creator->name ?? 'Unknown';
    }

    public function getIsMemberAttribute() {
        if (!Auth::check()) return false;
        return $this->members()->where('user_id', Auth::id())->exists();
    }
}