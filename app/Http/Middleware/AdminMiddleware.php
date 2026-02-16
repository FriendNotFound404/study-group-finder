<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Check if user has admin or moderator role
        if (!in_array($user->role, ['admin', 'moderator'])) {
            return response()->json([
                'message' => 'Unauthorized. Admin or moderator access only.'
            ], 403);
        }

        return $next($request);
    }
}
