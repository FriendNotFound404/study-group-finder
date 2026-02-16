<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Suspended</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
        }
        .content {
            padding: 40px 30px;
        }
        .alert-box {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info-box {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 700;
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .value {
            font-weight: 600;
            color: #1e293b;
        }
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
        p {
            margin: 16px 0;
        }
        strong {
            color: #1e293b;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Account Suspended</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>

            <div class="alert-box">
                <p style="margin: 0; font-weight: 600;">Your account has been temporarily suspended and you will not be able to access the platform until the suspension period ends.</p>
            </div>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Suspended Until</span>
                    <span class="value">{{ \Carbon\Carbon::parse($suspendedUntil)->format('F j, Y \a\t g:i A') }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Reason</span>
                    <span class="value">{{ $reason }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Moderator</span>
                    <span class="value">{{ $moderatorName }}</span>
                </div>
            </div>

            <p><strong>What this means:</strong></p>
            <ul style="line-height: 1.8;">
                <li>You cannot log in to your account</li>
                <li>You cannot access any study groups or events</li>
                <li>Your profile will be hidden from other users</li>
                <li>All your data will be preserved</li>
            </ul>

            <p><strong>After the suspension period:</strong></p>
            <ul style="line-height: 1.8;">
                <li>Your account will be automatically reactivated</li>
                <li>You will be able to log in and use all features normally</li>
                <li>Your groups and events will be restored</li>
            </ul>

            <p>If you believe this suspension was made in error, please contact our support team to discuss your case.</p>

            <p>Best regards,<br>
            <strong>Study Group Finder Team</strong></p>
        </div>

        <div class="footer">
            <p>This is an automated message from Study Group Finder.<br>
            Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
