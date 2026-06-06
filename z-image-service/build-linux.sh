#!/bin/bash
# ============================================================
#  Z-Image Bridge Service - Linux/Mac Build Script
#  通义MAI Z-Image 6B 文生图模型服务 - Linux打包脚本
# ============================================================
#
#  使用方法:
#    ./build-linux.sh          - 打包为Linux可执行文件
#    ./build-linux.sh clean    - 清理构建文件
#
# ============================================================

set -e
cd "$(dirname "$0")"

if [ "$1" = "clean" ]; then
    echo "清理构建文件..."
    rm -rf build/ dist/ release/
    echo "[OK] 清理完成"
    exit 0
fi

echo "============================================================"
echo "  Z-Image Bridge Service - Linux Build Tool"
echo "  通义MAI Z-Image 6B 文生图模型服务"
echo "============================================================"
echo ""

# 检查 Python
echo "[1/4] 检查 Python 环境..."
if ! command -v python3 &>/dev/null; then
    echo "[错误] 未找到 Python3！请安装 Python 3.10+"
    exit 1
fi
PYVER=$(python3 --version 2>&1)
echo "[OK] $PYVER"

# 安装依赖
echo ""
echo "[2/4] 安装依赖包..."
pip3 install --quiet pyinstaller fastapi uvicorn pydantic gradio_client 2>/dev/null || \
pip install --quiet pyinstaller fastapi uvicorn pydantic gradio_client 2>/dev/null || \
pip3 install --break-system-packages --quiet pyinstaller fastapi uvicorn pydantic gradio_client
echo "[OK] 依赖安装完成"

# 构建
echo ""
echo "[3/4] 构建 Linux 可执行文件..."
echo ""

pyinstaller --clean --console \
    --name "Z-Image-Service" \
    --onefile \
    --optimize 1 \
    --hidden-import=uvicorn.logging \
    --hidden-import=uvicorn.loops.auto \
    --hidden-import=uvicorn.protocols.http.auto \
    --hidden-import=uvicorn.protocols.websockets.auto \
    --hidden-import=uvicorn.lifespan.on \
    --hidden-import=fastapi \
    --hidden-import=fastapi.middleware.cors \
    --hidden-import=pydantic \
    --hidden-import=pydantic.fields \
    --hidden-import=pydantic.main \
    --hidden-import=pydantic.types \
    --hidden-import=anyio._backends._asyncio \
    --hidden-import=httpcore \
    --hidden-import=httpx \
    --hidden-import=gradio_client \
    --hidden-import=gradio_client.client \
    --hidden-import=websockets \
    --exclude-module=tkinter \
    --exclude-module=matplotlib \
    --exclude-module=numpy \
    --exclude-module=PIL \
    --exclude-module=scipy \
    --exclude-module=pandas \
    --exclude-module=IPython \
    --exclude-module=pytest \
    main.py

if [ ! -f "dist/Z-Image-Service" ]; then
    echo ""
    echo "[错误] 构建失败！"
    exit 1
fi

echo ""
echo "[4/4] 创建发布包..."

RELEASE_DIR="release/Z-Image-Service-Linux"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

cp "dist/Z-Image-Service" "$RELEASE_DIR/"
chmod +x "$RELEASE_DIR/Z-Image-Service"

# 创建启动脚本
cat > "$RELEASE_DIR/启动服务.sh" << 'LAUNCHER'
#!/bin/bash
cd "$(dirname "$0")"
echo "============================================================"
echo "  Z-Image Bridge Service - Linux Launcher"
echo "  通义MAI Z-Image 6B 文生图模型服务"
echo "============================================================"
echo ""

export ZIMAGE_MODE=${ZIMAGE_MODE:-modelscope}
export ZIMAGE_PORT=${ZIMAGE_PORT:-8001}
export ZIMAGE_HF_TOKEN=${ZIMAGE_HF_TOKEN:-}
export ZIMAGE_MS_TOKEN=${ZIMAGE_MS_TOKEN:-}

echo "模式: $ZIMAGE_MODE"
echo "端口: $ZIMAGE_PORT"
echo ""
echo "服务启动后访问: http://localhost:$ZIMAGE_PORT/health"
echo "按 Ctrl+C 停止服务"
echo ""

./Z-Image-Service
LAUNCHER
chmod +x "$RELEASE_DIR/启动服务.sh"

# 创建README
cat > "$RELEASE_DIR/README.txt" << 'READMEEOF'
============================================================
  Z-Image Bridge Service - Linux版
  通义MAI Z-Image 6B 文生图模型服务
============================================================

【快速启动】
  1. chmod +x 启动服务.sh
  2. ./启动服务.sh

【配置说明】
  设置环境变量:
    export ZIMAGE_MODE=modelscope   运行模式
    export ZIMAGE_PORT=8001         服务端口
    export ZIMAGE_HF_TOKEN=         HuggingFace Token（api模式需要）
    export ZIMAGE_MS_TOKEN=         ModelScope Token（可选）

【模型来源】
  ModelScope:  https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/
  HuggingFace: https://huggingface.co/Tongyi-MAI/Z-Image/
READMEEOF

echo "[OK] 发布包已创建: $RELEASE_DIR"

echo ""
echo "============================================================"
echo "  构建成功！"
echo "============================================================"
echo ""
echo "  可执行文件: dist/Z-Image-Service"
echo "  发布包: $RELEASE_DIR/"
echo ""
ls -lh dist/Z-Image-Service
