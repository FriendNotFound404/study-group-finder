<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Feedback;
use App\Models\Report;
use App\Models\User;

class MigrateFeedbackToReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:feedback-to-reports';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate old feedback entries that were actually reports to the reports table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting migration of feedback to reports...');

        // Find all feedback entries that start with "Report: " (old report format)
        $oldReports = Feedback::where('group_name', 'LIKE', 'Report: %')->get();

        if ($oldReports->isEmpty()) {
            $this->info('No old reports found in feedback table.');
            return 0;
        }

        $this->info("Found {$oldReports->count()} old reports to migrate.");
        $migrated = 0;
        $failed = 0;

        foreach ($oldReports as $feedback) {
            try {
                // Extract reported user name from group_name (format: "Report: John Doe")
                $reportedUserName = str_replace('Report: ', '', $feedback->group_name);

                // Parse the comment to extract details
                $text = $feedback->comment;
                $parts = explode("\n\n", $text);

                // Extract reason
                $reason = 'other';
                if (isset($parts[0]) && str_contains($parts[0], 'Reason: ')) {
                    $reasonText = str_replace('Reason: ', '', $parts[0]);
                    $reason = $this->mapReason($reasonText);
                }

                // Extract description
                $description = $text;
                if (isset($parts[1]) && str_contains($parts[1], 'Details: ')) {
                    $description = str_replace('Details: ', '', $parts[1]);
                }

                // Extract reported user ID and email from the text
                $reportedUserId = null;
                $reportedUserEmail = null;
                if (preg_match('/Reported User ID: (\d+)/', $text, $matches)) {
                    $reportedUserId = (int)$matches[1];
                }
                if (preg_match('/Reported User Email: ([^\s]+)/', $text, $matches)) {
                    $reportedUserEmail = $matches[1];
                }

                // Find the reported user
                $reportedUser = null;
                if ($reportedUserId) {
                    $reportedUser = User::find($reportedUserId);
                } elseif ($reportedUserEmail) {
                    $reportedUser = User::where('email', $reportedUserEmail)->first();
                } else {
                    // Try to find by name
                    $reportedUser = User::where('name', $reportedUserName)->first();
                }

                if (!$reportedUser) {
                    $this->warn("Skipping feedback ID {$feedback->id}: Could not find reported user '{$reportedUserName}'");
                    $failed++;
                    continue;
                }

                // Map rating to priority
                $priority = $this->mapPriority($feedback->rating);

                // Create the report
                Report::create([
                    'reporter_id' => $feedback->user_id,
                    'reported_user_id' => $reportedUser->id,
                    'reason' => $reason,
                    'description' => $description,
                    'status' => 'pending',
                    'priority' => $priority,
                    'created_at' => $feedback->created_at,
                    'updated_at' => $feedback->updated_at,
                ]);

                // Delete the old feedback entry
                $feedback->delete();

                $migrated++;
                $this->info("Migrated feedback ID {$feedback->id} → Report against user '{$reportedUser->name}'");

            } catch (\Exception $e) {
                $this->error("Failed to migrate feedback ID {$feedback->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("\nMigration complete!");
        $this->info("Successfully migrated: {$migrated}");
        $this->info("Failed: {$failed}");

        return 0;
    }

    /**
     * Map old reason text to new reason codes
     */
    private function mapReason($reasonText)
    {
        $reasonMap = [
            'Harassment' => 'harassment',
            'Harassment or Bullying' => 'harassment',
            'Inappropriate Content' => 'inappropriate_content',
            'Spam' => 'spam',
            'Spam or Advertising' => 'spam',
            'Impersonation' => 'fake_profile',
            'Hate Speech' => 'harassment',
            'Violence' => 'harassment',
            'Threats or Violence' => 'harassment',
            'Privacy Violation' => 'inappropriate_content',
            'Other' => 'other',
            'Other Violation' => 'other'
        ];

        return $reasonMap[$reasonText] ?? 'other';
    }

    /**
     * Map rating (1-5) to priority
     */
    private function mapPriority($rating)
    {
        $priorityMap = [
            1 => 'low',
            2 => 'low',
            3 => 'medium',
            4 => 'high',
            5 => 'urgent'
        ];

        return $priorityMap[$rating] ?? 'medium';
    }
}
