<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f97316;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .event-info {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f97316;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📅 New Meeting Scheduled</h1>
    </div>
    <div class="content">
        <p>Hi {{ $userName }},</p>

        <p>A new meeting has been scheduled for your study group <strong>{{ $groupName }}</strong>.</p>

        <div class="event-info">
            <h3 style="margin-top: 0; color: #f97316;">{{ $eventTitle }}</h3>
            <p style="margin-bottom: 0;"><strong>📅 Time:</strong> {{ $eventTime }}</p>
        </div>

        <p>Log in to your StudyGroupFinder account to view full event details and manage your schedule.</p>

        <p>Best regards,<br>StudyGroupFinder Team</p>
    </div>
    <div class="footer">
        <p>You received this email because you are a member of {{ $groupName }}.</p>
    </div>
</body>
</html>
