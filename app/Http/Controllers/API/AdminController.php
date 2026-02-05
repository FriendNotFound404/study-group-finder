<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StudyGroup;
use App\Models\Message;
use App\Models\Feedback;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function dashboard()
    {
        $stats = [
            'total_users' => User::count(),
            'total_groups' => StudyGroup::count(),
            'total_messages' => Message::count(),
            'total_feedback' => Feedback::count(),
            'active_groups' => StudyGroup::where('status', 'open')->count(),
            'leaders_count' => User::where('role', 'leader')->count(),
            'members_count' => User::where('role', 'member')->count(),

            // Recent activity
            'recent_users' => User::orderBy('created_at', 'desc')->take(5)->get(),
            'recent_groups' => StudyGroup::with('creator')->orderBy('created_at', 'desc')->take(5)->get(),
            'recent_feedback' => Feedback::orderBy('created_at', 'desc')->take(5)->get(),

            // Charts data
            'groups_by_status' => StudyGroup::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'groups_by_faculty' => StudyGroup::select('faculty', DB::raw('count(*) as count'))
                ->groupBy('faculty')
                ->orderBy('count', 'desc')
                ->take(10)
                ->get(),
            'users_by_role' => User::select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Get all users with pagination
     */
    public function getUsers(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $search = $request->get('search', '');

        $users = User::when($search, function ($query, $search) {
            return $query->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('major', 'like', "%{$search}%");
        })
        ->withCount(['createdGroups', 'joinedGroups'])
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Update user details
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role' => 'sometimes|in:member,leader',
            'major' => 'sometimes|string|max:255',
            'bio' => 'sometimes|string',
            'location' => 'sometimes|string|max:255',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Delete user
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting admin
        if ($user->email === 'admin@au.edu') {
            return response()->json(['message' => 'Cannot delete admin account'], 403);
        }

        // Delete user's groups (transfer ownership or delete)
        StudyGroup::where('creator_id', $id)->delete();

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Get all groups with pagination
     */
    public function getGroups(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $search = $request->get('search', '');
        $status = $request->get('status', '');

        $groups = StudyGroup::with('creator')
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('faculty', 'like', "%{$search}%");
            })
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($groups);
    }

    /**
     * Update group details
     */
    public function updateGroup(Request $request, $id)
    {
        $group = StudyGroup::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string|max:255',
            'faculty' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'max_members' => 'sometimes|integer|min:2',
            'location' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:open,closed,archived',
        ]);

        $group->update($validated);

        return response()->json([
            'message' => 'Group updated successfully',
            'group' => $group
        ]);
    }

    /**
     * Delete group
     */
    public function deleteGroup($id)
    {
        $group = StudyGroup::findOrFail($id);

        // Delete associated messages
        Message::where('group_id', $id)->delete();

        $group->delete();

        return response()->json(['message' => 'Group deleted successfully']);
    }

    /**
     * Get all feedback with pagination
     */
    public function getFeedback(Request $request)
    {
        $perPage = $request->get('per_page', 20);

        $feedback = Feedback::orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($feedback);
    }

    /**
     * Delete feedback
     */
    public function deleteFeedback($id)
    {
        $feedback = Feedback::findOrFail($id);
        $feedback->delete();

        return response()->json(['message' => 'Feedback deleted successfully']);
    }

    /**
     * Get analytics data
     */
    public function getAnalytics()
    {
        // User growth over last 30 days
        $userGrowth = User::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count')
        )
        ->where('created_at', '>=', now()->subDays(30))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        // Group creation over last 30 days
        $groupGrowth = StudyGroup::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count')
        )
        ->where('created_at', '>=', now()->subDays(30))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        // Message activity
        $messageActivity = Message::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count')
        )
        ->where('created_at', '>=', now()->subDays(30))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        // Top groups by members
        $topGroups = StudyGroup::withCount('members')
            ->orderBy('members_count', 'desc')
            ->take(10)
            ->get();

        // Top subjects
        $topSubjects = StudyGroup::select('subject', DB::raw('count(*) as count'))
            ->groupBy('subject')
            ->orderBy('count', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'user_growth' => $userGrowth,
            'group_growth' => $groupGrowth,
            'message_activity' => $messageActivity,
            'top_groups' => $topGroups,
            'top_subjects' => $topSubjects,
        ]);
    }

    /**
     * Get system overview
     */
    public function getSystemOverview()
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        $todayUsers = User::whereDate('created_at', $today)->count();
        $yesterdayUsers = User::whereDate('created_at', $yesterday)->count();

        $todayGroups = StudyGroup::whereDate('created_at', $today)->count();
        $yesterdayGroups = StudyGroup::whereDate('created_at', $yesterday)->count();

        $todayMessages = Message::whereDate('created_at', $today)->count();
        $yesterdayMessages = Message::whereDate('created_at', $yesterday)->count();

        return response()->json([
            'users' => [
                'total' => User::count(),
                'today' => $todayUsers,
                'change' => $yesterdayUsers > 0 ? (($todayUsers - $yesterdayUsers) / $yesterdayUsers) * 100 : 0
            ],
            'groups' => [
                'total' => StudyGroup::count(),
                'today' => $todayGroups,
                'change' => $yesterdayGroups > 0 ? (($todayGroups - $yesterdayGroups) / $yesterdayGroups) * 100 : 0
            ],
            'messages' => [
                'total' => Message::count(),
                'today' => $todayMessages,
                'change' => $yesterdayMessages > 0 ? (($todayMessages - $yesterdayMessages) / $yesterdayMessages) * 100 : 0
            ],
            'feedback' => [
                'total' => Feedback::count(),
                'average_rating' => Feedback::avg('rating') ?? 0
            ]
        ]);
    }
}
