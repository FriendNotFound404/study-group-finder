<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\StudyGroup;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscoverController extends Controller {
    public function trending() {
        return StudyGroup::withCount('members')
            ->orderBy('members_count', 'desc')
            ->take(6)
            ->get();
    }

    public function subjects() {
        return StudyGroup::select('subject', 'faculty')
            ->selectRaw('count(*) as count')
            ->groupBy('subject', 'faculty')
            ->get();
    }

    public function leaders() {
        // Specifically rank users who have the 'leader' role
        return User::where('role', 'leader')
            ->orderBy('karma_points', 'desc')
            ->select('id', 'name', 'email', 'major', 'karma_points', 'role')
            ->take(10)
            ->get();
    }

    public function searchUsers(Request $request) {
        $query = $request->query('q');

        if (!$query) {
            return $this->leaders();
        }

        return User::where('name', 'like', "%{$query}%")
            ->orWhere('major', 'like', "%{$query}%")
            ->orderBy('karma_points', 'desc')
            ->select('id', 'name', 'email', 'major', 'karma_points', 'role')
            ->take(20)
            ->get();
    }
}