<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'reporter_id',
        'reported_user_id',
        'reported_group_id',
        'reported_message_id',
        'reason',
        'description',
        'evidence_url',
        'status',
        'priority',
        'resolved_at',
        'resolved_by',
        'resolution_notes'
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    /**
     * Get the user who submitted the report
     */
    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    /**
     * Get the user who was reported
     */
    public function reportedUser()
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    /**
     * Get the group that was reported (optional)
     */
    public function reportedGroup()
    {
        return $this->belongsTo(StudyGroup::class, 'reported_group_id');
    }

    /**
     * Get the message that was reported (optional)
     */
    public function reportedMessage()
    {
        return $this->belongsTo(Message::class, 'reported_message_id');
    }

    /**
     * Get the admin/moderator who resolved the report
     */
    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Get moderation logs associated with this report
     */
    public function moderationLogs()
    {
        return $this->hasMany(ModerationLog::class, 'report_id');
    }

    /**
     * Check if report is pending
     */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if report is resolved
     */
    public function isResolved()
    {
        return $this->status === 'resolved';
    }

    /**
     * Check if report is dismissed
     */
    public function isDismissed()
    {
        return $this->status === 'dismissed';
    }
}
