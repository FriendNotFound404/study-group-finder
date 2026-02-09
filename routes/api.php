<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\StudyGroupController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\FeedbackController;
use App\Http\Controllers\API\DiscoverController;
use App\Http\Controllers\API\CalendarController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\AdminController;

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Admin Notifications (public access for admin panel)
Route::get('/admin/notifications', [AdminController::class, 'getNotifications']);
Route::get('/admin/notifications/unread-count', [AdminController::class, 'getUnreadCount']);
Route::post('/admin/notifications/mark-read', [AdminController::class, 'markNotificationsAsRead']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Groups
    Route::apiResource('groups', StudyGroupController::class);
    Route::post('/groups/{id}/join', [StudyGroupController::class, 'join']);
    Route::post('/groups/{id}/leave', [StudyGroupController::class, 'leave']);
    Route::get('/groups/{id}/members', [StudyGroupController::class, 'getMembers']);
    Route::get('/groups/{id}/pending-requests', [StudyGroupController::class, 'pendingRequests']);
    Route::post('/groups/{groupId}/approve/{userId}', [StudyGroupController::class, 'approveRequest']);
    Route::post('/groups/{groupId}/reject/{userId}', [StudyGroupController::class, 'rejectRequest']);
    Route::post('/groups/{groupId}/kick/{userId}', [StudyGroupController::class, 'kickMember']);

    // Chat
    Route::get('/groups/{id}/messages', [MessageController::class, 'index']);
    Route::post('/groups/{id}/messages', [MessageController::class, 'store']);

    // Discover
    Route::get('/discover/trending', [DiscoverController::class, 'trending']);
    Route::get('/discover/subjects', [DiscoverController::class, 'subjects']);
    Route::get('/discover/leaders', [DiscoverController::class, 'leaders']);
    Route::get('/discover/users/search', [DiscoverController::class, 'searchUsers']);

    // Feedback
    Route::get('/feedback', [FeedbackController::class, 'index']);
    Route::post('/feedback', [FeedbackController::class, 'store']);

    // Calendar
    Route::get('/calendar/events', [CalendarController::class, 'index']);
    Route::post('/calendar/events', [CalendarController::class, 'store']);
    Route::delete('/calendar/events/{id}', [CalendarController::class, 'destroy']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/profile/stats', [ProfileController::class, 'stats']);

    // User Profiles (view other users)
    Route::get('/users/{id}', [ProfileController::class, 'showUser']);
    Route::get('/users/{id}/stats', [ProfileController::class, 'userStats']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-read', [NotificationController::class, 'markAsRead']);

    // Admin Routes (requires admin middleware)
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/system-overview', [AdminController::class, 'getSystemOverview']);
        Route::get('/analytics', [AdminController::class, 'getAnalytics']);

        // User Management
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

        // Group Management
        Route::get('/groups', [AdminController::class, 'getGroups']);
        Route::put('/groups/{id}', [AdminController::class, 'updateGroup']);
        Route::delete('/groups/{id}', [AdminController::class, 'deleteGroup']);

        // Feedback Management
        Route::get('/feedback', [AdminController::class, 'getFeedback']);
        Route::delete('/feedback/{id}', [AdminController::class, 'deleteFeedback']);

        // User Moderation (Warn/Ban)
        Route::post('/users/{id}/warn', [AdminController::class, 'warnUser']);
        Route::post('/users/{id}/ban', [AdminController::class, 'banUser']);
        Route::post('/users/{id}/unban', [AdminController::class, 'unbanUser']);
    });
});