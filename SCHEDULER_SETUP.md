# Event Reminder Email Scheduler Setup

This system automatically sends reminder emails to all group members the day before their scheduled meetings.

## How It Works

1. **Daily Check**: Every day at 9:00 AM, the system checks for events happening tomorrow
2. **Send Reminders**: For each event found, emails are sent to all verified members of that group
3. **Email Content**: Members receive a reminder with event title, time, location, and group name

## Server Setup (Production)

To enable the scheduler on your production server, you need to add a single cron entry:

### Step 1: Edit Crontab

```bash
crontab -e
```

### Step 2: Add This Line

```
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

**Important**: Replace `/path/to/your/project` with your actual project path (e.g., `/var/www/study_gp`)

### Example:
```
* * * * * cd /var/www/study_gp && php artisan schedule:run >> /dev/null 2>&1
```

This cron job runs every minute and Laravel's scheduler decides which tasks to execute based on the schedule defined in `app/Console/Kernel.php`.

## Testing Locally

You can test the reminder command manually:

```bash
php artisan events:send-reminders
```

This will:
- Check for events happening tomorrow
- Send reminder emails to all group members with verified emails
- Show a summary of emails sent/failed

## Customization

### Change the Time

Edit `app/Console/Kernel.php` and modify the time:

```php
$schedule->command('events:send-reminders')
         ->dailyAt('18:00')  // Change to 6:00 PM
         ->timezone('America/New_York');
```

### Change the Timezone

Available timezones:
- `America/New_York` (Eastern)
- `America/Chicago` (Central)
- `America/Denver` (Mountain)
- `America/Los_Angeles` (Pacific)
- Or any valid PHP timezone

### Change Reminder Timing

To send reminders 2 days before (instead of 1 day), edit `app/Console/Commands/SendEventReminders.php`:

```php
// Change line 38 from:
$tomorrow = Carbon::tomorrow();

// To:
$twoDaysAhead = Carbon::now()->addDays(2);
```

## Files Created

1. **app/Console/Commands/SendEventReminders.php** - The command that sends reminders
2. **app/Mail/EventReminderMail.php** - Mail class for reminder emails
3. **resources/views/emails/event-reminder.blade.php** - Email template
4. **app/Console/Kernel.php** (updated) - Scheduler configuration

## Troubleshooting

### Emails Not Sending?

1. Check if cron is running: `crontab -l`
2. Test manually: `php artisan events:send-reminders`
3. Check Laravel logs: `storage/logs/laravel.log`
4. Verify SMTP settings in `.env`

### No Events Found?

Make sure:
- Events have `group_id` set (personal events won't get reminders)
- Events are scheduled for tomorrow
- Group has members with verified emails

## Email Preview

The reminder email includes:
- 🎨 Branded orange header
- 📅 Event title and group name
- 🕐 Formatted date and time
- 📍 Location (if provided)
- ⏰ "Tomorrow!" badge for emphasis
