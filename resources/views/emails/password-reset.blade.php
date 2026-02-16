<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
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
            background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%);
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
        .password-box {
            background: #f0fdfa;
            border: 2px solid #14b8a6;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            text-align: center;
        }
        .password {
            font-size: 32px;
            font-weight: 900;
            color: #0f766e;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 20px;
            border-radius: 8px;
            display: inline-block;
            margin: 10px 0;
        }
        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
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
            <h1>🔑 Password Reset</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>

            <p>An administrator has reset your password for your Study Group Finder account. Below is your new temporary password:</p>

            <div class="password-box">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f766e; text-transform: uppercase; letter-spacing: 1px;">Your New Password</p>
                <div class="password">{{ $newPassword }}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">Please keep this password secure</p>
            </div>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Account Email</span>
                    <span class="value">{{ $user->email }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Reset By</span>
                    <span class="value">{{ $adminName }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Date</span>
                    <span class="value">{{ now()->format('F j, Y \a\t g:i A') }}</span>
                </div>
            </div>

            <div class="warning-box">
                <p style="margin: 0; font-weight: 600;">⚠️ Important Security Notice</p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">For your security, please change this password immediately after logging in. Do not share this password with anyone.</p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol style="line-height: 1.8;">
                <li>Log in to your account using your email and the new password above</li>
                <li>Navigate to your account settings</li>
                <li>Change your password to something unique and memorable</li>
                <li>Enable two-factor authentication for added security (if available)</li>
            </ol>

            <p>If you did not request this password reset or have any concerns about your account security, please contact our support team immediately.</p>

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
