<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\StudyGroup;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\JoinRequestMail;
use App\Mail\JoinApprovedMail;
use App\Mail\JoinRejectedMail;
use App\Mail\RemovedFromGroupMail;

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

        // Check if group is archived
        if ($group->status === 'archived') {
            return response()->json(['message' => 'This group has been archived and is no longer accepting members'], 400);
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

        // Handle based on group status
        if ($group->status === 'open') {
            // OPEN GROUPS: Instant join without approval
            if ($existingRequest) {
                // Update existing record to approved
                $group->allMemberRelations()->updateExistingPivot($user->id, [
                    'status' => 'approved',
                    'approved_at' => now(),
                    'rejected_at' => null,
                    'updated_at' => now()
                ]);
            } else {
                // Create new approved membership
                $group->allMemberRelations()->attach($user->id, [
                    'status' => 'approved',
                    'approved_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Notify Leader with group_join type (informational)
            if ($group->creator_id !== $user->id) {
                Notification::create([
                    'user_id' => $group->creator_id,
                    'type' => 'group_join',
                    'data' => [
                        'user_name' => $user->name,
                        'group_id' => $group->id,
                        'group_name' => $group->name,
                        'message' => "{$user->name} has joined your study group '{$group->name}'."
                    ]
                ]);

                // Send email notification if leader's email is verified
                $leader = User::find($group->creator_id);
                if ($leader && $leader->email_verified_at) {
                    try {
                        // Note: For group_join, we're not sending email to avoid spam
                        // Only join requests, approvals, and removals get emails
                    } catch (\Exception $e) {
                        \Log::error('Failed to send group join email: ' . $e->getMessage());
                    }
                }
            }

            return response()->json(['message' => 'Successfully joined the group!']);

        } else {
            // CLOSED GROUPS: Request-based approval workflow
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

                // Send email notification if leader's email is verified
                $leader = User::find($group->creator_id);
                if ($leader && $leader->email_verified_at) {
                    try {
                        Mail::to($leader->email)->send(new JoinRequestMail($leader->name, $user->name, $group->name));
                    } catch (\Exception $e) {
                        \Log::error('Failed to send join request email: ' . $e->getMessage());
                    }
                }
            }

            return response()->json(['message' => 'Join request sent! Waiting for leader approval.']);
        }
    }

    public function leave($id) {
        $group = StudyGroup::findOrFail($id);
        $group->members()->detach(Auth::id());
        return response()->json(['message' => 'Left successfully']);
    }

    /**
     * Get members of a group
     * Only accessible by group members
     */
    public function getMembers($id) {
        $group = StudyGroup::findOrFail($id);
        $userId = Auth::id();

        // Check if user is a member of this group
        $isMember = $group->members()->where('users.id', $userId)->exists();
        $isCreator = $group->creator_id === $userId;

        if (!$isMember && !$isCreator) {
            return response()->json(['message' => 'Unauthorized. Only group members can view the member list.'], 403);
        }

        // Get all approved members with their details
        $members = $group->members()
            ->select('users.id', 'users.name', 'users.email', 'users.major', 'users.role', 'group_user.approved_at')
            ->orderByRaw('CASE WHEN users.id = ? THEN 0 ELSE 1 END', [$group->creator_id])
            ->orderBy('group_user.approved_at', 'asc')
            ->get()
            ->map(function ($member) use ($group) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'major' => $member->major,
                    'role' => $member->role,
                    'is_leader' => $member->id === $group->creator_id,
                    'joined_at' => $member->approved_at,
                ];
            });

        return response()->json($members);
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

            // Send email notification if user's email is verified
            if ($requestingUser->email_verified_at) {
                try {
                    Mail::to($requestingUser->email)->send(new JoinApprovedMail($requestingUser->name, $group->name));
                } catch (\Exception $e) {
                    \Log::error('Failed to send join approved email: ' . $e->getMessage());
                }
            }
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

            // Send email notification if user's email is verified
            if ($requestingUser->email_verified_at) {
                try {
                    Mail::to($requestingUser->email)->send(new JoinRejectedMail($requestingUser->name, $group->name));
                } catch (\Exception $e) {
                    \Log::error('Failed to send join rejected email: ' . $e->getMessage());
                }
            }
        }

        return response()->json(['message' => 'Join request rejected.']);
    }

    /**
     * Kick a member from the group
     * Only accessible by group leader
     */
    public function kickMember($groupId, $userId) {
        $group = StudyGroup::findOrFail($groupId);
        $currentUser = Auth::user();

        // Only leader can kick members
        if ($group->creator_id !== $currentUser->id) {
            return response()->json(['message' => 'Unauthorized. Only the group leader can remove members.'], 403);
        }

        // Cannot kick the leader themselves
        if ($userId == $group->creator_id) {
            return response()->json(['message' => 'The group leader cannot be removed.'], 400);
        }

        // Check if user is a member
        $isMember = $group->members()->where('users.id', $userId)->exists();
        if (!$isMember) {
            return response()->json(['message' => 'This user is not a member of the group.'], 404);
        }

        // Remove the member
        $group->members()->detach($userId);

        // Notify the removed user
        $removedUser = User::find($userId);
        if ($removedUser) {
            Notification::create([
                'user_id' => $userId,
                'type' => 'removed_from_group',
                'data' => [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'message' => "You have been removed from '{$group->name}'."
                ]
            ]);

            // Send email notification if user's email is verified
            if ($removedUser->email_verified_at) {
                try {
                    Mail::to($removedUser->email)->send(new RemovedFromGroupMail($removedUser->name, $group->name));
                } catch (\Exception $e) {
                    \Log::error('Failed to send removed from group email: ' . $e->getMessage());
                }
            }
        }

        return response()->json(['message' => 'Member removed successfully.']);
    }
}