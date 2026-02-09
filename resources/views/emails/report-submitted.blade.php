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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .info-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-item {
            margin: 10px 0;
        }
        .info-item strong {
            color: #1f2937;
        }
        .severity {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
        }
        .severity-high {
            background: #fee2e2;
            color: #991b1b;
        }
        .severity-medium {
            background: #fef3c7;
            color: #92400e;
        }
        .severity-low {
            background: #dbeafe;
            color: #1e40af;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #7c3aed;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ New Report Submitted</h1>
    </div>

    <div class="content">
        <p>Hello Admin,</p>

        <p>A new report has been submitted on StudyHub and requires your attention.</p>

        <div class="info-box">
            <div class="info-item">
                <strong>Reported by:</strong> {{ $reporterName }}
            </div>
            <div class="info-item">
                <strong>Reported user/group:</strong> {{ $reportedUser }}
            </div>
            <div class="info-item">
                <strong>Severity:</strong>
                @if($severity >= 4)
                    <span class="severity severity-high">High ({{ $severity }}/5)</span>
                @elseif($severity >= 3)
                    <span class="severity severity-medium">Medium ({{ $severity }}/5)</span>
                @else
                    <span class="severity severity-low">Low ({{ $severity }}/5)</span>
                @endif
            </div>
            <div class="info-item">
                <strong>Report ID:</strong> #{{ $feedbackId }}
            </div>
        </div>

        <p>Please review this report in the admin panel and take appropriate action if necessary.</p>

        <center>
            <a href="http://localhost:5173/#/admin/reports" class="button">View in Admin Panel</a>
        </center>
    </div>

    <div class="footer">
        <p>This is an automated notification from StudyHub.</p>
        <p>&copy; {{ date('Y') }} StudyHub. All rights reserved.</p>
    </div>
</body>
</html>
