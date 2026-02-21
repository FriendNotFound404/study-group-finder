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
        Schema::table('users', function (Blueprint $table) {
            // Add suspension fields
            $table->timestamp('suspended_until')->nullable()->after('banned');
            $table->text('suspension_reason')->nullable()->after('suspended_until');
            $table->text('banned_reason')->nullable()->after('suspension_reason');
        });

        // Modify role column for PostgreSQL compatibility
        if (DB::getDriverName() === 'pgsql') {
            // For PostgreSQL, drop the old check constraint and recreate
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'leader', 'moderator', 'admin'))");
        } else {
            // For SQLite and MySQL, use enum change
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['member', 'leader', 'moderator', 'admin'])->default('member')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove suspension fields
            $table->dropColumn(['suspended_until', 'suspension_reason', 'banned_reason']);
        });

        // Revert role column for PostgreSQL compatibility
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'leader'))");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['member', 'leader'])->default('member')->change();
            });
        }
    }
};
