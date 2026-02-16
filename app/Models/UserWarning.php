<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserWarning extends Model
{
    protected $fillable = [
        'user_id',
        'warned_by',
        'reason',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user who was warned
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the admin who issued the warning
     */
    public function warnedBy()
    {
        return $this->belongsTo(User::class, 'warned_by');
    }

    /**
     * Check if the warning is still active (not expired)
     */
    public function isActive()
    {
        return $this->expires_at->isFuture();
    }

    /**
     * Scope to get only active (non-expired) warnings
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now());
    }
}
