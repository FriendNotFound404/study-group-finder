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
            background-color: #f59e0b;
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
            border-left: 4px solid #f59e0b;
        }
        .event-detail {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .event-detail:last-child {
            border-bottom: none;
        }
        .event-detail strong {
            color: #f59e0b;
            display: inline-block;
            width: 100px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
        .reminder-badge {
            background-color: #fef3c7;
            color: #92400e;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Event Reminder</h1>
        <div class="reminder-badge">Tomorrow!</div>
    </div>
    <div class="content">
        <p>Hi {{ $userName }},</p>

        <p>This is a friendly reminder about your upcoming meeting tomorrow:</p>

        <div class="event-info">
            <h3 style="margin-top: 0; color: #f59e0b;">{{ $eventTitle }}</h3>

            <div class="event-detail">
                <strong>📅 Group:</strong> {{ $groupName }}
            </div>

            <div class="event-detail">
                <strong>🕐 Time:</strong> {{ $eventTime }}
            </div>

            @if($eventLocation)
            <div class="event-detail">
                <strong>📍 Location:</strong> {{ $eventLocation }}
            </div>
            @endif
        </div>

        <p>Don't forget to prepare for this meeting. We look forward to seeing you there!</p>

        <p>Best regards,<br>StudyGroupFinder Team</p>
    </div>
    <div class="footer">
        <p>You received this email because you are a member of {{ $groupName }}.</p>
    </div>
</body>
</html>
