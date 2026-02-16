<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Group Approved</title>
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
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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
        .success-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            text-align: center;
        }
        .checkmark {
            width: 80px;
            height: 80px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 48px;
        }
        .group-details {
            background: #f8f9fb;
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
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
            text-align: right;
        }
        .info-box {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
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
            <h1>🎉 Group Approved!</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>

            <div class="success-box">
                <div class="checkmark">✓</div>
                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #065f46;">Your study group has been approved!</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #059669;">Your group is now live and accepting members.</p>
            </div>

            <p>Great news! Your study group has been reviewed and approved by our moderation team. Students can now discover and join your group.</p>

            <div class="group-details">
                <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 900;">Group Details</h3>
                <div class="detail-row">
                    <span class="label">Group Name</span>
                    <span class="value">{{ $group->name }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Subject</span>
                    <span class="value">{{ $group->subject }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Faculty</span>
                    <span class="value">{{ $group->faculty }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Max Members</span>
                    <span class="value">{{ $group->max_members }} students</span>
                </div>
                <div class="detail-row">
                    <span class="label">Location</span>
                    <span class="value">{{ $group->location }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Approved By</span>
                    <span class="value">{{ $adminName }}</span>
                </div>
            </div>

            <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: 700; color: #1e293b;">As the group leader, you can now:</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>Review and approve join requests from students</li>
                    <li>Schedule group meetings and study sessions</li>
                    <li>Manage group members and settings</li>
                    <li>Communicate with members via group chat</li>
                    <li>Update group details and preferences</li>
                </ul>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol style="line-height: 1.8;">
                <li>Log in to your account to access your group</li>
                <li>Schedule your first study session</li>
                <li>Welcome new members as they join</li>
                <li>Keep your group description and details up to date</li>
            </ol>

            <p>Thank you for contributing to our study community. We're excited to see your group grow and help students succeed together!</p>

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
