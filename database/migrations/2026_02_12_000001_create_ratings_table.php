<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained('study_groups')->onDelete('cascade');
            $table->decimal('group_rating', 2, 1); // Rating for group quality (1.0-5.0)
            $table->decimal('leader_rating', 2, 1); // Rating for leader effectiveness (1.0-5.0)
            $table->integer('update_count')->default(0); // Track number of updates (max 3)
            $table->timestamps();

            // Ensure one rating per user per group
            $table->unique(['user_id', 'group_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('ratings');
    }
};
