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
        Schema::create('user_activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('activity_type', ['login', 'group_create', 'group_join', 'message_sent', 'event_create']);
            $table->date('activity_date')->index();
            $table->tinyInteger('activity_hour'); // 0-23
            $table->tinyInteger('day_of_week'); // 0-6 (0 = Sunday)
            $table->timestamps();

            // Index for fast analytics queries
            $table->index(['activity_date', 'activity_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_activity_log');
    }
};
