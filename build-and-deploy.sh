#!/bin/bash
# Script để build và deploy từ bất kỳ đường dẫn nào
# Usage: ./build-and-deploy.sh [APP_ID]
# Example: ./build-and-deploy.sh 500

PROJECT_DIR="/c/Users/user/Desktop/format_maintance"
APP_ID=${1:-402}

if [ -z "$1" ]; then
    echo "⚠️  Không có App ID, sử dụng mặc định: 402"
else
    echo "🎯 App ID: $APP_ID"
fi

echo "📂 Chuyển đến thư mục project: $PROJECT_DIR"
cd "$PROJECT_DIR" || exit 1

echo "🔨 Building..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build thành công!"
    echo "🚀 Deploying to app $APP_ID..."
    npx dotenv -e .env -- node scripts/deploy-merge.js "$APP_ID" dist/format.js

    if [ $? -eq 0 ]; then
        echo "✅ Deploy thành công!"
    else
        echo "❌ Deploy thất bại!"
        exit 1
    fi
else
    echo "❌ Build thất bại!"
    exit 1
fi
