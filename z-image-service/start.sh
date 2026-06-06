#!/bin/bash
# Start Z-Image Bridge Service
cd "$(dirname "$0")"
export Z_IMAGE_PORT=${Z_IMAGE_PORT:-8001}
python3 main.py &
echo "Z-Image Bridge Service started on port $Z_IMAGE_PORT"
