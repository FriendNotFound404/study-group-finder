<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModerationLog extends Model
{
    protected $fillable = [
        'moderator_id',
        'target_user_id',
        'report_id',
        'action_type',
        'duration_days',
        'reason',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Get the moderator/admin who performed the action
     */
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }

    /**
     * Get the user who was targeted by the moderation action
     */
    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    /**
     * Get the associated report (optional)
     */
    public function report()
    {
        return $this->belongsTo(Report::class, 'report_id');
    }

    /**
     * Check if action was a warning
     */
    public function isWarning()
    {
        return $this->action_type === 'warn';
    }

    /**
     * Check if action was a suspension
     */
    public function isSuspension()
    {
        return $this->action_type === 'suspend';
    }

    /**
     * Check if action was a ban
     */
    public function isBan()
    {
        return $this->action_type === 'ban';
    }

    /**
     * Check if action was an unban
     */
    public function isUnban()
    {
        return $this->action_type === 'unban';
    }
}
