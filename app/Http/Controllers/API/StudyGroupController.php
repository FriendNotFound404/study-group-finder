<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\StudyGroup;
use App\Models\Notification;
use App\Models\User;
use App\Models\Message;
use App\Services\KarmaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\GroupJoinNotification;
use App\Mail\JoinRequestMail;
use App\Mail\JoinApprovedMail;
use App\Mail\JoinRejectedMail;
use App\Mail\RemovedFromGroupMail;
use App\Mail\GroupApprovedMail;
use App\Mail\OwnershipTransferredMail;

class StudyGroupController extends Controller
{
    public function index() {
        $query = StudyGroup::with('creator');

        // Regular users should only see approved groups
        // Admins and moderators can see all groups (they manage them in admin panel)
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'moderator'])) {
            $query->where('approval_status', 'approved');
        }

        return $query->latest()->get();
    }

    public function store(Request $request) {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Check if email is verified
        if (!$user->email_verified_at) {
            return response()->json([
                'message' => 'Please verify your email address to create groups. Check your inbox for the verification link.',
                'requires_verification' => true
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'subject' => 'required|string',
            'faculty' => 'required|string',
            'description' => 'required|string',
            'max_members' => 'required|integer|min:2',
            'location' => 'required|string',
        ]);

        // Check if this is the user's first group creation
        $hasApprovedGroups = StudyGroup::where('creator_id', $user->id)
            ->where('approval_status', 'approved')
            ->exists();

        // First-time creators need approval, subsequent groups are auto-approved
        $approvalStatus = $hasApprovedGroups ? 'approved' : 'pending';

        $group = StudyGroup::create(array_merge($validated, [
            'creator_id' => $user->id,
            'status' => 'open',
            'approval_status' => $approvalStatus
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

        // Award karma for creating a group
        KarmaService::awardGroupCreation($user);

        // If group is pending, notify admins/moderators and send notification to user
        if ($approvalStatus === 'pending') {
            // Notify all admins and moderators
            $moderators = User::whereIn('role', ['admin', 'moderator'])->get();
            foreach ($moderators as $moderator) {
                Notification::create([
                    'user_id' => $moderator->id,
                    'type' => 'new_group_pending',
                    'data' => [
                        'message' => "New group '{$group->name}' by {$user->name} is pending approval",
                        'group_id' => $group->id,
                        'group_name' => $group->name,
                        'creator_name' => $user->name
                    ]
                ]);
            }

            return response()->json([
                'group' => $group,
                'message' => 'Group created successfully! It is pending approval by an administrator.',
                'pending_approval' => true
            ], 201);
        }

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
                        Mail::to($leader->email)->send(new GroupJoinNotification(
                            $user->name,
                            $group->name,
                            $group->id
                        ));
                    } catch (\Exception $e) {
                        \Log::error('Failed to send group join email: ' . $e->getMessage());
                    }
                }
            }

            // Award karma for joining a group
            KarmaService::awardGroupJoin($user);

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
        $user = Auth::user();

        $group->members()->detach($user->id);

        // Deduct karma for leaving a group
        KarmaService::penalizeLeave($user);

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

        // Delete the join_request notification for the leader
        Notification::where('user_id', $currentUser->id)
            ->where('type', 'join_request')
            ->where('data->group_id', $groupId)
            ->where('data->user_id', $userId)
            ->delete();

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

            // Award karma for successful join approval
            KarmaService::awardJoinApproval($requestingUser);
        }

        return response()->json(['message' => 'Join request approved successfully.']);
    }

    /**
     * Reject a join request
     */
    public function rejectRequest(Request $request, $groupId, $userId) {
        $group = StudyGroup::findOrFail($groupId);
        $currentUser = Auth::user();

        // Only leader can reject
        if ($group->creator_id !== $currentUser->id) {
            return response()->json(['message' => 'Unauthorized. Only the group leader can reject requests.'], 403);
        }

        // Check if request exists and is pending
        $joinRequest = $group->allMemberRelations()
            ->where('user_id', $userId)
            ->first();

        if (!$joinRequest || $joinRequest->pivot->status !== 'pending') {
            return response()->json(['message' => 'No pending request found for this user.'], 404);
        }

        // Get optional rejection reason from request body
        $rejectionReason = $request->input('reason');

        // Reject the request
        $group->allMemberRelations()->updateExistingPivot($userId, [
            'status' => 'rejected',
            'rejected_at' => now(),
            'updated_at' => now()
        ]);

        // Delete the join_request notification for the leader
        Notification::where('user_id', $currentUser->id)
            ->where('type', 'join_request')
            ->where('data->group_id', $groupId)
            ->where('data->user_id', $userId)
            ->delete();

        // Notify the requesting user that they were rejected
        $requestingUser = User::find($userId);
        if ($requestingUser) {
            $notificationMessage = "Your request to join '{$group->name}' was not approved at this time.";
            if ($rejectionReason) {
                $notificationMessage .= " Reason: {$rejectionReason}";
            }

            Notification::create([
                'user_id' => $userId,
                'type' => 'join_rejected',
                'data' => [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'message' => $notificationMessage,
                    'reason' => $rejectionReason
                ]
            ]);

            // Send email notification if user's email is verified
            if ($requestingUser->email_verified_at) {
                try {
                    Mail::to($requestingUser->email)->send(new JoinRejectedMail($requestingUser->name, $group->name, $rejectionReason));
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

            // Deduct karma for being kicked from a group
            KarmaService::penalizeKick($removedUser);
        }

        return response()->json(['message' => 'Member removed successfully.']);
    }

    /**
     * Transfer group ownership to another member (Admin only)
     */
    public function transferOwnership(Request $request, $groupId)
    {
        $validated = $request->validate([
            'new_owner_id' => 'required|exists:users,id'
        ]);

        $group = StudyGroup::with('members')->findOrFail($groupId);
        $newOwnerId = $validated['new_owner_id'];

        // Check if new owner is a member of the group
        $isNewOwnerMember = $group->members()->where('users.id', $newOwnerId)->exists();
        if (!$isNewOwnerMember) {
            return response()->json([
                'message' => 'The new owner must be a current member of the group.'
            ], 422);
        }

        $oldOwner = $group->creator;
        $newOwner = User::find($newOwnerId);

        // Transfer ownership
        $group->creator_id = $newOwnerId;
        $group->save();

        // Update new owner's role to leader if not already
        if ($newOwner->role === 'member') {
            $newOwner->role = 'leader';
            $newOwner->save();
        }

        // Notify old owner
        Notification::create([
            'user_id' => $oldOwner->id,
            'type' => 'ownership_transferred',
            'data' => [
                'message' => "Ownership of '{$group->name}' has been transferred to {$newOwner->name}",
                'group_id' => $group->id,
                'group_name' => $group->name,
                'new_owner' => $newOwner->name
            ]
        ]);

        // Notify new owner
        Notification::create([
            'user_id' => $newOwnerId,
            'type' => 'ownership_received',
            'data' => [
                'message' => "You are now the leader of '{$group->name}'",
                'group_id' => $group->id,
                'group_name' => $group->name,
                'previous_owner' => $oldOwner->name
            ]
        ]);

        // Send email to old owner if their email is verified
        if ($oldOwner->email_verified_at) {
            try {
                Mail::to($oldOwner->email)->send(new OwnershipTransferredMail(
                    $oldOwner,
                    $group,
                    $newOwner,
                    false // isNewOwner = false
                ));
            } catch (\Exception $e) {
                \Log::error('Failed to send ownership transferred email to old owner: ' . $e->getMessage());
            }
        }

        // Send email to new owner if their email is verified
        if ($newOwner->email_verified_at) {
            try {
                Mail::to($newOwner->email)->send(new OwnershipTransferredMail(
                    $newOwner,
                    $group,
                    $newOwner,
                    true // isNewOwner = true
                ));
            } catch (\Exception $e) {
                \Log::error('Failed to send ownership transferred email to new owner: ' . $e->getMessage());
            }
        }

        // Notify all other members
        $otherMembers = $group->members()->where('users.id', '!=', $newOwnerId)->get();
        foreach ($otherMembers as $member) {
            Notification::create([
                'user_id' => $member->id,
                'type' => 'group_leadership_changed',
                'data' => [
                    'message' => "{$newOwner->name} is now the leader of '{$group->name}'",
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'new_leader' => $newOwner->name
                ]
            ]);
        }

        return response()->json([
            'message' => 'Ownership transferred successfully',
            'group' => $group->fresh()->load('creator')
        ]);
    }

    /**
     * Approve a pending group (Admin only)
     */
    public function approveGroup($id)
    {
        $group = StudyGroup::with('creator')->findOrFail($id);

        if ($group->approval_status !== 'pending') {
            return response()->json([
                'message' => 'Group is not pending approval'
            ], 422);
        }

        $group->approval_status = 'approved';
        $group->approved_by = Auth::id();
        $group->approved_at = now();
        $group->save();

        // Notify group creator
        Notification::create([
            'user_id' => $group->creator_id,
            'type' => 'group_approved',
            'data' => [
                'message' => "Your group '{$group->name}' has been approved!",
                'group_id' => $group->id,
                'group_name' => $group->name
            ]
        ]);

        // Send email notification if creator's email is verified
        if ($group->creator->email_verified_at) {
            try {
                Mail::to($group->creator->email)->send(new GroupApprovedMail(
                    $group->creator,
                    $group,
                    Auth::user()->name
                ));
            } catch (\Exception $e) {
                \Log::error('Failed to send group approved email: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Group approved successfully',
            'group' => $group->fresh()
        ]);
    }

    /**
     * Reject a pending group (Admin only)
     */
    public function rejectGroup(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        $group = StudyGroup::with('creator')->findOrFail($id);

        if ($group->approval_status !== 'pending') {
            return response()->json([
                'message' => 'Group is not pending approval'
            ], 422);
        }

        $group->approval_status = 'rejected';
        $group->rejected_reason = $validated['reason'];
        $group->save();

        // Notify group creator
        Notification::create([
            'user_id' => $group->creator_id,
            'type' => 'group_rejected',
            'data' => [
                'message' => "Your group '{$group->name}' was not approved",
                'group_id' => $group->id,
                'group_name' => $group->name,
                'reason' => $validated['reason']
            ]
        ]);

        return response()->json([
            'message' => 'Group rejected',
            'group' => $group->fresh()
        ]);
    }

    /**
     * Force archive a group with reason (Admin only)
     */
    public function forceArchive(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        $group = StudyGroup::with(['creator', 'members'])->findOrFail($id);

        $group->status = 'archived';
        $group->save();

        // Notify group leader
        Notification::create([
            'user_id' => $group->creator_id,
            'type' => 'group_archived_admin',
            'data' => [
                'message' => "Your group '{$group->name}' has been archived by administration",
                'group_id' => $group->id,
                'group_name' => $group->name,
                'reason' => $validated['reason']
            ]
        ]);

        // Notify all members
        foreach ($group->members as $member) {
            Notification::create([
                'user_id' => $member->id,
                'type' => 'group_archived_admin',
                'data' => [
                    'message' => "The group '{$group->name}' has been archived by administration",
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'reason' => $validated['reason']
                ]
            ]);
        }

        return response()->json([
            'message' => 'Group archived successfully',
            'group' => $group->fresh(),
            'members_notified' => $group->members->count()
        ]);
    }

    /**
     * Get chat logs for a group (Admin only)
     */
    public function getChatLogs($groupId, Request $request)
    {
        $group = StudyGroup::findOrFail($groupId);

        $search = $request->get('search', '');

        $messages = Message::where('group_id', $groupId)
            ->with('user')
            ->when($search, function($query, $search) {
                return $query->where('content', 'like', "%{$search}%")
                    ->orWhereHas('user', function($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            })
            ->orderBy('created_at', 'asc')  // Changed to asc for chronological order
            ->get();

        return response()->json([
            'group' => $group,
            'messages' => $messages,
            'total_messages' => $messages->count()
        ]);
    }
}