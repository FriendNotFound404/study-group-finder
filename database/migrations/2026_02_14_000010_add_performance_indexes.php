<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Users table indexes
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
            $table->index('suspended_until', 'idx_users_suspended_until');
            $table->index('banned', 'idx_users_banned');
            $table->index('created_at', 'idx_users_created_at');
        });

        // Study groups table indexes
        Schema::table('study_groups', function (Blueprint $table) {
            $table->index('status', 'idx_study_groups_status');
            $table->index('approval_status', 'idx_study_groups_approval_status');
            $table->index('creator_id', 'idx_study_groups_creator_id');
            $table->index('created_at', 'idx_study_groups_created_at');
            $table->index(['status', 'approval_status'], 'idx_study_groups_status_approval');
        });

        // Reports table indexes
        Schema::table('reports', function (Blueprint $table) {
            $table->index('status', 'idx_reports_status');
            $table->index('priority', 'idx_reports_priority');
            $table->index('reporter_id', 'idx_reports_reporter_id');
            $table->index('reported_user_id', 'idx_reports_reported_user_id');
            $table->index('resolved_by', 'idx_reports_resolved_by');
            $table->index('created_at', 'idx_reports_created_at');
            $table->index(['status', 'priority'], 'idx_reports_status_priority');
        });

        // Moderation logs table indexes
        Schema::table('moderation_logs', function (Blueprint $table) {
            $table->index('moderator_id', 'idx_moderation_logs_moderator_id');
            $table->index('target_user_id', 'idx_moderation_logs_target_user_id');
            $table->index('action_type', 'idx_moderation_logs_action_type');
            $table->index('created_at', 'idx_moderation_logs_created_at');
        });

        // Notifications table indexes
        Schema::table('notifications', function (Blueprint $table) {
            $table->index('user_id', 'idx_notifications_user_id');
            $table->index('type', 'idx_notifications_type');
            $table->index('read_at', 'idx_notifications_read_at');
            $table->index('created_at', 'idx_notifications_created_at');
            $table->index(['user_id', 'read_at'], 'idx_notifications_user_read');
        });

        // Events table indexes
        Schema::table('events', function (Blueprint $table) {
            $table->index('user_id', 'idx_events_user_id');
            $table->index('group_id', 'idx_events_group_id');
            $table->index('start_time', 'idx_events_start_time');
            $table->index('type', 'idx_events_type');
            $table->index(['group_id', 'start_time'], 'idx_events_group_start');
        });

        // Group user pivot table indexes
        Schema::table('group_user', function (Blueprint $table) {
            $table->index('user_id', 'idx_group_user_user_id');
            $table->index('group_id', 'idx_group_user_group_id');
            $table->index('is_leader', 'idx_group_user_is_leader');
            $table->index('created_at', 'idx_group_user_created_at');
        });

        // Messages table indexes
        Schema::table('messages', function (Blueprint $table) {
            $table->index('group_id', 'idx_messages_group_id');
            $table->index('user_id', 'idx_messages_user_id');
            $table->index('created_at', 'idx_messages_created_at');
            $table->index(['group_id', 'created_at'], 'idx_messages_group_created');
        });

        // User activity log indexes
        Schema::table('user_activity_log', function (Blueprint $table) {
            $table->index('user_id', 'idx_user_activity_log_user_id');
            $table->index('activity_date', 'idx_user_activity_log_activity_date');
            $table->index('activity_type', 'idx_user_activity_log_activity_type');
            $table->index('activity_hour', 'idx_user_activity_log_activity_hour');
            $table->index('day_of_week', 'idx_user_activity_log_day_of_week');
        });

        // Ratings table indexes (if exists)
        if (Schema::hasTable('ratings')) {
            Schema::table('ratings', function (Blueprint $table) {
                $table->index('user_id', 'idx_ratings_user_id');
                $table->index('group_id', 'idx_ratings_group_id');
                $table->index('created_at', 'idx_ratings_created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Users table indexes
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_suspended_until');
            $table->dropIndex('idx_users_banned');
            $table->dropIndex('idx_users_created_at');
        });

        // Study groups table indexes
        Schema::table('study_groups', function (Blueprint $table) {
            $table->dropIndex('idx_study_groups_status');
            $table->dropIndex('idx_study_groups_approval_status');
            $table->dropIndex('idx_study_groups_creator_id');
            $table->dropIndex('idx_study_groups_created_at');
            $table->dropIndex('idx_study_groups_status_approval');
        });

        // Reports table indexes
        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex('idx_reports_status');
            $table->dropIndex('idx_reports_priority');
            $table->dropIndex('idx_reports_reporter_id');
            $table->dropIndex('idx_reports_reported_user_id');
            $table->dropIndex('idx_reports_resolved_by');
            $table->dropIndex('idx_reports_created_at');
            $table->dropIndex('idx_reports_status_priority');
        });

        // Moderation logs table indexes
        Schema::table('moderation_logs', function (Blueprint $table) {
            $table->dropIndex('idx_moderation_logs_moderator_id');
            $table->dropIndex('idx_moderation_logs_target_user_id');
            $table->dropIndex('idx_moderation_logs_action_type');
            $table->dropIndex('idx_moderation_logs_created_at');
        });

        // Notifications table indexes
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_user_id');
            $table->dropIndex('idx_notifications_type');
            $table->dropIndex('idx_notifications_read_at');
            $table->dropIndex('idx_notifications_created_at');
            $table->dropIndex('idx_notifications_user_read');
        });

        // Events table indexes
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('idx_events_user_id');
            $table->dropIndex('idx_events_group_id');
            $table->dropIndex('idx_events_start_time');
            $table->dropIndex('idx_events_type');
            $table->dropIndex('idx_events_group_start');
        });

        // Group user pivot table indexes
        Schema::table('group_user', function (Blueprint $table) {
            $table->dropIndex('idx_group_user_user_id');
            $table->dropIndex('idx_group_user_group_id');
            $table->dropIndex('idx_group_user_is_leader');
            $table->dropIndex('idx_group_user_created_at');
        });

        // Messages table indexes
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_group_id');
            $table->dropIndex('idx_messages_user_id');
            $table->dropIndex('idx_messages_created_at');
            $table->dropIndex('idx_messages_group_created');
        });

        // User activity log indexes
        Schema::table('user_activity_log', function (Blueprint $table) {
            $table->dropIndex('idx_user_activity_log_user_id');
            $table->dropIndex('idx_user_activity_log_activity_date');
            $table->dropIndex('idx_user_activity_log_activity_type');
            $table->dropIndex('idx_user_activity_log_activity_hour');
            $table->dropIndex('idx_user_activity_log_day_of_week');
        });

        // Ratings table indexes (if exists)
        if (Schema::hasTable('ratings')) {
            Schema::table('ratings', function (Blueprint $table) {
                $table->dropIndex('idx_ratings_user_id');
                $table->dropIndex('idx_ratings_group_id');
                $table->dropIndex('idx_ratings_created_at');
            });
        }
    }
};
