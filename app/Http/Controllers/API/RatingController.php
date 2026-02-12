<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Rating;
use App\Models\StudyGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RatingController extends Controller
{
    /**
     * Submit or update a rating for a group
     * POST /api/groups/{groupId}/rate
     */
    public function store(Request $request, $groupId)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $group = StudyGroup::findOrFail($groupId);

        // Check if user is an approved member of the group
        $isMember = $group->members()->where('user_id', $user->id)->exists();

        if (!$isMember) {
            return response()->json([
                'message' => 'You must be an approved member to rate this group'
            ], 403);
        }

        // Validate ratings
        $validated = $request->validate([
            'group_rating' => 'required|numeric|min:1|max:5',
            'leader_rating' => 'required|numeric|min:1|max:5',
        ]);

        // Find existing rating or create new one
        $rating = Rating::where('user_id', $user->id)
            ->where('group_id', $groupId)
            ->first();

        if ($rating) {
            // Updating existing rating - check update limit
            if ($rating->update_count >= 3) {
                return response()->json([
                    'message' => 'Maximum number of updates (3) reached for this rating'
                ], 422);
            }

            // Update the rating
            $rating->group_rating = $validated['group_rating'];
            $rating->leader_rating = $validated['leader_rating'];
            $rating->update_count += 1;
            $rating->save();

            $editsRemaining = 3 - $rating->update_count;
        } else {
            // Create new rating
            $rating = Rating::create([
                'user_id' => $user->id,
                'group_id' => $groupId,
                'group_rating' => $validated['group_rating'],
                'leader_rating' => $validated['leader_rating'],
                'update_count' => 0
            ]);

            $editsRemaining = 3;
        }

        return response()->json([
            'success' => true,
            'rating' => $rating,
            'edits_remaining' => $editsRemaining,
            'message' => 'Rating submitted successfully'
        ], 200);
    }

    /**
     * Get current user's rating for a specific group
     * GET /api/groups/{groupId}/my-rating
     */
    public function show($groupId)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $rating = Rating::where('user_id', $user->id)
            ->where('group_id', $groupId)
            ->first();

        return response()->json([
            'rating' => $rating
        ], 200);
    }

    /**
     * Delete user's rating for a group
     * DELETE /api/groups/{groupId}/rate
     */
    public function destroy($groupId)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $rating = Rating::where('user_id', $user->id)
            ->where('group_id', $groupId)
            ->first();

        if (!$rating) {
            return response()->json([
                'message' => 'No rating found to delete'
            ], 404);
        }

        $rating->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rating deleted successfully'
        ], 200);
    }
}
