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

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Groups
    Route::apiResource('groups', StudyGroupController::class);
    Route::post('/groups/{id}/join', [StudyGroupController::class, 'join']);
    Route::post('/groups/{id}/leave', [StudyGroupController::class, 'leave']);

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

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-read', [NotificationController::class, 'markAsRead']);
});