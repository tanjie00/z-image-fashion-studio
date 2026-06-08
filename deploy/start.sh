#!/bin/bash
# ============================================
# Z-Image 模特换装 - AutoDL 一键启动脚本
# ============================================
set -e

echo "============================================"
echo "  Z-Image 模特换装 - 启动中..."
echo "============================================"

# ---- 配置 ----
APP_DIR="/root/app"
MODEL_DIR="/root/models/Z-Image-Turbo"
DB_DIR="/root/app/db"

# ---- 环境变量 ----
export ZIMAGE_MODE="local"
export ZIMAGE_LOCAL_MODEL="$MODEL_DIR"
export ZIMAGE_DEVICE="cuda"
export PORT=3000
export HOSTNAME="0.0.0.0"

# ---- 1. 检查 GPU ----
echo ""
echo "[1/5] 检查 GPU..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    export CUDA_VISIBLE_DEVICES=0
else
    echo "⚠ 未检测到 GPU，将使用 CPU 模式（速度较慢）"
    export ZIMAGE_MODE="modelscope"
    unset ZIMAGE_LOCAL_MODEL
fi

# ---- 2. 下载模型（如果不存在）----
if [ "$ZIMAGE_MODE" = "local" ] && [ ! -d "$MODEL_DIR" ]; then
    echo ""
    echo "[2/5] 下载 Z-Image-Turbo 模型（首次约 12GB）..."
    mkdir -p "$MODEL_DIR"
    python3 -c "
from modelscope import snapshot_download
snapshot_download('Tongyi-MAI/Z-Image-Turbo', local_dir='$MODEL_DIR')
print('模型下载完成!')
"
else
    echo ""
    echo "[2/5] 模型已存在，跳过下载"
fi

# ---- 3. 初始化数据库 ----
echo ""
echo "[3/5] 初始化数据库..."
mkdir -p "$DB_DIR"
cd "$APP_DIR"
npx prisma db push --skip-generate 2>/dev/null || true

# ---- 4. 启动后端服务 ----
echo ""
echo "[4/5] 启动 Z-Image 后端服务 (端口 8001)..."
cd "$APP_DIR/z-image-service"
python3 main.py > /root/backend.log 2>&1 &
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

# 等待后端启动
echo -n "  等待后端就绪"
for i in $(seq 1 30); do
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# ---- 5. 启动前端服务 ----
echo ""
echo "[5/5] 启动前端服务 (端口 3000)..."
cd "$APP_DIR"
npx next start -H 0.0.0.0 -p 3000 > /root/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  前端 PID: $FRONTEND_PID"

# ---- 完成 ----
echo ""
echo "============================================"
echo "  ✓ 启动完成！"
echo "============================================"
echo ""
echo "  前端访问: http://localhost:3000"
echo "  后端面板: http://localhost:8001"
echo "  API 文档: http://localhost:8001/docs"
echo ""
echo "  日志文件:"
echo "    后端: /root/backend.log"
echo "    前端: /root/frontend.log"
echo ""
echo "============================================"

# 保持容器运行
wait
