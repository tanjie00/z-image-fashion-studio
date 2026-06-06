"""
Z-Image Service - Windows 启动器 v1.0
=======================================
通义MAI Z-Image 6B 文生图模型服务 Windows 一键启动程序

双击运行即可启动服务，自动打开浏览器

模型来源:
  - ModelScope: https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/
  - HuggingFace: https://huggingface.co/Tongyi-MAI/Z-Image/
"""

import os
import sys
import json
import time
import logging
import threading
import subprocess
import webbrowser
from pathlib import Path
from typing import Optional

# ============================================================
# 配置
# ============================================================
APP_NAME = "Z-Image Service"
APP_VERSION = "1.0.0"
APP_DIR = Path.home() / ".z-image-service"
CONFIG_FILE = APP_DIR / "config.json"
LOG_FILE = APP_DIR / "service.log"
DEFAULT_PORT = 8001

DEFAULT_CONFIG = {
    "mode": "modelscope",
    "port": 8001,
    "hf_token": "",
    "ms_token": "",
    "auto_open_browser": True,
}

# ============================================================
# 日志
# ============================================================
def setup_logger():
    logger = logging.getLogger("z-image")
    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    try:
        APP_DIR.mkdir(parents=True, exist_ok=True)
        fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    except Exception:
        pass

    return logger

logger = setup_logger()

# ============================================================
# 配置管理
# ============================================================
def load_config():
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                for k, v in DEFAULT_CONFIG.items():
                    cfg.setdefault(k, v)
                return cfg
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()

def save_config(cfg):
    try:
        APP_DIR.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"保存配置失败: {e}")

# ============================================================
# FastAPI 服务（内嵌）
# ============================================================
def create_app():
    """创建 Z-Image FastAPI 应用"""
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from typing import Optional
    import base64
    import io
    import tempfile

    app = FastAPI(title="Z-Image Service", version=APP_VERSION)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    config = load_config()
    ZIMAGE_MODE = config.get("mode", "modelscope")
    ZIMAGE_HF_TOKEN = config.get("hf_token", "")
    ZIMAGE_MS_TOKEN = config.get("ms_token", "")

    # 懒加载客户端
    _gradio_client = None
    _ms_client = None

    def get_hf_client():
        global _gradio_client
        if _gradio_client is None:
            from gradio_client import Client
            kwargs = {}
            if ZIMAGE_HF_TOKEN:
                kwargs["hf_token"] = ZIMAGE_HF_TOKEN
            _gradio_client = Client("Tongyi-MAI/Z-Image", **kwargs)
        return _gradio_client

    def get_ms_client():
        global _ms_client
        if _ms_client is None:
            from gradio_client import Client
            try:
                _ms_client = Client("Tongyi-MAI/Z-Image")
            except Exception:
                logger.warning("ModelScope连接失败，回退到HuggingFace")
                _ms_client = get_hf_client()
        return _ms_client

    class GenerateRequest(BaseModel):
        prompt: str
        negative_prompt: str = ""
        resolution: str = "864x1152 ( 3:4 )"
        seed: int = 42
        num_inference_steps: float = 30
        guidance_scale: float = 4.0
        cfg_normalization: bool = False
        random_seed: bool = True
        reference_image: Optional[str] = None

    class GenerateResponse(BaseModel):
        success: bool
        image_base64: Optional[str] = None
        seed_used: Optional[str] = None
        seed: Optional[int] = None
        error: Optional[str] = None
        mode: Optional[str] = None

    def parse_resolution(resolution_str: str):
        try:
            dims = resolution_str.split("(")[0].strip()
            w, h = dims.split("x")
            return int(w.strip()), int(h.strip())
        except Exception:
            return 864, 1152

    def read_image_to_base64(path):
        if os.path.exists(path):
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        elif path.startswith("http"):
            import urllib.request
            try:
                resp = urllib.request.urlopen(path, timeout=60)
                return base64.b64encode(resp.read()).decode("utf-8")
            except Exception as e:
                logger.error(f"下载图片失败: {e}")
        return None

    def _generate_with_client(client, request: GenerateRequest, mode_name: str):
        gallery_images = []
        if request.reference_image:
            img_data = base64.b64decode(request.reference_image)
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
                f.write(img_data)
                temp_path = f.name
            gallery_images = [{"image": {"path": temp_path}, "caption": None}]

        logger.info(f"[{mode_name}] 生成图片: {request.prompt[:80]}...")
        start = time.time()

        result = client.predict(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            resolution=request.resolution,
            seed=request.seed,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            cfg_normalization=request.cfg_normalization,
            random_seed=request.random_seed,
            gallery_images=gallery_images,
            api_name="/generate",
        )

        elapsed = time.time() - start
        logger.info(f"[{mode_name}] 生成完成，耗时 {elapsed:.1f}s")

        if request.reference_image and gallery_images:
            try:
                os.unlink(gallery_images[0]["image"]["path"])
            except Exception:
                pass

        generated_images, seed_used, seed_value = result
        if not generated_images:
            return GenerateResponse(success=False, error="未生成图片", mode=mode_name)

        first_image = generated_images[0]
        image_path = None
        if isinstance(first_image, dict):
            info = first_image.get("image", {})
            if isinstance(info, dict):
                image_path = info.get("path") or info.get("url")
            elif isinstance(info, str):
                image_path = info

        if not image_path:
            return GenerateResponse(success=False, error="无法提取图片", mode=mode_name)

        image_base64 = read_image_to_base64(image_path)
        if not image_base64:
            return GenerateResponse(success=False, error=f"图片不可访问: {image_path}", mode=mode_name)

        return GenerateResponse(
            success=True,
            image_base64=image_base64,
            seed_used=str(seed_used) if seed_used else None,
            seed=seed_value if isinstance(seed_value, (int, float)) else None,
            mode=mode_name,
        )

    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "mode": ZIMAGE_MODE,
            "model": "Tongyi-MAI/Z-Image",
            "version": APP_VERSION,
        }

    @app.get("/resolutions")
    async def resolutions():
        return {"resolutions": [
            {"value": "720x720 ( 1:1 )", "label": "720x720 (1:1)"},
            {"value": "896x512 ( 16:9 )", "label": "896x512 (16:9)"},
            {"value": "512x896 ( 9:16 )", "label": "512x896 (9:16)"},
            {"value": "864x1152 ( 3:4 )", "label": "864x1152 (3:4)"},
            {"value": "1152x864 ( 4:3 )", "label": "1152x864 (4:3)"},
            {"value": "1024x1024 ( 1:1 )", "label": "1024x1024 (1:1)"},
            {"value": "1280x720 ( 16:9 )", "label": "1280x720 (16:9)"},
            {"value": "720x1280 ( 9:16 )", "label": "720x1280 (9:16)"},
            {"value": "1536x1024 ( 3:2 )", "label": "1536x1024 (3:2)"},
            {"value": "1024x1536 ( 2:3 )", "label": "1024x1536 (2:3)"},
        ]}

    @app.post("/generate", response_model=GenerateResponse)
    async def generate(request: GenerateRequest):
        try:
            if ZIMAGE_MODE == "modelscope":
                return _generate_with_client(get_ms_client(), request, "modelscope")
            else:
                return _generate_with_client(get_hf_client(), request, "remote")
        except Exception as e:
            logger.error(f"生成失败: {e}", exc_info=True)
            return GenerateResponse(success=False, error=str(e), mode=ZIMAGE_MODE)

    @app.post("/generate/fallback", response_model=GenerateResponse)
    async def generate_fallback(request: GenerateRequest):
        for mode_name, client_fn in [("modelscope", get_ms_client), ("remote", get_hf_client)]:
            try:
                result = _generate_with_client(client_fn(), request, mode_name)
                if result.success:
                    return result
            except Exception as e:
                logger.warning(f"[{mode_name}] 失败，尝试下一个: {e}")
                continue
        return GenerateResponse(success=False, error="所有后端均失败", mode="fallback")

    @app.get("/config")
    async def get_config():
        cfg = load_config()
        return {k: v for k, v in cfg.items() if k != "hf_token" and k != "ms_token"}

    return app

# ============================================================
# Windows 控制台启动器
# ============================================================
def print_banner():
    banner = r"""
    ╔══════════════════════════════════════════════╗
    ║     Z-Image Service  v1.0.0                 ║
    ║     通义MAI Z-Image 6B 文生图模型服务         ║
    ╚══════════════════════════════════════════════╝
    """
    print(banner)

def run_service():
    """启动服务"""
    import uvicorn

    config = load_config()
    mode = config.get("mode", "modelscope")
    port = config.get("port", DEFAULT_PORT)

    print_banner()
    print(f"    运行模式: {mode}")
    print(f"    服务端口: {port}")
    print(f"    配置文件: {CONFIG_FILE}")
    print(f"    日志文件: {LOG_FILE}")
    print()
    print(f"    ModelScope: https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/")
    print(f"    HuggingFace: https://huggingface.co/Tongyi-MAI/Z-Image/")
    print()
    print("    按 Ctrl+C 停止服务")
    print("=" * 48)
    print()

    app = create_app()

    if config.get("auto_open_browser", True):
        def open_browser():
            time.sleep(2)
            webbrowser.open(f"http://localhost:{port}/health")
        threading.Thread(target=open_browser, daemon=True).start()

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

# ============================================================
# 入口
# ============================================================
if __name__ == "__main__":
    try:
        run_service()
    except KeyboardInterrupt:
        print("\n服务已停止")
    except ImportError as e:
        print(f"\n[错误] 缺少依赖: {e}")
        print("请安装依赖: pip install fastapi uvicorn pydantic gradio_client")
        input("\n按回车键退出...")
    except Exception as e:
        print(f"\n[错误] {e}")
        logging.getLogger("z-image").error(f"服务异常: {e}", exc_info=True)
        input("\n按回车键退出...")
