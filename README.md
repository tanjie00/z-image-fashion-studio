# Z-Image Fashion Studio

> 基于 通义MAI Z-Image 6B 文生图模型的 AI 模特换衣 + 姿势裂变工具

[![Build Windows EXE](https://github.com/tanjie00/z-image-fashion-studio/actions/workflows/build-windows-exe.yml/badge.svg)](https://github.com/tanjie00/z-image-fashion-studio/actions/workflows/build-windows-exe.yml)

## 项目简介

Z-Image Fashion Studio 是一个专业的 AI 时尚图片生成工具，集成了通义MAI团队的 Z-Image 6B 文生图模型，支持模特换衣、姿势裂变等专业时尚场景。

### 核心功能

- 🎨 **AI 图片生成** - 基于 Z-Image 6B 模型的高质量时尚图片生成
- 👗 **模特换衣** - 上传模特和服装图片，AI 自动换装
- 🕺 **姿势裂变** - 从 50+ 预设姿势中选择，批量生成不同姿态的模特图
- 🖼️ **批量生成** - 支持多个姿势同时生成，一键导出
- ⚙️ **灵活配置** - 支持 ModelScope / HuggingFace / 本地 GPU 多种推理模式
- 📦 **Windows EXE** - 一键打包为独立可执行文件，无需 Python 环境

## 模型来源

| 平台 | 链接 | 说明 |
|------|------|------|
| ModelScope | https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/ | 推荐，国内访问快 |
| HuggingFace | https://huggingface.co/Tongyi-MAI/Z-Image/ | 海外用户首选 |

## 技术栈

### 前端
- **Next.js 16** + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui 组件库
- Zustand 状态管理
- @dnd-kit 拖拽排序

### 后端
- **Next.js API Routes** (前端API)
- **Z-Image Python Service** (FastAPI + uvicorn)
- Prisma ORM + SQLite 数据库

### AI 模型
- **Z-Image 6B** - 通义MAI 文生图模型
- 支持 4 种运行模式：ModelScope / HuggingFace Space / HF Inference API / 本地 GPU

## 快速开始

### 方式一：Windows EXE（推荐普通用户）

1. 前往 [Releases](https://github.com/tanjie00/z-image-fashion-studio/releases) 下载最新版本
2. 解压后双击 `启动服务.bat` 即可启动 Z-Image 后端服务
3. 访问 `http://localhost:8001/health` 确认服务正常

### 方式二：源码运行

```bash
# 1. 克隆项目
git clone https://github.com/tanjie00/z-image-fashion-studio.git
cd z-image-fashion-studio

# 2. 安装前端依赖
npm install

# 3. 安装 Python 依赖（Z-Image 服务）
pip install fastapi uvicorn pydantic gradio_client

# 4. 初始化数据库
npx prisma db push

# 5. 启动 Z-Image 后端服务
cd z-image-service
ZIMAGE_MODE=modelscope python3 main.py

# 6. 启动前端（新终端）
npm run dev
```

### 方式三：一键启动

```bash
# 同时启动前端和 Z-Image 服务
npm run dev:all
```

## 运行模式说明

| 模式 | 环境变量 | 说明 | 系统要求 |
|------|----------|------|----------|
| ModelScope | `ZIMAGE_MODE=modelscope` | ModelScope Space API（推荐国内） | 仅需网络 |
| HuggingFace Space | `ZIMAGE_MODE=remote` | HuggingFace Space API | 仅需网络 |
| HF Inference API | `ZIMAGE_MODE=api` | HuggingFace 推理 API | 网络 + HF Token |
| 本地 GPU | `ZIMAGE_MODE=local` | 本地 diffusers 推理 | NVIDIA GPU (~24GB VRAM) |

### 环境变量配置

```bash
# 必需
ZIMAGE_MODE=modelscope        # 运行模式

# 可选
ZIMAGE_PORT=8001              # 服务端口
ZIMAGE_HF_TOKEN=              # HuggingFace Token（api模式需要）
ZIMAGE_MS_TOKEN=              # ModelScope Token（可选，提升速率）
ZIMAGE_LOCAL_MODEL=Tongyi-MAI/Z-Image  # 本地模型路径
ZIMAGE_DEVICE=cuda            # 推理设备（local模式）
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/resolutions` | 获取支持的分辨率列表 |
| POST | `/generate` | 生成图片 |
| POST | `/generate/fallback` | 带自动回退的图片生成 |

### 生成图片示例

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A fashion model wearing a red dress, studio lighting, full body shot",
    "negative_prompt": "low quality, blurry",
    "resolution": "864x1152 ( 3:4 )",
    "seed": 42,
    "num_inference_steps": 30,
    "guidance_scale": 4.0,
    "random_seed": true
  }'
```

## 打包 Windows EXE

### 自动构建（推荐）

推送 tag 到 GitHub 即可自动构建：

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动在 Windows 环境下构建 EXE 并发布到 Releases。

### 手动构建

在 Windows 环境下运行：

```cmd
cd z-image-service
build-exe.bat          # 控制台版本
build-exe.bat gui      # GUI托盘版本
```

## 项目结构

```
z-image-fashion-studio/
├── .github/workflows/       # GitHub Actions CI/CD
│   └── build-windows-exe.yml
├── z-image-service/         # Z-Image Python 服务
│   ├── main.py              # 服务主程序
│   ├── launcher.py          # Windows GUI启动器
│   ├── build-exe.bat        # Windows打包脚本
│   ├── start.sh             # Linux/Mac启动脚本
│   └── requirements.txt     # Python依赖
├── src/                     # Next.js 前端源码
│   ├── app/                 # App Router
│   │   ├── api/             # API Routes
│   │   ├── components/      # UI 组件
│   │   └── page.tsx         # 主页面
│   ├── components/          # 共享组件
│   │   ├── steps/           # 步骤组件
│   │   └── ui/              # shadcn/ui 组件
│   └── lib/                 # 工具库
├── prisma/                  # 数据库 Schema
├── public/                  # 静态资源
└── package.json
```

## 引用

如果本项目对您有帮助，请引用 Z-Image 论文：

```bibtex
@article{zimage2024,
  title={Z-Image: Boosting Text-to-Image with Text-to-Video},
  author={Tongyi-MAI Team},
  journal={arXiv preprint arXiv:2511.22699},
  year={2024}
}
```

## License

MIT License
