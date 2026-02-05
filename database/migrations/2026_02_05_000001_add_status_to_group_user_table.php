<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('group_user', function (Blueprint $table) {
            // Add status column: 'pending', 'approved', 'rejected'
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('approved')
                  ->after('user_id');

            // Add approved_at timestamp to track when approval happened
            $table->timestamp('approved_at')->nullable()->after('status');

            // Add rejected_at timestamp to track when rejection happened
            $table->timestamp('rejected_at')->nullable()->after('approved_at');
        });

        // Update existing records to have 'approved' status
        // (so current members remain members)
        DB::table('group_user')->update([
            'status' => 'approved',
            'approved_at' => DB::raw('created_at')
        ]);
    }

    public function down()
    {
        Schema::table('group_user', function (Blueprint $table) {
            $table->dropColumn(['status', 'approved_at', 'rejected_at']);
        });
    }
};
