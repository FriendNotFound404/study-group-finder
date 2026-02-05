<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin already exists
        $existingAdmin = User::where('email', 'admin@au.edu')->first();

        if (!$existingAdmin) {
            User::create([
                'name' => 'Admin',
                'email' => 'admin@au.edu',
                'password' => Hash::make('admin123'),
                'major' => 'Administration',
                'bio' => 'System Administrator',
                'location' => 'AU Campus',
            ]);

            $this->command->info('Admin user created successfully!');
        } else {
            $this->command->info('Admin user already exists.');
        }
    }
}
