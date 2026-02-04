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
}