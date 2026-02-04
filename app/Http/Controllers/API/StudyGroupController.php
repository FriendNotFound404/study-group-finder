<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\StudyGroup;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudyGroupController extends Controller
{
    public function index() {
        return StudyGroup::with('creator')->latest()->get();
    }

    public function store(Request $request) {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'subject' => 'required|string',
            'faculty' => 'required|string',
            'description' => 'required|string',
            'max_members' => 'required|integer|min:2',
            'location' => 'required|string',
        ]);

        $group = StudyGroup::create(array_merge($validated, [
            'creator_id' => $user->id,
            'status' => 'open'
        ]));

        // Upgrade user to leader role if they aren't already
        if ($user->role !== User::ROLE_LEADER) {
            $user->role = User::ROLE_LEADER;
            $user->save();
        }

        // Attach the creator as the first member
        $group->members()->attach($user->id);

        return response()->json($group, 201);
    }

    public function update(Request $request, $id) {
        $group = StudyGroup::findOrFail($id);
        
        if ($group->creator_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized. Only the group leader can manage this hub.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'subject' => 'sometimes|string',
            'faculty' => 'sometimes|string',
            'description' => 'sometimes|string',
            'max_members' => 'sometimes|integer|min:2',
            'location' => 'sometimes|string',
            'status' => 'sometimes|in:open,closed,archived'
        ]);

        $group->update($validated);

        return response()->json($group);
    }

    public function show($id) {
        return StudyGroup::with(['creator', 'members', 'events'])->findOrFail($id);
    }

    public function join($id) {
        $group = StudyGroup::findOrFail($id);
        $user = Auth::user();
        
        if ($group->status !== 'open') {
            return response()->json(['message' => 'Group is not accepting new members'], 400);
        }

        if ($group->members_count >= $group->max_members) {
            return response()->json(['message' => 'Group is full'], 400);
        }

        if (!$group->members()->where('user_id', $user->id)->exists()) {
            $group->members()->attach($user->id);

            // Notify Leader
            if ($group->creator_id !== $user->id) {
                Notification::create([
                    'user_id' => $group->creator_id,
                    'type' => 'group_join',
                    'data' => [
                        'user_name' => $user->name,
                        'group_name' => $group->name,
                        'message' => "{$user->name} has joined your study group '{$group->name}'."
                    ]
                ]);
            }
        }

        return response()->json(['message' => 'Joined successfully']);
    }

    public function leave($id) {
        $group = StudyGroup::findOrFail($id);
        $group->members()->detach(Auth::id());
        return response()->json(['message' => 'Left successfully']);
    }

    public function destroy($id) {
        $group = StudyGroup::findOrFail($id);
        
        if ($group->creator_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized. Only the group leader can dissolve this hub.'], 403);
        }
        
        $group->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}