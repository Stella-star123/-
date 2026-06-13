@echo off
chcp 65001 >nul

:: 设置 Node.js 路径
set PATH=C:\Program Files\nodejs;%PATH%

echo ================================
echo   单词探险家 (Word Explorer)
echo ================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请检查安装
    pause
    exit /b 1
)

echo [检查] Node.js 版本：
node --version
echo.

:: 检查依赖是否安装
if not exist "%~dp0word-explorer-backend\node_modules" (
    echo [安装] 正在安装后端依赖...
    cd /d "%~dp0word-explorer-backend"
    call npm install
    cd /d "%~dp0"
)
if not exist "%~dp0word-explorer-frontend\node_modules" (
    echo [安装] 正在安装前端依赖...
    cd /d "%~dp0word-explorer-frontend"
    call npm install
    cd /d "%~dp0"
)

:: 启动后端
echo [后端] 正在启动...
start "WordExplorer-Backend" cmd /k "set PATH=C:\Program Files\nodejs;%%PATH%% && cd /d %~dp0word-explorer-backend && npm run dev"

:: 等待后端先启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [前端] 正在启动...
start "WordExplorer-Frontend" cmd /k "set PATH=C:\Program Files\nodejs;%%PATH%% && cd /d %~dp0word-explorer-frontend && npm run dev"

:: 等待前端启动
timeout /t 5 /nobreak >nul

:: 打开浏览器
echo [浏览器] 正在打开网页...
start http://localhost:5173

echo.
echo 全部启动完成！后端 http://localhost:3000  前端 http://localhost:5173
echo 关闭本窗口不影响前后端运行。
pause
