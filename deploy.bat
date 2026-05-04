@echo off
REM Quick deploy script - chỉ cần gõ: deploy 500
REM Thêm thư mục này vào PATH để gọi từ bất kỳ đâu

set PROJECT_DIR=C:\Users\user\Desktop\format_maintance
set APP_ID=%1

if "%APP_ID%"=="" (
    echo ❌ Vui lòng cung cấp App ID
    echo Usage: deploy [APP_ID]
    echo Example: deploy 500
    exit /b 1
)

echo 🎯 Deploying to app %APP_ID%...
cd /d "%PROJECT_DIR%" || exit /b 1
call npm run build && call dotenv -e .env -- node scripts/deploy-merge.js %APP_ID% dist/format.js
