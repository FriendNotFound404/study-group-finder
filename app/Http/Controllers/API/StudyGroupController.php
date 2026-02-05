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

        // Attach the creator as the first member with approved status
        $group->allMemberRelations()->attach($user->id, [
            'status' => 'approved',
            'approved_at' => now()
        ]);

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

        // Validation checks
        if ($group->status !== 'open') {
            return response()->json(['message' => 'Group is not accepting new members'], 400);
        }

        // Check if group would be full (count only approved members)
        if ($group->members_count >= $group->max_members) {
            return response()->json(['message' => 'Group is full'], 400);
        }

        // Check if user is already a member (approved)
        if ($group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'You are already a member'], 400);
        }

        // Check if user already has a pending request
        $existingRequest = $group->allMemberRelations()
            ->where('user_id', $user->id)
            ->first();

        if ($existingRequest) {
            $status = $existingRequest->pivot->status;
            if ($status === 'pending') {
                return response()->json(['message' => 'Your join request is pending approval'], 400);
            } elseif ($status === 'rejected') {
                // Allow reapplying after rejection - update existing record
                $group->allMemberRelations()->updateExistingPivot($user->id, [
                    'status' => 'pending',
                    'rejected_at' => null,
                    'updated_at' => now()
                ]);
            }
        } else {
            // Create new pending request
            $group->allMemberRelations()->attach($user->id, [
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Notify Leader with join_request type
        if ($group->creator_id !== $user->id) {
            Notification::create([
                'user_id' => $group->creator_id,
                'type' => 'join_request',
                'data' => [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'message' => "{$user->name} wants to join '{$group->name}'."
                ]
            ]);
        }

        return response()->json(['message' => 'Join request sent! Waiting for leader approval.']);
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

    /**
     * Get pending join requests for a group
     * Only accessible by group leader
     */
    public function pendingRequests($id) {
        $group = StudyGroup::findOrFail($id);
        $user = Auth::user();

        // Only leader can see pending requests
        if ($group->creator_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized. Only the group leader can view join requests.'], 403);
        }

        $requests = $group->pendingRequests()
            ->select('users.id', 'users.name', 'users.email', 'users.major', 'group_user.created_at as requested_at')
            ->get();

        return response()->json($requests);
    }

    /**
     * Approve a join request
     */
    public function approveRequest($groupId, $userId) {
        $group = StudyGroup::findOrFail($groupId);
        $currentUser = Auth::user();

        // Only leader can approve
        if ($group->creator_id !== $currentUser->id) {
            return response()->json(['message' => 'Unauthorized. Only the group leader can approve requests.'], 403);
        }

        // Check if request exists and is pending
        $request = $group->allMemberRelations()
            ->where('user_id', $userId)
            ->first();

        if (!$request || $request->pivot->status !== 'pending') {
            return response()->json(['message' => 'No pending request found for this user.'], 404);
        }

        // Check capacity before approving
        if ($group->members_count >= $group->max_members) {
            return response()->json(['message' => 'Cannot approve - group is now full.'], 400);
        }

        // Approve the request
        $group->allMemberRelations()->updateExistingPivot($userId, [
            'status' => 'approved',
            'approved_at' => now(),
            'updated_at' => now()
        ]);

        // Notify the requesting user that they were approved
        $requestingUser = User::find($userId);
        if ($requestingUser) {
            Notification::create([
                'user_id' => $userId,
                'type' => 'join_approved',
                'data' => [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'message' => "Your request to join '{$group->name}' has been approved! Welcome to the group."
                ]
            ]);
        }

        return response()->json(['message' => 'Join request approved successfully.']);
    }

    /**
     * Reject a join request
     */
    public function rejectRequest($groupId, $userId) {
        $group = StudyGroup::findOrFail($groupId);
        $currentUser = Auth::user();

        // Only leader can reject
        if ($group->creator_id !== $currentUser->id) {
            return response()->json(['message' => 'Unauthorized. Only the group leader can reject requests.'], 403);
        }

        // Check if request exists and is pending
        $request = $group->allMemberRelations()
            ->where('user_id', $userId)
            ->first();

        if (!$request || $request->pivot->status !== 'pending') {
            return response()->json(['message' => 'No pending request found for this user.'], 404);
        }

        // Reject the request
        $group->allMemberRelations()->updateExistingPivot($userId, [
            'status' => 'rejected',
            'rejected_at' => now(),
            'updated_at' => now()
        ]);

        // Notify the requesting user that they were rejected
        $requestingUser = User::find($userId);
        if ($requestingUser) {
            Notification::create([
                'user_id' => $userId,
                'type' => 'join_rejected',
                'data' => [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'message' => "Your request to join '{$group->name}' was not approved at this time."
                ]
            ]);
        }

        return response()->json(['message' => 'Join request rejected.']);
    }
}