<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ownership Transfer</title>
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
        .transfer-box {
            background: #faf5ff;
            border: 2px solid #8b5cf6;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
        }
        .transfer-visual {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        .user-badge {
            background: white;
            padding: 15px 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .user-name {
            font-weight: 900;
            color: #1e293b;
            font-size: 16px;
        }
        .user-role {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }
        .arrow {
            font-size: 32px;
            color: #8b5cf6;
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
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
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
            <h1>👥 Ownership Transfer</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>

            @if($isNewOwner)
                <p>You have been assigned as the new leader of a study group. Congratulations on your new responsibility!</p>

                <div class="transfer-box">
                    <p style="margin: 0 0 20px 0; text-align: center; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px;">Leadership Transfer</p>
                    <div class="transfer-visual">
                        <div class="user-badge">
                            <div class="user-name">Previous Leader</div>
                            <div class="user-role">Member</div>
                        </div>
                        <span class="arrow">→</span>
                        <div class="user-badge" style="border: 2px solid #8b5cf6;">
                            <div class="user-name">{{ $user->name }}</div>
                            <div class="user-role" style="color: #8b5cf6;">Group Leader</div>
                        </div>
                    </div>
                </div>

                <p>You are now the leader of <strong>{{ $group->name }}</strong> and have full management rights for this group.</p>
            @else
                <p>The ownership of your study group has been transferred to another member by an administrator.</p>

                <div class="transfer-box">
                    <p style="margin: 0 0 20px 0; text-align: center; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px;">Leadership Transfer</p>
                    <div class="transfer-visual">
                        <div class="user-badge" style="border: 2px solid #e2e8f0;">
                            <div class="user-name">{{ $user->name }}</div>
                            <div class="user-role">Member</div>
                        </div>
                        <span class="arrow">←</span>
                        <div class="user-badge" style="border: 2px solid #8b5cf6;">
                            <div class="user-name">{{ $newOwner->name }}</div>
                            <div class="user-role" style="color: #8b5cf6;">New Leader</div>
                        </div>
                    </div>
                </div>

                <p><strong>{{ $newOwner->name }}</strong> is now the leader of <strong>{{ $group->name }}</strong>. You will remain a member of the group with standard member privileges.</p>
            @endif

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
                @if($isNewOwner)
                    <div class="detail-row">
                        <span class="label">Previous Leader</span>
                        <span class="value">Previous Owner</span>
                    </div>
                @else
                    <div class="detail-row">
                        <span class="label">New Leader</span>
                        <span class="value">{{ $newOwner->name }}</span>
                    </div>
                @endif
                <div class="detail-row">
                    <span class="label">Transfer Date</span>
                    <span class="value">{{ now()->format('F j, Y \a\t g:i A') }}</span>
                </div>
            </div>

            @if($isNewOwner)
                <div class="info-box">
                    <p style="margin: 0 0 10px 0; font-weight: 700; color: #1e293b;">As the new group leader, you can now:</p>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Review and approve join requests</li>
                        <li>Schedule group meetings and events</li>
                        <li>Manage group members and settings</li>
                        <li>Update group details and description</li>
                        <li>Transfer ownership to another member (if needed)</li>
                        <li>Archive or dissolve the group</li>
                    </ul>
                </div>

                <p><strong>Important Responsibilities:</strong></p>
                <p>As a group leader, you're responsible for maintaining a positive and productive learning environment. Please ensure all group activities comply with our community guidelines and policies.</p>
            @else
                <div class="info-box">
                    <p style="margin: 0 0 10px 0; font-weight: 700; color: #1e293b;">What this means for you:</p>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>You remain a valued member of the group</li>
                        <li>You can still participate in all group activities</li>
                        <li>You can attend meetings and study sessions</li>
                        <li>You can communicate with group members</li>
                        <li>The new leader will handle administrative tasks</li>
                    </ul>
                </div>

                <p>If you have any questions about this change, please contact the new group leader or our support team.</p>
            @endif

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
