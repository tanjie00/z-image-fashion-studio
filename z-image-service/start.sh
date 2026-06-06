#!/bin/bash
# Start Z-Image Bridge Service
# Modes: remote (default, HF Space), api (HF Inference API), local (diffusers)
cd "$(dirname "$0")"

# Configuration
export ZIMAGE_MODE=${ZIMAGE_MODE:-remote}
export ZIMAGE_PORT=${ZIMAGE_PORT:-8001}
export ZIMAGE_HF_TOKEN=${ZIMAGE_HF_TOKEN:-}
export ZIMAGE_LOCAL_MODEL=${ZIMAGE_LOCAL_MODEL:-Tongyi-MAI/Z-Image}
export ZIMAGE_DEVICE=${ZIMAGE_DEVICE:-cuda}

# Install dependencies if needed
if [ "$ZIMAGE_MODE" = "remote" ]; then
    pip install -q gradio_client fastapi uvicorn pydantic 2>/dev/null
elif [ "$ZIMAGE_MODE" = "api" ]; then
    pip install -q fastapi uvicorn pydantic 2>/dev/null
elif [ "$ZIMAGE_MODE" = "local" ]; then
    pip install -q git+https://github.com/huggingface/diffusers torch transformers accelerate safetensors fastapi uvicorn pydantic 2>/dev/null
fi

echo "Starting Z-Image Bridge Service v2.0 (mode: $ZIMAGE_MODE, port: $ZIMAGE_PORT)"
python3 main.py &
echo "Z-Image Bridge Service started on port $ZIMAGE_PORT (PID: $!)"
