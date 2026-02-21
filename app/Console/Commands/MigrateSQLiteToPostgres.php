<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateSQLiteToPostgres extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:migrate-to-postgres';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate all data from SQLite to PostgreSQL';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting migration from SQLite to PostgreSQL...');

        // Backup SQLite database path
        $sqlitePath = database_path('database.sqlite');

        if (!file_exists($sqlitePath)) {
            $this->error('SQLite database not found!');
            return 1;
        }

        // Connect to SQLite
        config(['database.connections.sqlite_backup' => [
            'driver' => 'sqlite',
            'database' => $sqlitePath,
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]]);

        // Define table order to respect foreign key constraints
        $tableOrder = [
            'users',
            'study_groups',
            'group_user',
            'events',
            'messages',
            'notifications',
            'personal_access_tokens',
            'feedback',
            'jobs',
            'cache',
            'sessions',
            'ratings',
            'reports',
            'moderation_logs',
            'user_activity_log',
            'user_warnings',
        ];

        // Get all tables from SQLite
        $allTables = DB::connection('sqlite_backup')
            ->select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

        $allTableNames = array_map(fn($t) => $t->name, $allTables);

        // Add any tables not in the ordered list to the end
        foreach ($allTableNames as $tableName) {
            if (!in_array($tableName, $tableOrder) && $tableName !== 'migrations') {
                $tableOrder[] = $tableName;
            }
        }

        $this->info('Found ' . count($allTableNames) . ' tables to migrate.');

        foreach ($tableOrder as $tableName) {
            // Skip if table doesn't exist in SQLite
            if (!in_array($tableName, $allTableNames)) {
                continue;
            }

            // Skip migrations table
            if ($tableName === 'migrations') {
                continue;
            }

            $this->info("Migrating table: {$tableName}");

            // Get all rows from SQLite
            $rows = DB::connection('sqlite_backup')
                ->table($tableName)
                ->get()
                ->toArray();

            if (count($rows) > 0) {
                // Convert objects to arrays
                $rows = array_map(function($row) {
                    return (array) $row;
                }, $rows);

                // Insert into PostgreSQL in chunks
                $chunks = array_chunk($rows, 100);

                foreach ($chunks as $chunk) {
                    DB::table($tableName)->insert($chunk);
                }

                $this->info("  ✓ Migrated " . count($rows) . " rows");
            } else {
                $this->info("  - No data to migrate");
            }
        }

        $this->info('');
        $this->info('Resetting PostgreSQL sequences...');

        // Reset all sequences to prevent duplicate key errors
        foreach ($tableOrder as $tableName) {
            if (!in_array($tableName, $allTableNames)) {
                continue;
            }

            try {
                DB::select("SELECT setval(pg_get_serial_sequence('{$tableName}', 'id'), COALESCE((SELECT MAX(id) FROM {$tableName}), 1), true)");
                $this->info("  ✓ Reset sequence for {$tableName}");
            } catch (\Exception $e) {
                // Skip tables without id column
            }
        }

        $this->info('');
        $this->info('✓ Migration completed successfully!');
        $this->info('');
        $this->info('Next steps:');
        $this->info('1. Update your .env file to use PostgreSQL permanently');
        $this->info('2. Backup your SQLite database file');
        $this->info('3. Test your application thoroughly');

        return 0;
    }
}
