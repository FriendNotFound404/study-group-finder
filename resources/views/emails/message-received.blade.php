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
            background-color: #10b981;
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
        .message-box {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
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
        <h1>💬 New Message</h1>
    </div>
    <div class="content">
        <p>Hi {{ $recipientName }},</p>

        <p><strong>{{ $senderName }}</strong> sent a message in <strong>{{ $groupName }}</strong>:</p>

        <div class="message-box">
            <p style="margin: 0; font-style: italic; color: #555;">{{ $messagePreview }}</p>
        </div>

        <p>Log in to StudyGroupFinder to view the full message and reply.</p>

        <p>Best regards,<br>StudyHub</p>
    </div>
    <div class="footer">
        <p>You received this email because you are a member of {{ $groupName }}.</p>
    </div>
</body>
</html>
