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
        $admins = [
            [
                'name' => 'Admin',
                'email' => 'admin@au.edu',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'major' => 'Administration',
                'bio' => 'System Administrator',
                'location' => 'AU Campus',
            ],
            [
                'name' => 'StudyHub Admin',
                'email' => 'studyhub.studygroupfinder@gmail.com',
                'password' => Hash::make('studygroupfinder123'),
                'role' => 'admin',
                'major' => 'Administration',
                'bio' => 'StudyHub System Administrator',
                'location' => 'AU Campus',
            ],
        ];

        foreach ($admins as $adminData) {
            $existingAdmin = User::where('email', $adminData['email'])->first();

            if (!$existingAdmin) {
                User::create($adminData);
                $this->command->info('Admin user created: ' . $adminData['email']);
            } else {
                // Update existing admin to have admin role
                $existingAdmin->update(['role' => 'admin']);
                $this->command->info('Admin user already exists (role updated): ' . $adminData['email']);
            }
        }
    }
}
