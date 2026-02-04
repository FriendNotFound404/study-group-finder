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
    }

    public function down()
    {
        Schema::dropIfExists('group_user');
        Schema::dropIfExists('study_groups');
    }
};