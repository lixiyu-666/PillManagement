@echo off
echo ========================================
echo   Medication App Build Script
echo ========================================
echo.

set ANDROID_DIR=E:\item\PillManagement\PillManagement-main\fuyaojiance-main\android
set FRONTEND_DIR=E:\item\PillManagement\PillManagement-main\fuyaojiance-main\frontend
set ASSETS_DIR=E:\item\PillManagement\PillManagement-main\fuyaojiance-main\android\app\src\main\assets\www
set GRADLE_HOME=C:\gradle

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] frontend/package.json not found
    pause
    exit /b 1
)

echo Step 1/4: Navigate to frontend...
cd /d "%FRONTEND_DIR%"
echo Current: %CD%

if not exist "node_modules" (
    echo [Step 2/4] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
) else (
    echo [SKIP] Dependencies already installed
)

echo [Step 3/4] Building frontend...
call npm run build
if errorlevel 1 (
    echo [ERROR] npm run build failed
    pause
    exit /b 1
)

echo [Step 4/4] Copying to Android assets...
if not exist "%ASSETS_DIR%" (
    mkdir "%ASSETS_DIR%"
)

xcopy /E /I /Y dist\* "%ASSETS_DIR%\"
if errorlevel 1 (
    echo [ERROR] Copy failed
    pause
    exit /b 1
)

cd /d "%ANDROID_DIR%"
echo [Step 5/5] Building APK...
call "%GRADLE_HOME%\bin\gradle.bat" assembleDebug

if errorlevel 1 (
    echo [ERROR] APK build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESS!
echo ========================================
echo.
echo APK: app\build\outputs\apk\debug\app-debug.apk
echo.
pause
