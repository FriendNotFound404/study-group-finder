<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['member', 'leader'])->default('member');
            }
            if (!Schema::hasColumn('users', 'major')) {
                $table->string('major')->nullable();
            }
            if (!Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable();
            }
            if (!Schema::hasColumn('users', 'location')) {
                $table->string('location')->nullable();
            }
            if (!Schema::hasColumn('users', 'karma_points')) {
                $table->integer('karma_points')->default(0);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('users', 'role')) $columns[] = 'role';
            if (Schema::hasColumn('users', 'major')) $columns[] = 'major';
            if (Schema::hasColumn('users', 'bio')) $columns[] = 'bio';
            if (Schema::hasColumn('users', 'location')) $columns[] = 'location';
            if (Schema::hasColumn('users', 'karma_points')) $columns[] = 'karma_points';
            
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
