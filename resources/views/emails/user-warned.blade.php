<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-count {
            background: #dc2626;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .important {
            color: #dc2626;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ Account Warning</h1>
    </div>

    <div class="content">
        <p>Hello {{ $userName }},</p>

        <p>Your account has received a warning from the StudyHub moderation team.</p>

        <div class="warning-box">
            <p><strong>Reason for warning:</strong></p>
            <p>{{ $reason }}</p>

            <div style="margin-top: 15px;">
                <span class="warning-count">⚠️ Warning Count: {{ $warningCount }}</span>
            </div>
        </div>

        <p class="important">Please note: Multiple warnings may result in account suspension or permanent ban.</p>

        <p>We encourage you to review our community guidelines and adjust your behavior accordingly. If you believe this warning was issued in error, please contact the moderation team.</p>

        <p><strong>What to do next:</strong></p>
        <ul>
            <li>Review the StudyHub community guidelines</li>
            <li>Avoid repeating the behavior that led to this warning</li>
            <li>Contact support if you have questions or concerns</li>
        </ul>
    </div>

    <div class="footer">
        <p>This is an official notification from StudyHub moderation team.</p>
        <p>&copy; {{ date('Y') }} StudyHub. All rights reserved.</p>
    </div>
</body>
</html>
