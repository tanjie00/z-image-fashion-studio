# ============================================
# Z-Image 模特换装 - AutoDL 云端部署 Dockerfile
# ============================================
# 基础镜像：CUDA 12.4 + Ubuntu 22.04
# 推荐实例：RTX 4090 (24GB) 或 RTX 3090 (24GB)
# ============================================

FROM nvidia/cuda:12.4-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV NODE_VERSION=20

# ---- 安装基础工具 ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    git \
    wget \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# ---- 安装 Node.js 20 ----
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# ---- 安装 Python 依赖 ----
RUN pip3 install --no-cache-dir --break-system-packages \
    torch torchvision --index-url https://download.pytorch.org/whl/cu124 \
    && pip3 install --no-cache-dir --break-system-packages \
    diffusers \
    "transformers>=4.47.0,<4.52" \
    accelerate \
    fastapi \
    "uvicorn[standard]" \
    pydantic \
    gradio_client \
    modelscope \
    prisma

# ---- 创建工作目录 ----
WORKDIR /root/app

# ---- 复制项目文件 ----
# 前端
COPY package.json package-lock.json* ./
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./
COPY components.json ./
COPY prisma/ ./prisma/

# 后端
COPY z-image-service/ ./z-image-service/

# 启动脚本
COPY deploy/start.sh ./start.sh
RUN chmod +x ./start.sh

# ---- 安装前端依赖并构建 ----
RUN npm install \
    && npx prisma generate \
    && npm run build

# ---- 暴露端口 ----
EXPOSE 3000 8001

# ---- 启动 ----
CMD ["bash", "./start.sh"]
