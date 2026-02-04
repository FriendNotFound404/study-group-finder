<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('study_groups')) {
            Schema::create('study_groups', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('subject');
                $table->string('faculty');
                $table->text('description');
                $table->integer('max_members')->default(5);
                $table->string('location');
                $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
                $table->enum('status', ['open', 'closed', 'archived'])->default('open');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('group_user')) {
            Schema::create('group_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('group_id')->constrained('study_groups')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('messages')) {
            Schema::create('messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('group_id')->constrained('study_groups')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->text('content');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('feedbacks')) {
            Schema::create('feedbacks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('group_name');
                $table->integer('rating');
                $table->text('text');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('title');
                $table->string('type'); 
                $table->dateTime('start_time');
                $table->string('location')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('events');
        Schema::dropIfExists('feedbacks');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('group_user');
        Schema::dropIfExists('study_groups');
    }
};
