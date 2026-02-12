<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Centralized service for managing karma points
 *
 * Karma Points System:
 *
 * EARNING KARMA (Positive Actions):
 * - Creating a group: +20 points
 * - Joining a group: +10 points
 * - Sending a text message: +5 points
 * - Uploading a file in chat: +10 points (5 for message + 5 bonus)
 * - Creating a meeting/event: +15 points
 * - Join request approved: +5 points
 *
 * LOSING KARMA (Negative Actions):
 * - Receiving a warning: -15 points
 * - Getting banned: -50 points
 * - Being kicked from a group: -20 points
 * - Leaving a group voluntarily: -5 points
 */
class KarmaService
{
    /**
     * Award karma for creating a study group
     */
    public static function awardGroupCreation(User $user): void
    {
        self::addKarma($user, 20, 'Created a study group');
    }

    /**
     * Award karma for joining a study group
     */
    public static function awardGroupJoin(User $user): void
    {
        self::addKarma($user, 10, 'Joined a study group');
    }

    /**
     * Award karma for sending a message
     */
    public static function awardMessage(User $user, bool $hasFile = false): void
    {
        $points = $hasFile ? 10 : 5;
        $reason = $hasFile ? 'Sent a message with file' : 'Sent a message';
        self::addKarma($user, $points, $reason);
    }

    /**
     * Award karma for creating a meeting/event
     */
    public static function awardMeetingCreation(User $user): void
    {
        self::addKarma($user, 15, 'Created a meeting/event');
    }

    /**
     * Award karma when join request is approved
     */
    public static function awardJoinApproval(User $user): void
    {
        self::addKarma($user, 5, 'Join request approved');
    }

    /**
     * Deduct karma for receiving a warning
     */
    public static function penalizeWarning(User $user): void
    {
        self::deductKarma($user, 15, 'Received a warning');
    }

    /**
     * Deduct karma for being banned
     */
    public static function penalizeBan(User $user): void
    {
        self::deductKarma($user, 50, 'Banned from platform');
    }

    /**
     * Deduct karma for being kicked from a group
     */
    public static function penalizeKick(User $user): void
    {
        self::deductKarma($user, 20, 'Kicked from a group');
    }

    /**
     * Deduct karma for voluntarily leaving a group
     */
    public static function penalizeLeave(User $user): void
    {
        self::deductKarma($user, 5, 'Left a group');
    }

    /**
     * Add karma points to a user
     */
    private static function addKarma(User $user, int $points, string $reason): void
    {
        $user->increment('karma_points', $points);
        Log::info("Karma awarded: User {$user->id} ({$user->name}) +{$points} - {$reason}");
    }

    /**
     * Deduct karma points from a user (minimum 0)
     */
    private static function deductKarma(User $user, int $points, string $reason): void
    {
        $newKarma = max(0, $user->karma_points - $points);
        $user->update(['karma_points' => $newKarma]);
        Log::info("Karma deducted: User {$user->id} ({$user->name}) -{$points} - {$reason}");
    }

    /**
     * Get karma point value for a specific action (for display purposes)
     */
    public static function getActionValue(string $action): int
    {
        $values = [
            'group_creation' => 20,
            'group_join' => 10,
            'message' => 5,
            'file_upload' => 10,
            'meeting_creation' => 15,
            'join_approval' => 5,
            'warning' => -15,
            'ban' => -50,
            'kick' => -20,
            'leave' => -5,
        ];

        return $values[$action] ?? 0;
    }
}
