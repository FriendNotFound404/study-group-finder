<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SuspendedUserMiddleware
{
    /**
     * Handle an incoming request and block suspended/banned users from actions
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Check if user is banned
        if ($user->banned) {
            return response()->json([
                'message' => 'Your account has been banned. Please contact support.',
                'reason' => $user->banned_reason,
                'status' => 'banned'
            ], 403);
        }

        // Check if user is currently suspended
        if ($user->suspended_until && $user->suspended_until->isFuture()) {
            return response()->json([
                'message' => 'Your account is temporarily suspended.',
                'reason' => $user->suspension_reason,
                'suspended_until' => $user->suspended_until->toDateTimeString(),
                'days_remaining' => now()->diffInDays($user->suspended_until, false),
                'status' => 'suspended'
            ], 403);
        }

        return $next($request);
    }
}
