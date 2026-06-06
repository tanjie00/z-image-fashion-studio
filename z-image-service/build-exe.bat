@echo off
REM ============================================================
REM  Z-Image Bridge Service - Windows EXE Build Script
REM  通义MAI Z-Image 6B 文生图模型服务 - Windows打包脚本
REM ============================================================
REM
REM  前置条件:
REM    1. Python 3.10+ 已安装并加入PATH
REM    2. 在Windows上运行此脚本
REM
REM  使用方法:
REM    build-exe.bat          - 打包控制台版本
REM    build-exe.bat gui      - 打包带GUI托盘的版本
REM    build-exe.bat clean    - 清理构建文件
REM
REM ============================================================

setlocal enabledelayedexpansion

echo ============================================================
echo   Z-Image Bridge Service - Windows Build Tool
echo   通义MAI Z-Image 6B 文生图模型服务
echo ============================================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

if "%1"=="clean" goto :clean
if "%1"=="gui" goto :build_gui

:check_python
echo [1/5] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python！请安装 Python 3.10+ 并加入PATH
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [OK] Python %PYVER%

:install_deps
echo.
echo [2/5] 安装依赖包...
pip install --quiet pyinstaller
pip install --quiet fastapi uvicorn pydantic gradio_client
if errorlevel 1 (
    echo [警告] 部分依赖安装失败，继续构建...
)
echo [OK] 依赖安装完成

:build_exe
echo.
echo [3/5] 构建 Windows EXE...
echo.

if "%1"=="gui" (
    set MAIN_FILE=launcher.py
    set EXE_NAME=Z-Image-Service-GUI
    set CONSOLE_FLAG=--noconsole
    echo   模式: GUI托盘版本
) else (
    set MAIN_FILE=main.py
    set EXE_NAME=Z-Image-Service
    set CONSOLE_FLAG=--console
    echo   模式: 控制台版本
)

pyinstaller --clean %CONSOLE_FLAG% ^
    --name "%EXE_NAME%" ^
    --onefile ^
    --optimize 1 ^
    --hidden-import=uvicorn.logging ^
    --hidden-import=uvicorn.loops.auto ^
    --hidden-import=uvicorn.protocols.http.auto ^
    --hidden-import=uvicorn.protocols.websockets.auto ^
    --hidden-import=uvicorn.lifespan.on ^
    --hidden-import=fastapi ^
    --hidden-import=fastapi.middleware.cors ^
    --hidden-import=pydantic ^
    --hidden-import=pydantic.fields ^
    --hidden-import=pydantic.main ^
    --hidden-import=pydantic.types ^
    --hidden-import=anyio._backends._asyncio ^
    --hidden-import=httpcore ^
    --hidden-import=httpx ^
    --hidden-import=gradio_client ^
    --hidden-import=gradio_client.client ^
    --hidden-import=websockets ^
    --hidden-import=websockets.legacy ^
    --hidden-import=websockets.legacy.client ^
    --exclude-module=tkinter ^
    --exclude-module=matplotlib ^
    --exclude-module=numpy ^
    --exclude-module=PIL ^
    --exclude-module=scipy ^
    --exclude-module=pandas ^
    --exclude-module=IPython ^
    --exclude-module=pytest ^
    %MAIN_FILE%

if errorlevel 1 (
    echo.
    echo [错误] 构建失败！
    pause
    exit /b 1
)

echo.
echo [4/5] 创建发布包...

REM 创建发布目录
set RELEASE_DIR=release\Z-Image-Service-Windows
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"

REM 复制EXE
copy "dist\%EXE_NAME%.exe" "%RELEASE_DIR%\" >nul

REM 复制配置文件
copy "start.bat" "%RELEASE_DIR%\" >nul 2>nul
copy "README.txt" "%RELEASE_DIR%\" >nul 2>nul

REM 创建默认启动脚本
(
echo @echo off
echo echo ============================================================
echo echo   Z-Image Bridge Service - Windows Launcher
echo echo   通义MAI Z-Image 6B 文生图模型服务
echo echo ============================================================
echo echo.
echo REM 默认使用ModelScope模式（推荐国内用户）
echo set ZIMAGE_MODE=modelscope
echo set ZIMAGE_PORT=8001
echo.
echo echo 正在启动 Z-Image 服务...
echo echo 模式: %ZIMAGE_MODE%
echo echo 端口: %ZIMAGE_PORT%
echo echo.
echo echo 服务启动后访问: http://localhost:%ZIMAGE_PORT%/health
echo echo 按 Ctrl+C 停止服务
echo echo.
echo "%EXE_NAME%.exe"
echo pause
) > "%RELEASE_DIR%\启动服务.bat"

REM 创建README
(
echo ============================================================
echo   Z-Image Bridge Service - Windows版
echo   通义MAI Z-Image 6B 文生图模型服务
echo ============================================================
echo.
echo 【快速启动】
echo   1. 双击 "启动服务.bat" 启动服务
echo   2. 服务启动后浏览器会自动打开
echo   3. 默认使用 ModelScope 模式（推荐国内用户）
echo.
echo 【配置说明】
echo   编辑 "启动服务.bat" 中的环境变量:
echo     ZIMAGE_MODE=modelscope   运行模式
echo       modelscope - ModelScope Space API（推荐国内）
echo       remote    - HuggingFace Space API
echo       api       - HuggingFace Inference API
echo       local     - 本地推理（需要NVIDIA GPU）
echo     ZIMAGE_PORT=8001         服务端口
echo     ZIMAGE_HF_TOKEN=         HuggingFace Token（api模式需要）
echo     ZIMAGE_MS_TOKEN=         ModelScope Token（可选）
echo.
echo 【模型来源】
echo   ModelScope:  https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/
echo   HuggingFace: https://huggingface.co/Tongyi-MAI/Z-Image/
echo.
echo 【API 接口】
echo   GET  /health        健康检查
echo   GET  /resolutions   获取支持的分辨率列表
echo   POST /generate      生成图片
echo   POST /generate/fallback  带回退的图片生成
echo.
echo 【系统要求】
echo   - Windows 10/11 64位
echo   - 网络连接（远程模式）
echo   - NVIDIA GPU + CUDA（本地模式，约24GB显存）
echo.
) > "%RELEASE_DIR%\README.txt"

echo [OK] 发布包已创建: %RELEASE_DIR%

echo.
echo [5/5] 构建完成！
echo.
echo   EXE文件: dist\%EXE_NAME%.exe
echo   发布包: %RELEASE_DIR%\
echo.
echo ============================================================
echo   构建成功！
echo ============================================================
pause
exit /b 0

:build_gui
echo   构建GUI版本...
goto :build_exe

:clean
echo 清理构建文件...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"
del /q *.spec 2>nul
echo [OK] 清理完成
pause
exit /b 0
