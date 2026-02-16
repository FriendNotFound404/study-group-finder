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
            background-color: #ef4444;
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
            border-left: 4px solid #ef4444;
        }
        .reason-box {
            background-color: #fef2f2;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #ef4444;
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
        <h1>❌ Meeting Cancelled</h1>
    </div>
    <div class="content">
        <p>Hi {{ $userName }},</p>

        <p>The following meeting for your study group <strong>{{ $groupName }}</strong> has been cancelled.</p>

        <div class="event-info">
            <h3 style="margin-top: 0; color: #ef4444;">{{ $eventTitle }}</h3>
            <p style="margin-bottom: 0;"><strong>📅 Scheduled Time:</strong> {{ $eventTime }}</p>
        </div>

        @if($cancellationReason)
        <div class="reason-box">
            <p style="margin: 0;"><strong>Reason from group leader:</strong></p>
            <p style="margin: 10px 0 0 0;">{{ $cancellationReason }}</p>
        </div>
        @else
        <p>The group leader did not provide a specific reason for the cancellation.</p>
        @endif

        <p>Please check your calendar for any other scheduled meetings. You can also check the group chat for updates.</p>

        <p>Best regards,<br>StudyGroupFinder Team</p>
    </div>
    <div class="footer">
        <p>You received this email because you are a member of {{ $groupName }}.</p>
    </div>
</body>
</html>
