@echo off
chcp 65001 >nul
echo ========================================
echo   Android 前端打包脚本
echo ========================================
echo.

:: 检查前端目录
if not exist "..\frontend\package.json" (
    echo [错误] 未找到 frontend/package.json
    echo 请在 android 目录下运行此脚本
    pause
    exit /b 1
)

:: 进入前端目录
cd ..\frontend

:: 检查 node_modules
if not exist "node_modules" (
    echo [步骤 1/3] 安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
)

:: 打包前端
echo [步骤 2/3] 打包前端...
call npm run build
if errorlevel 1 (
    echo [错误] npm run build 失败
    pause
    exit /b 1
)

:: 复制到 assets
echo [步骤 3/3] 复制到 Android assets...

:: 创建目标目录
if not exist "..\android\app\src\main\assets\www" (
    mkdir "..\android\app\src\main\assets\www"
)

:: 复制文件
xcopy /E /I /Y /Q "dist\*" "..\android\app\src\main\assets\www\"
if errorlevel 1 (
    echo [错误] 复制文件失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 前端资源已复制到:
echo   android\app\src\main\assets\www\
echo.
echo 现在可以重新构建 APK:
echo   ./gradlew assembleDebug
echo.
pause
