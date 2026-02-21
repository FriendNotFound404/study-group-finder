<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For SQLite, we need to recreate the table with the new enum values
        // First, get all existing data
        $logs = DB::table('moderation_logs')->get();

        // Drop the old table
        Schema::dropIfExists('moderation_logs');

        // Recreate the table with new enum values
        Schema::create('moderation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moderator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('target_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('report_id')->nullable()->constrained('reports')->onDelete('set null');
            $table->enum('action_type', [
                'warn',
                'suspend',
                'unsuspend',
                'ban',
                'unban',
                'role_change',
                'password_reset',
                'group_approved',
                'group_rejected',
                'delete_content',
                'dismiss_report'
            ]);
            $table->integer('duration_days')->nullable();
            $table->text('reason');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // Restore the data
        foreach ($logs as $log) {
            DB::table('moderation_logs')->insert((array) $log);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Get all existing data
        $logs = DB::table('moderation_logs')->get();

        // Drop the table
        Schema::dropIfExists('moderation_logs');

        // Recreate with old enum values
        Schema::create('moderation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moderator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('target_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('report_id')->nullable()->constrained('reports')->onDelete('set null');
            $table->enum('action_type', ['warn', 'suspend', 'ban', 'unban', 'delete_content', 'dismiss_report']);
            $table->integer('duration_days')->nullable();
            $table->text('reason');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // Restore the data (excluding new action types)
        foreach ($logs as $log) {
            if (!in_array($log->action_type, ['unsuspend', 'role_change', 'password_reset', 'group_approved', 'group_rejected'])) {
                DB::table('moderation_logs')->insert((array) $log);
            }
        }
    }
};
