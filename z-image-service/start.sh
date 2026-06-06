#!/bin/bash
# Start Z-Image Bridge Service v3.0
# 通义MAI Z-Image 6B文生图模型桥接服务
#
# 支持模式:
#   modelscope - ModelScope Space API (推荐国内用户，默认)
#   remote     - HuggingFace Space API
#   api        - HuggingFace Inference API (需要HF Token)
#   local      - 本地 diffusers 推理 (需要GPU)
#
# 模型来源:
#   ModelScope:  https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/
#   HuggingFace: https://huggingface.co/Tongyi-MAI/Z-Image/

cd "$(dirname "$0")"

# Configuration
export ZIMAGE_MODE=${ZIMAGE_MODE:-modelscope}
export ZIMAGE_PORT=${ZIMAGE_PORT:-8001}
export ZIMAGE_HF_TOKEN=${ZIMAGE_HF_TOKEN:-}
export ZIMAGE_MS_TOKEN=${ZIMAGE_MS_TOKEN:-}
export ZIMAGE_LOCAL_MODEL=${ZIMAGE_LOCAL_MODEL:-Tongyi-MAI/Z-Image}
export ZIMAGE_DEVICE=${ZIMAGE_DEVICE:-cuda}

echo "============================================"
echo " Z-Image Bridge Service v3.0"
echo " Model: Tongyi-MAI/Z-Image (6B)"
echo " Mode:  $ZIMAGE_MODE"
echo " Port:  $ZIMAGE_PORT"
echo " ModelScope: https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/"
echo "============================================"

# Install dependencies based on mode
if [ "$ZIMAGE_MODE" = "modelscope" ]; then
    pip install -q gradio_client fastapi uvicorn pydantic 2>/dev/null
elif [ "$ZIMAGE_MODE" = "remote" ]; then
    pip install -q gradio_client fastapi uvicorn pydantic 2>/dev/null
elif [ "$ZIMAGE_MODE" = "api" ]; then
    pip install -q fastapi uvicorn pydantic 2>/dev/null
elif [ "$ZIMAGE_MODE" = "local" ]; then
    pip install -q git+https://github.com/huggingface/diffusers torch transformers accelerate safetensors fastapi uvicorn pydantic 2>/dev/null
fi

exec python3 main.py
