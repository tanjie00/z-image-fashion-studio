# Z-Image Service - Windows 启动器

> 通义MAI Z-Image 6B 文生图模型服务，Windows 一键启动程序

## 下载

前往 [Releases](https://github.com/tanjie00/z-image-fashion-studio/releases) 下载 `Z-Image-Service.exe`

## 使用方法

1. 双击 `Z-Image-Service.exe` 启动服务
2. 自动打开浏览器，访问 `http://localhost:8001/health`
3. 按 `Ctrl+C` 停止服务

## 配置

配置文件位于 `~/.z-image-service/config.json`：

```json
{
  "mode": "modelscope",
  "port": 8001,
  "hf_token": "",
  "ms_token": "",
  "auto_open_browser": true
}
```

| 参数 | 说明 | 默认值 |
|------|------|--------|
| mode | 运行模式: modelscope / remote | modelscope |
| port | 服务端口 | 8001 |
| hf_token | HuggingFace Token | 空 |
| ms_token | ModelScope Token | 空 |
| auto_open_browser | 自动打开浏览器 | true |

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |
| GET | /resolutions | 分辨率列表 |
| GET | /config | 当前配置 |
| POST | /generate | 生成图片 |
| POST | /generate/fallback | 带回退的生成 |

## 模型来源

- ModelScope: https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/
- HuggingFace: https://huggingface.co/Tongyi-MAI/Z-Image/

## 自动构建 Windows EXE（推荐）

项目配置了 GitHub Actions，推送 tag 即可自动构建 EXE 并发布到 Releases。

### 首次启用（只需一次）

由于权限限制，workflow 文件需手动添加：

1. 打开仓库 → **Add file** → **Create new file**
2. 文件路径输入 `.github/workflows/build.yml`
3. 将下方内容粘贴进去，点击 **Commit changes**

```yaml
name: Build Windows EXE

on:
  push:
    branches: [main, master]
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: |
          pip install pyinstaller
          pip install -r requirements.txt
      - run: |
          pyinstaller --clean --console --onefile --name Z-Image-Service --optimize 1 --hidden-import=uvicorn.logging --hidden-import=uvicorn.loops.auto --hidden-import=uvicorn.protocols.http.auto --hidden-import=uvicorn.protocols.websockets.auto --hidden-import=uvicorn.lifespan.on --hidden-import=fastapi --hidden-import=fastapi.middleware.cors --hidden-import=pydantic --hidden-import=pydantic.fields --hidden-import=pydantic.main --hidden-import=pydantic.types --hidden-import=anyio._backends._asyncio --hidden-import=httpcore --hidden-import=httpx --hidden-import=gradio_client --hidden-import=gradio_client.client --hidden-import=websockets --exclude-module=tkinter --exclude-module=matplotlib --exclude-module=numpy --exclude-module=PIL --exclude-module=scipy --exclude-module=pandas --exclude-module=IPython --exclude-module=pytest main.py
      - uses: actions/upload-artifact@v4
        with:
          name: Z-Image-Service-Windows
          path: dist/Z-Image-Service.exe

  release:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    permissions:
      contents: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: Z-Image-Service-Windows
          path: ./release
      - uses: softprops/action-gh-release@v2
        with:
          files: release/Z-Image-Service.exe
          generate_release_notes: true
```

### 构建 & 发布

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动在 Windows 环境构建 EXE 并发布到 Releases。

## 本地构建（Windows）

在 Windows 电脑上：

```cmd
pip install pyinstaller -r requirements.txt
pyinstaller --onefile --console --name Z-Image-Service main.py
```

生成的 `dist/Z-Image-Service.exe` 即为启动器。

## License

MIT
