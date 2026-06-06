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

## 本地构建

```bash
pip install pyinstaller
pyinstaller --onefile --console --name Z-Image-Service main.py
```

## License

MIT
