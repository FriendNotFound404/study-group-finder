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
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
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
        .ban-box {
            background: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .ban-badge {
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
        <h1>🚫 Account Banned</h1>
    </div>

    <div class="content">
        <p>Hello {{ $userName }},</p>

        <p class="important">Your StudyHub account has been permanently banned.</p>

        <div class="ban-box">
            <p><strong>Reason for ban:</strong></p>
            <p>{{ $reason }}</p>

            <div style="margin-top: 15px;">
                <span class="ban-badge">🚫 ACCOUNT BANNED</span>
            </div>
        </div>

        <p><strong>What this means:</strong></p>
        <ul>
            <li>You can no longer access your StudyHub account</li>
            <li>All your groups and memberships have been suspended</li>
            <li>Your profile is no longer visible to other users</li>
            <li>You cannot create a new account using the same email</li>
        </ul>

        <p>If you believe this ban was issued in error or have questions about this decision, please contact our moderation team at <a href="mailto:admin@studyhub.com">admin@studyhub.com</a>.</p>

        <p><strong>Appeal Process:</strong></p>
        <p>If you wish to appeal this ban, please send a detailed email explaining why you believe this decision should be reconsidered. All appeals are reviewed within 5-7 business days.</p>
    </div>

    <div class="footer">
        <p>This is an official notification from StudyHub moderation team.</p>
        <p>&copy; {{ date('Y') }} StudyHub. All rights reserved.</p>
    </div>
</body>
</html>
