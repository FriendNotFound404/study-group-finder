<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Role Updated</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
        .role-change-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            text-align: center;
        }
        .role-transition {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        .role-badge {
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 900;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .role-old {
            background: #e2e8f0;
            color: #64748b;
        }
        .role-new {
            background: #10b981;
            color: white;
        }
        .arrow {
            font-size: 32px;
            color: #10b981;
        }
        .permissions-box {
            background: #f1f5f9;
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
        ul {
            line-height: 1.8;
        }
        ul li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Role Updated</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>

            <p>Your account role has been updated by an administrator. This change grants you new permissions and responsibilities on the platform.</p>

            <div class="role-change-box">
                <p style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Role Change</p>
                <div class="role-transition">
                    <span class="role-badge role-old">{{ ucfirst($oldRole) }}</span>
                    <span class="arrow">→</span>
                    <span class="role-badge role-new">{{ ucfirst($newRole) }}</span>
                </div>
            </div>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Updated By</span>
                    <span class="value">{{ $adminName }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Date</span>
                    <span class="value">{{ now()->format('F j, Y \a\t g:i A') }}</span>
                </div>
            </div>

            <div class="permissions-box">
                <p style="margin: 0 0 15px 0; font-weight: 700; color: #1e293b; font-size: 16px;">Your New Permissions:</p>

                @if($newRole === 'admin')
                    <ul>
                        <li><strong>Full Platform Access</strong> - Manage all aspects of the platform</li>
                        <li><strong>User Management</strong> - Create, edit, suspend, and delete user accounts</li>
                        <li><strong>Group Management</strong> - Moderate, approve, and manage all study groups</li>
                        <li><strong>Analytics Dashboard</strong> - View comprehensive platform statistics</li>
                        <li><strong>Report Management</strong> - Review and resolve user reports</li>
                        <li><strong>System Configuration</strong> - Modify platform settings and configurations</li>
                    </ul>
                @elseif($newRole === 'moderator')
                    <ul>
                        <li><strong>Content Moderation</strong> - Review and moderate user-generated content</li>
                        <li><strong>Report Management</strong> - Review and resolve user reports</li>
                        <li><strong>User Suspension</strong> - Temporarily suspend users who violate policies</li>
                        <li><strong>Group Moderation</strong> - Moderate study group content and activities</li>
                        <li><strong>Limited Analytics</strong> - View moderation-related statistics</li>
                    </ul>
                @elseif($newRole === 'leader')
                    <ul>
                        <li><strong>Group Management</strong> - Create and manage your own study groups</li>
                        <li><strong>Event Organization</strong> - Schedule and manage group meetings and events</li>
                        <li><strong>Member Management</strong> - Approve or reject group join requests</li>
                        <li><strong>Standard Features</strong> - All regular user capabilities</li>
                    </ul>
                @else
                    <ul>
                        <li><strong>Join Groups</strong> - Request to join existing study groups</li>
                        <li><strong>Create Groups</strong> - Start your own study groups</li>
                        <li><strong>Participate</strong> - Attend events and engage in discussions</li>
                        <li><strong>Basic Access</strong> - Use all standard platform features</li>
                    </ul>
                @endif
            </div>

            <p><strong>What's Next?</strong></p>
            <p>Log in to your account to explore your new capabilities. If you have any questions about your new role or permissions, please don't hesitate to reach out to our support team.</p>

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
