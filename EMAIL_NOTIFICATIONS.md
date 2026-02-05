# Email Notifications Setup

## Overview
Email notifications are now automatically sent when:
- 🔔 **Join Request** - User requests to join a closed group (sent to leader)
- ✅ **Join Approved** - Leader approves a join request (sent to requester)
- ❌ **Join Rejected** - Leader rejects a join request (sent to requester)
- 👥 **Group Join** - User joins an open group (sent to leader)
- 🚫 **Member Removed** - Leader removes a member from the group (sent to removed member)

## Development Setup

### 1. Configure Mail Settings in `.env`

For **development/testing**, emails will be logged to `storage/logs/laravel.log`:
```env
MAIL_MAILER=log
```

For **production with Gmail** (or any SMTP):
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="StudyHub"
```

### 2. Start the Queue Worker

Since emails are queued for background processing, start the queue worker:

```bash
php artisan queue:work
```

**For development**, you can also use:
```bash
php artisan queue:listen
```
(This automatically reloads when code changes)

### 3. Testing Email Notifications

1. Create a closed group (or change a group status to 'closed')
2. Request to join with a different user
3. Check either:
   - **Log file**: `storage/logs/laravel.log` (if using `MAIL_MAILER=log`)
   - **Email inbox**: If using real SMTP settings

## Production Setup

### Using Mailtrap (Recommended for Testing)
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
```

### Using SendGrid
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
```

### Using Mailgun
```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=your-domain.mailgun.org
MAILGUN_SECRET=your-mailgun-api-key
MAILGUN_ENDPOINT=api.mailgun.net
```

## Queue Configuration

The queue is already configured to use the database (`QUEUE_CONNECTION=database` in `.env`).

### Running Queue Worker as a Service (Production)

Use Supervisor to keep the queue worker running:

```bash
sudo apt-get install supervisor
```

Create `/etc/supervisor/conf.d/laravel-worker.conf`:
```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/your/project/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=your-user
numprocs=1
redirect_stderr=true
stdout_logfile=/path/to/your/project/storage/logs/worker.log
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

## Email Templates

Email templates are located in:
- `resources/views/emails/join-request.blade.php`
- `resources/views/emails/join-approved.blade.php`
- `resources/views/emails/join-rejected.blade.php`
- `resources/views/emails/group-join.blade.php`
- `resources/views/emails/member-removed.blade.php`

You can customize these templates to match your branding.

## Troubleshooting

### Emails not sending?
1. Check queue worker is running: `ps aux | grep "queue:work"`
2. Check logs: `tail -f storage/logs/laravel.log`
3. Check failed jobs: `php artisan queue:failed`
4. Retry failed jobs: `php artisan queue:retry all`

### Clear queue cache:
```bash
php artisan queue:clear
php artisan cache:clear
php artisan config:clear
```

### Test email manually:
```bash
php artisan tinker
```
```php
Mail::raw('Test email', function($message) {
    $message->to('test@example.com')->subject('Test');
});
```

## Features

✅ **Queued Emails** - Emails are sent in the background (non-blocking)
✅ **Professional Templates** - Laravel Markdown email templates
✅ **Action Buttons** - Direct links to view groups/notifications
✅ **Automatic Retry** - Failed emails are automatically retried
✅ **Email Validation** - Only sends if user has a valid email
