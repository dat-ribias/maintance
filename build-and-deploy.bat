@echo off
REM Script để build và deploy từ bất kỳ đường dẫn nào (Windows)
REM Usage: build-and-deploy.bat [APP_ID]
REM Example: build-and-deploy.bat 500

set PROJECT_DIR=C:\Users\user\Desktop\format_maintance
set APP_ID=%1

if "%APP_ID%"=="" (
    set APP_ID=402
    echo ⚠️  Không có App ID, sử dụng mặc định: 402
) else (
    echo 🎯 App ID: %APP_ID%
)

echo 📂 Chuyển đến thư mục project: %PROJECT_DIR%
cd /d "%PROJECT_DIR%" || exit /b 1

echo 🔨 Building...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build thất bại!
    exit /b 1
)

echo ✅ Build thành công!
echo 🚀 Deploying to app %APP_ID%...
call dotenv -e .env -- node scripts/deploy-merge.js %APP_ID% dist/format.js

if %errorlevel% neq 0 (
    echo ❌ Deploy thất bại!
    exit /b 1
)

echo ✅ Deploy thành công!
