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

    protected $appends = ['members_count', 'creator_name', 'is_member', 'has_pending_request', 'pending_requests_count'];

    public function creator() {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function members() {
        // Only approved members
        return $this->belongsToMany(User::class, 'group_user', 'group_id', 'user_id')
            ->withPivot('status', 'approved_at', 'rejected_at')
            ->wherePivot('status', 'approved')
            ->withTimestamps();
    }

    public function pendingRequests() {
        // Users with pending join requests
        return $this->belongsToMany(User::class, 'group_user', 'group_id', 'user_id')
            ->withPivot('status', 'approved_at', 'rejected_at')
            ->wherePivot('status', 'pending')
            ->withTimestamps();
    }

    public function allMemberRelations() {
        // All relations regardless of status (for internal use)
        return $this->belongsToMany(User::class, 'group_user', 'group_id', 'user_id')
            ->withPivot('status', 'approved_at', 'rejected_at')
            ->withTimestamps();
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
        // Check if approved member
        return $this->members()->where('user_id', Auth::id())->exists();
    }

    public function getHasPendingRequestAttribute() {
        if (!Auth::check()) return false;
        // Check if user has a pending request
        return $this->pendingRequests()->where('user_id', Auth::id())->exists();
    }

    public function getPendingRequestsCountAttribute() {
        return $this->pendingRequests()->count();
    }
}