<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class UpdateWarningCounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'warnings:update-counts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update all users warning counts to match their active (non-expired) warnings';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating warning counts for all users...');

        $users = User::all();
        $updated = 0;

        foreach ($users as $user) {
            $activeWarningsCount = $user->activeWarnings()->count();

            if ($user->warnings !== $activeWarningsCount) {
                $user->warnings = $activeWarningsCount;
                $user->save();
                $updated++;
            }
        }

        $this->info("Updated warning counts for {$updated} users.");

        return Command::SUCCESS;
    }
}
