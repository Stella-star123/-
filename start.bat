@echo off
echo ================================
echo   单词探险家 (Word Explorer)
echo ================================
echo.

:: 启动后端
echo [后端] 正在启动...
start "WordExplorer-Backend" cmd /k "cd /d %~dp0word-explorer-backend && npm run dev"

:: 等待后端先启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [前端] 正在启动...
start "WordExplorer-Frontend" cmd /k "cd /d %~dp0word-explorer-frontend && npm run dev"

:: 等待前端启动
timeout /t 5 /nobreak >nul

:: 打开浏览器
echo [浏览器] 正在打开网页...
start http://localhost:5173

echo.
echo 全部启动完成！后端 http://localhost:3000  前端 http://localhost:5173
echo 关闭本窗口不影响前后端运行。
pause
