<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StudyGroup;
use App\Models\Message;
use App\Models\Feedback;
use App\Models\Notification;
use App\Mail\UserWarnedMail;
use App\Mail\UserBannedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

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

    /**
     * Warn a user (from report)
     */
    public function warnUser(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        // Prevent warning admin
        if ($user->email === 'admin@au.edu') {
            return response()->json(['message' => 'Cannot warn admin account'], 403);
        }

        $user->warnings = ($user->warnings ?? 0) + 1;

        // Auto-ban if warnings reach 3
        $autoBanned = false;
        if ($user->warnings >= 3) {
            $user->banned = true;
            $autoBanned = true;
        }

        $user->save();

        // Send notification to warned user
        if ($autoBanned) {
            $banReason = 'Automatic ban after receiving 3 warnings';
            Notification::create([
                'user_id' => $user->id,
                'type' => 'user_banned',
                'data' => [
                    'message' => 'Your account has been banned due to multiple warnings (3/3)',
                    'reason' => $banReason,
                    'warnings' => $user->warnings
                ]
            ]);

            // Send ban email if user's email is verified
            if ($user->email_verified_at) {
                try {
                    Mail::to($user->email)->send(new UserBannedMail(
                        $user->name,
                        $banReason
                    ));
                } catch (\Exception $e) {
                    \Log::error('Failed to send ban email: ' . $e->getMessage());
                }
            }
        } else {
            $warningReason = 'You have received a warning from the admin. Please review our community guidelines.';
            Notification::create([
                'user_id' => $user->id,
                'type' => 'user_warned',
                'data' => [
                    'message' => 'You have received a warning from the admin',
                    'warnings' => $user->warnings,
                    'max_warnings' => 3
                ]
            ]);

            // Send warning email if user's email is verified
            if ($user->email_verified_at) {
                try {
                    Mail::to($user->email)->send(new UserWarnedMail(
                        $user->name,
                        $warningReason,
                        $user->warnings
                    ));
                } catch (\Exception $e) {
                    \Log::error('Failed to send warning email: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => 'User warned successfully',
            'user' => $user,
            'auto_banned' => $autoBanned
        ]);
    }

    /**
     * Ban a user directly
     */
    public function banUser($userId)
    {
        $user = User::findOrFail($userId);

        // Prevent banning admin
        if ($user->email === 'admin@au.edu') {
            return response()->json(['message' => 'Cannot ban admin account'], 403);
        }

        $user->banned = true;
        $user->save();

        $banReason = 'Direct ban by administrator. Please contact support for assistance.';

        // Send notification to banned user
        Notification::create([
            'user_id' => $user->id,
            'type' => 'user_banned',
            'data' => [
                'message' => 'Your account has been banned by an administrator',
                'reason' => $banReason,
                'contact' => 'Please contact support for assistance'
            ]
        ]);

        // Send ban email if user's email is verified
        if ($user->email_verified_at) {
            try {
                Mail::to($user->email)->send(new UserBannedMail(
                    $user->name,
                    $banReason
                ));
            } catch (\Exception $e) {
                \Log::error('Failed to send ban email: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'User banned successfully',
            'user' => $user
        ]);
    }

    /**
     * Unban a user
     */
    public function unbanUser($userId)
    {
        $user = User::findOrFail($userId);

        $user->banned = false;
        $user->warnings = 0; // Reset warnings when unbanning
        $user->save();

        return response()->json([
            'message' => 'User unbanned successfully',
            'user' => $user
        ]);
    }

    /**
     * Get admin notifications (report submissions)
     */
    public function getNotifications()
    {
        // Get admin user
        $admin = User::where('email', 'admin@au.edu')->first();

        if (!$admin) {
            return response()->json([]);
        }

        // Get only report-related notifications for admin
        $notifications = Notification::where('user_id', $admin->id)
            ->where('type', 'report_submitted')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    /**
     * Get unread notification count for admin
     */
    public function getUnreadCount()
    {
        // Get admin user
        $admin = User::where('email', 'admin@au.edu')->first();

        if (!$admin) {
            return response()->json(['count' => 0]);
        }

        $count = Notification::where('user_id', $admin->id)
            ->where('type', 'report_submitted')
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark all admin notifications as read
     */
    public function markNotificationsAsRead()
    {
        // Get admin user
        $admin = User::where('email', 'admin@au.edu')->first();

        if (!$admin) {
            return response()->json(['message' => 'Admin not found'], 404);
        }

        Notification::where('user_id', $admin->id)
            ->where('type', 'report_submitted')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }
}
