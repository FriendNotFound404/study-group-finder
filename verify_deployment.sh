#!/bin/bash

echo "🔍 Admin Panel Deployment Verification"
echo "======================================"
echo ""

echo "✅ Checking migrations..."
php artisan migrate:status | grep -E "(extend_user_roles|reports_and_moderation|group_approval|user_activity|performance_indexes)" && echo "  ✓ All new migrations ran" || echo "  ✗ Some migrations missing"
echo ""

echo "✅ Checking routes..."
ROUTE_COUNT=$(php artisan route:list --path=admin 2>/dev/null | grep -c "api/admin")
echo "  Found $ROUTE_COUNT admin routes"
echo ""

echo "✅ Checking models..."
php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); new App\Models\Report(); new App\Models\ModerationLog(); echo '  ✓ Report and ModerationLog models exist\n';" 2>/dev/null || echo "  ✗ Model loading failed"
echo ""

echo "✅ Checking controllers..."
[ -f "app/Http/Controllers/API/ReportsController.php" ] && echo "  ✓ ReportsController exists" || echo "  ✗ ReportsController missing"
[ -f "app/Http/Middleware/SuspendedUserMiddleware.php" ] && echo "  ✓ SuspendedUserMiddleware exists" || echo "  ✗ SuspendedUserMiddleware missing"
echo ""

echo "✅ Checking mail classes..."
MAIL_COUNT=$(ls -1 app/Mail/*.php 2>/dev/null | wc -l)
echo "  Found $MAIL_COUNT mail classes"
echo ""

echo "✅ Checking frontend build..."
[ -d "dist" ] && [ -f "dist/index.html" ] && echo "  ✓ Production build exists" || echo "  ✗ Production build missing"
echo ""

echo "✅ Checking admin components..."
[ -f "components/admin/AdminReports.tsx" ] && echo "  ✓ AdminReports component exists" || echo "  ✗ AdminReports missing"
[ -f "components/admin/AdminDashboard.tsx" ] && echo "  ✓ AdminDashboard component exists" || echo "  ✗ AdminDashboard missing"
[ -f "components/admin/AdminAnalytics.tsx" ] && echo "  ✓ AdminAnalytics component exists" || echo "  ✗ AdminAnalytics missing"
echo ""

echo "======================================"
echo "Deployment verification complete!"
echo "See ADMIN_PANEL_DEPLOYMENT.md for full details"
