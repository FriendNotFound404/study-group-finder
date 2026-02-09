<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller {
    public function show() {
        return Auth::user();
    }

    public function update(Request $request) {
        $user = Auth::user();
        $user->update($request->only(['major', 'bio', 'location']));
        return $user;
    }

    public function stats() {
        $user = Auth::user();
        return [
            'groups_joined' => $user->joinedGroups()->count(),
            'study_hours' => $user->events()->count() * 2, // Simplified mock estimation
            'karma' => $user->karma_points,
            'activity' => [4, 7, 3, 5, 2, 8, 6] // Mock activity data
        ];
    }

    public function showUser($id) {
        $user = \App\Models\User::findOrFail($id);
        // Return only public profile information
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'major' => $user->major,
            'bio' => $user->bio,
            'location' => $user->location,
            'warnings' => $user->warnings ?? 0,
            'banned' => $user->banned ?? false,
            'created_at' => $user->created_at,
        ];
    }

    public function userStats($id) {
        $user = \App\Models\User::findOrFail($id);
        return [
            'groups_joined' => $user->joinedGroups()->count(),
            'study_hours' => $user->events()->count() * 2, // Simplified mock estimation
            'karma' => $user->karma_points,
            'activity' => [4, 7, 3, 5, 2, 8, 6] // Mock activity data
        ];
    }
}