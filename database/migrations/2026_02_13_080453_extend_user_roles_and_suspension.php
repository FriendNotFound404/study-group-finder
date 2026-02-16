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
        Schema::table('users', function (Blueprint $table) {
            // Modify role enum to include moderator and admin
            $table->enum('role', ['member', 'leader', 'moderator', 'admin'])->default('member')->change();

            // Add suspension fields
            $table->timestamp('suspended_until')->nullable()->after('banned');
            $table->text('suspension_reason')->nullable()->after('suspended_until');
            $table->text('banned_reason')->nullable()->after('suspension_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revert role enum to original
            $table->enum('role', ['member', 'leader'])->default('member')->change();

            // Remove suspension fields
            $table->dropColumn(['suspended_until', 'suspension_reason', 'banned_reason']);
        });
    }
};
