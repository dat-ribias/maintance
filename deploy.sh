#!/bin/bash
# Quick deploy script
# Usage: ./deploy.sh [APP_IDs]
# Example: ./deploy.sh 500
# Example: ./deploy.sh 402,403,404,405

PROJECT_DIR="/c/Users/user/Desktop/format_maintance"
APP_IDS=${1:-402}

if [ -z "$1" ]; then
    echo "⚠️  Không có App ID, sử dụng mặc định: 402"
else
    echo "🎯 App IDs: $APP_IDS"
fi

echo "📂 Chuyển đến: $PROJECT_DIR"
cd "$PROJECT_DIR" || exit 1

echo "🔨 Building..."
npm run build || exit 1

# Split APP_IDS by comma and deploy to each
IFS=',' read -ra APP_ARRAY <<< "$APP_IDS"
TOTAL=${#APP_ARRAY[@]}
SUCCESS=0
FAILED=0

for APP_ID in "${APP_ARRAY[@]}"; do
    APP_ID=$(echo "$APP_ID" | xargs)  # Trim whitespace
    echo ""
    echo "🚀 Deploying to app $APP_ID... ($((SUCCESS + FAILED + 1))/$TOTAL)"

    if npx dotenv -e .env -- node scripts/deploy-merge.js "$APP_ID" dist/control.js; then
        echo "✅ App $APP_ID: Deploy thành công!"
        ((SUCCESS++))
    else
        echo "❌ App $APP_ID: Deploy thất bại!"
        ((FAILED++))
    fi
done

echo ""
echo "📊 Kết quả: $SUCCESS thành công, $FAILED thất bại (Tổng: $TOTAL)"

if [ $FAILED -eq 0 ]; then
    echo "🎉 Tất cả deploy thành công!"
    exit 0
else
    echo "⚠️  Có $FAILED app deploy thất bại!"
    exit 1
fi
