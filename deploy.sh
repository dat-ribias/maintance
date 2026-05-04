#!/bin/bash
# Quick deploy script
# Usage: ./deploy.sh [APP_ID]
# Example: ./deploy.sh 500

PROJECT_DIR="/c/Users/user/Desktop/format_maintance"
APP_ID=${1:-402}

if [ -z "$1" ]; then
    echo "⚠️  Không có App ID, sử dụng mặc định: 402"
else
    echo "🎯 App ID: $APP_ID"
fi

echo "📂 Chuyển đến: $PROJECT_DIR"
cd "$PROJECT_DIR" || exit 1

echo "🔨 Building..."
npm run build || exit 1

echo "🚀 Deploying to app $APP_ID..."
npx dotenv -e .env -- node scripts/deploy-merge.js "$APP_ID" dist/control.js

if [ $? -eq 0 ]; then
    echo "✅ Deploy thành công!"
else
    echo "❌ Deploy thất bại!"
    exit 1
fi
