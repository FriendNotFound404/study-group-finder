<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create';
    protected $description = 'Create or update an admin user';

    public function handle()
    {
        $email = $this->ask('Enter admin email', 'admin@au.edu');
        $name = $this->ask('Enter admin name', 'Admin User');
        $password = $this->secret('Enter admin password');

        $user = User::where('email', $email)->first();

        if ($user) {
            $this->info("User with email {$email} already exists. Updating...");

            $user->name = $name;
            $user->password = Hash::make($password);
            $user->role = 'admin';
            $user->banned = false;
            $user->banned_reason = null;
            $user->suspended_until = null;
            $user->suspension_reason = null;
            $user->warnings = 0;
            $user->email_verified_at = now();
            $user->save();

            $this->info("Admin user updated successfully!");
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);

            $this->info("Admin user created successfully!");
        }

        $this->table(
            ['Field', 'Value'],
            [
                ['Email', $user->email],
                ['Name', $user->name],
                ['Role', $user->role],
                ['Banned', $user->banned ? 'Yes' : 'No'],
                ['Suspended', $user->suspended_until ? 'Yes' : 'No'],
                ['Email Verified', $user->email_verified_at ? 'Yes' : 'No'],
            ]
        );

        return 0;
    }
}
