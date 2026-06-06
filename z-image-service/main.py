"""
Z-Image Bridge Service v3.0
============================
通义MAI Z-Image 6B文生图模型桥接服务，支持多种部署后端：

  - modelscope: ModelScope Space API（推荐，国内访问快，无需GPU）
  - remote: HuggingFace Space API via gradio_client（海外环境）
  - api: HuggingFace Inference API（需要HF Token）
  - local: 本地 diffusers 推理（需要GPU ~24GB VRAM）

模型来源:
  - ModelScope: https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/
  - HuggingFace: https://huggingface.co/Tongyi-MAI/Z-Image/

环境变量:
  ZIMAGE_MODE: modelscope | remote | api | local (默认: modelscope)
  ZIMAGE_HF_TOKEN: HuggingFace API Token (api模式必需)
  ZIMAGE_MS_TOKEN: ModelScope SDK Token (可选，提升速率)
  ZIMAGE_LOCAL_MODEL: 本地模型路径或仓库ID (默认: Tongyi-MAI/Z-Image)
  ZIMAGE_DEVICE: 推理设备 (默认: cuda)
  ZIMAGE_PORT: 服务端口 (默认: 8001)
"""

import os
import base64
import io
import tempfile
import time
import logging
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("z-image-service")

app = FastAPI(title="Z-Image Bridge Service", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
ZIMAGE_MODE = os.environ.get("ZIMAGE_MODE", "modelscope").lower()
ZIMAGE_HF_TOKEN = os.environ.get("ZIMAGE_HF_TOKEN", "")
ZIMAGE_MS_TOKEN = os.environ.get("ZIMAGE_MS_TOKEN", "")
ZIMAGE_LOCAL_MODEL = os.environ.get("ZIMAGE_LOCAL_MODEL", "Tongyi-MAI/Z-Image")
ZIMAGE_DEVICE = os.environ.get("ZIMAGE_DEVICE", "cuda")
ZIMAGE_PORT = int(os.environ.get("ZIMAGE_PORT", "8001"))

MODEL_INFO = {
    "name": "Tongyi-MAI/Z-Image",
    "description": "通义MAI Z-Image 6B 文生图模型",
    "modelscope_url": "https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/",
    "huggingface_url": "https://huggingface.co/Tongyi-MAI/Z-Image/",
    "paper": "arXiv:2511.22699",
}

logger.info(f"Z-Image Service v3.0 starting in '{ZIMAGE_MODE}' mode")

# --- Lazy-loaded backends ---
_gradio_client = None
_ms_space_client = None
_local_pipeline = None
_hf_api_initialized = False


def get_gradio_client():
    """Lazily initialize the Gradio client for HuggingFace Space."""
    global _gradio_client
    if _gradio_client is None:
        try:
            from gradio_client import Client
            logger.info("Initializing Gradio client for HuggingFace Space: Tongyi-MAI/Z-Image...")
            kwargs = {}
            if ZIMAGE_HF_TOKEN:
                kwargs["hf_token"] = ZIMAGE_HF_TOKEN
            _gradio_client = Client("Tongyi-MAI/Z-Image", **kwargs)
            logger.info("HuggingFace Gradio client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize HF Gradio client: {e}")
            raise
    return _gradio_client


def get_modelscope_client():
    """Lazily initialize the client for ModelScope Space."""
    global _ms_space_client
    if _ms_space_client is None:
        try:
            from modelscope import AutoModel
            logger.info("ModelScope SDK not needed for Space API mode, using HTTP client")
        except ImportError:
            pass

        try:
            from gradio_client import Client
            logger.info("Initializing Gradio client for ModelScope Space: Tongyi-MAI/Z-Image...")
            # ModelScope Space also exposes a Gradio-compatible API
            ms_space_url = "https://www.modelscope.cn/api/v1/spaces/Tongyi-MAI/Z-Image"
            kwargs = {}
            if ZIMAGE_MS_TOKEN:
                kwargs["hf_token"] = ZIMAGE_MS_TOKEN
            try:
                _ms_space_client = Client(ms_space_url, **kwargs)
                logger.info("ModelScope Gradio client initialized successfully")
            except Exception:
                # Fallback: try direct HF Space (same model, different hosting)
                logger.warning("ModelScope Space client failed, falling back to HuggingFace Space")
                _ms_space_client = get_gradio_client()
        except Exception as e:
            logger.error(f"Failed to initialize ModelScope client: {e}")
            raise
    return _ms_space_client


def get_local_pipeline():
    """Lazily initialize the local diffusers pipeline (from ModelScope or HuggingFace)."""
    global _local_pipeline
    if _local_pipeline is None:
        try:
            import torch
            # Try importing ZImagePipeline
            try:
                from diffusers import ZImagePipeline
                pipeline_class = ZImagePipeline
            except ImportError:
                logger.warning("ZImagePipeline not found in diffusers, trying DiffusionPipeline...")
                from diffusers import DiffusionPipeline
                pipeline_class = DiffusionPipeline

            logger.info(f"Loading Z-Image model from {ZIMAGE_LOCAL_MODEL}...")

            # Try ModelScope first, then HuggingFace
            try:
                from modelscope import snapshot_download
                ms_model_path = snapshot_download(ZIMAGE_LOCAL_MODEL)
                logger.info(f"Model downloaded from ModelScope: {ms_model_path}")
                _local_pipeline = pipeline_class.from_pretrained(
                    ms_model_path,
                    torch_dtype=torch.bfloat16,
                    low_cpu_mem_usage=True,
                )
            except ImportError:
                logger.info("ModelScope SDK not available, using HuggingFace download...")
                _local_pipeline = pipeline_class.from_pretrained(
                    ZIMAGE_LOCAL_MODEL,
                    torch_dtype=torch.bfloat16,
                    low_cpu_mem_usage=True,
                )

            _local_pipeline.to(ZIMAGE_DEVICE)
            logger.info(f"Z-Image pipeline loaded on {ZIMAGE_DEVICE}")
        except Exception as e:
            logger.error(f"Failed to load local pipeline: {e}")
            raise
    return _local_pipeline


def init_hf_api():
    """Check HF Inference API availability."""
    global _hf_api_initialized
    if not _hf_api_initialized:
        if not ZIMAGE_HF_TOKEN:
            raise ValueError("ZIMAGE_HF_TOKEN is required for api mode")
        _hf_api_initialized = True
    return True


# --- Request/Response Models ---

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


class HealthResponse(BaseModel):
    status: str
    mode: str
    model: str
    modelscope_url: Optional[str] = None
    huggingface_url: Optional[str] = None
    local_available: Optional[bool] = None
    gpu_available: Optional[bool] = None


# --- Helper Functions ---

def parse_resolution(resolution_str: str) -> tuple[int, int]:
    """Parse resolution string like '864x1152 ( 3:4 )' into (width, height)."""
    try:
        dims = resolution_str.split("(")[0].strip()
        w, h = dims.split("x")
        return int(w.strip()), int(h.strip())
    except Exception:
        logger.warning(f"Failed to parse resolution '{resolution_str}', defaulting to 864x1152")
        return 864, 1152


def _read_image_to_base64(image_path: str) -> Optional[str]:
    """Read an image from a local path or URL and return base64."""
    if os.path.exists(image_path):
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    elif image_path.startswith("http"):
        import urllib.request
        try:
            resp = urllib.request.urlopen(image_path, timeout=60)
            data = resp.read()
            return base64.b64encode(data).decode("utf-8")
        except Exception as e:
            logger.error(f"Failed to download image from {image_path}: {e}")
    return None


# --- Backend: ModelScope Space ---

def generate_modelscope(request: GenerateRequest) -> GenerateResponse:
    """Generate using ModelScope Space API (推荐国内用户使用)."""
    client = get_modelscope_client()

    gallery_images = []
    if request.reference_image:
        img_data = base64.b64decode(request.reference_image)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(img_data)
            temp_path = f.name
        gallery_images = [{"image": {"path": temp_path}, "caption": None}]

    logger.info(f"[modelscope] Generating image with prompt: {request.prompt[:100]}...")
    start_time = time.time()

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

    elapsed = time.time() - start_time
    logger.info(f"[modelscope] Image generated in {elapsed:.2f}s")

    # Clean up temp file
    if request.reference_image and gallery_images:
        try:
            os.unlink(gallery_images[0]["image"]["path"])
        except Exception:
            pass

    # Parse result
    generated_images, seed_used, seed_value = result

    if not generated_images or len(generated_images) == 0:
        return GenerateResponse(success=False, error="No image was generated", mode="modelscope")

    first_image = generated_images[0]
    image_path = None

    if isinstance(first_image, dict):
        image_info = first_image.get("image", {})
        if isinstance(image_info, dict):
            image_path = image_info.get("path") or image_info.get("url")
        elif isinstance(image_info, str):
            image_path = image_info

    if not image_path:
        return GenerateResponse(success=False, error="Could not extract image path from response", mode="modelscope")

    image_base64 = _read_image_to_base64(image_path)
    if not image_base64:
        return GenerateResponse(success=False, error=f"Image path not accessible: {image_path}", mode="modelscope")

    return GenerateResponse(
        success=True,
        image_base64=image_base64,
        seed_used=str(seed_used) if seed_used else None,
        seed=seed_value if isinstance(seed_value, (int, float)) else None,
        mode="modelscope",
    )


# --- Backend: HuggingFace Space ---

def generate_remote(request: GenerateRequest) -> GenerateResponse:
    """Generate using HuggingFace Space via gradio_client."""
    client = get_gradio_client()

    gallery_images = []
    if request.reference_image:
        img_data = base64.b64decode(request.reference_image)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(img_data)
            temp_path = f.name
        gallery_images = [{"image": {"path": temp_path}, "caption": None}]

    logger.info(f"[remote] Generating image with prompt: {request.prompt[:100]}...")
    start_time = time.time()

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

    elapsed = time.time() - start_time
    logger.info(f"[remote] Image generated in {elapsed:.2f}s")

    if request.reference_image and gallery_images:
        try:
            os.unlink(gallery_images[0]["image"]["path"])
        except Exception:
            pass

    generated_images, seed_used, seed_value = result

    if not generated_images or len(generated_images) == 0:
        return GenerateResponse(success=False, error="No image was generated", mode="remote")

    first_image = generated_images[0]
    image_path = None

    if isinstance(first_image, dict):
        image_info = first_image.get("image", {})
        if isinstance(image_info, dict):
            image_path = image_info.get("path") or image_info.get("url")
        elif isinstance(image_info, str):
            image_path = image_info

    if not image_path:
        return GenerateResponse(success=False, error="Could not extract image path from response", mode="remote")

    image_base64 = _read_image_to_base64(image_path)
    if not image_base64:
        return GenerateResponse(success=False, error=f"Image path not accessible: {image_path}", mode="remote")

    return GenerateResponse(
        success=True,
        image_base64=image_base64,
        seed_used=str(seed_used) if seed_used else None,
        seed=seed_value if isinstance(seed_value, (int, float)) else None,
        mode="remote",
    )


# --- Backend: HuggingFace Inference API ---

def generate_api(request: GenerateRequest) -> GenerateResponse:
    """Generate using HuggingFace Inference API (serverless)."""
    init_hf_api()

    import json
    import urllib.request

    width, height = parse_resolution(request.resolution)

    payload = {
        "inputs": request.prompt,
        "parameters": {
            "width": width,
            "height": height,
            "guidance_scale": request.guidance_scale,
            "num_inference_steps": int(request.num_inference_steps),
            "seed": request.seed if not request.random_seed else None,
            "negative_prompt": request.negative_prompt or None,
        },
    }
    payload["parameters"] = {k: v for k, v in payload["parameters"].items() if v is not None}

    logger.info(f"[api] Generating image via HF Inference API: {request.prompt[:100]}...")
    start_time = time.time()

    url = f"https://api-inference.huggingface.co/models/{ZIMAGE_LOCAL_MODEL}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {ZIMAGE_HF_TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        resp = urllib.request.urlopen(req, timeout=300)
        image_data = resp.read()
        image_base64 = base64.b64encode(image_data).decode("utf-8")
        elapsed = time.time() - start_time
        logger.info(f"[api] Image generated in {elapsed:.2f}s")
        return GenerateResponse(success=True, image_base64=image_base64, mode="api")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        logger.error(f"[api] HF Inference API error: {e.code} - {error_body}")
        if e.code == 503:
            return GenerateResponse(success=False, error="Model is loading, please retry in 30-60 seconds", mode="api")
        return GenerateResponse(success=False, error=f"HF API error ({e.code}): {error_body[:500]}", mode="api")
    except Exception as e:
        logger.error(f"[api] Generation failed: {e}")
        return GenerateResponse(success=False, error=str(e), mode="api")


# --- Backend: Local Pipeline ---

def generate_local(request: GenerateRequest) -> GenerateResponse:
    """Generate using local diffusers pipeline."""
    import torch

    pipe = get_local_pipeline()
    width, height = parse_resolution(request.resolution)

    seed = request.seed
    if request.random_seed:
        seed = int(time.time() * 1000) % (2**32)

    generator = torch.Generator(ZIMAGE_DEVICE).manual_seed(seed)

    logger.info(f"[local] Generating image: {request.prompt[:100]}...")
    start_time = time.time()

    result = pipe(
        prompt=request.prompt,
        negative_prompt=request.negative_prompt or None,
        height=height,
        width=width,
        num_inference_steps=int(request.num_inference_steps),
        guidance_scale=request.guidance_scale,
        cfg_normalization=request.cfg_normalization,
        generator=generator,
    )

    elapsed = time.time() - start_time
    logger.info(f"[local] Image generated in {elapsed:.2f}s")

    image = result.images[0]
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return GenerateResponse(
        success=True,
        image_base64=image_base64,
        seed_used=str(seed),
        seed=seed,
        mode="local",
    )


# --- API Endpoints ---

@app.get("/health", response_model=HealthResponse)
async def health_check():
    gpu_available = False
    local_available = False

    try:
        import torch
        gpu_available = torch.cuda.is_available()
    except ImportError:
        pass

    if ZIMAGE_MODE == "local":
        local_available = gpu_available

    return HealthResponse(
        status="ok",
        mode=ZIMAGE_MODE,
        model=MODEL_INFO["name"],
        modelscope_url=MODEL_INFO["modelscope_url"],
        huggingface_url=MODEL_INFO["huggingface_url"],
        local_available=local_available,
        gpu_available=gpu_available,
    )


@app.get("/resolutions")
async def get_resolutions():
    """Return available resolution options for Z-Image."""
    return {
        "resolutions": [
            {"value": "720x720 ( 1:1 )", "label": "720x720 (1:1)", "width": 720, "height": 720},
            {"value": "896x512 ( 16:9 )", "label": "896x512 (16:9)", "width": 896, "height": 512},
            {"value": "512x896 ( 9:16 )", "label": "512x896 (9:16)", "width": 512, "height": 896},
            {"value": "832x544 ( 3:2 )", "label": "832x544 (3:2)", "width": 832, "height": 544},
            {"value": "544x832 ( 2:3 )", "label": "544x832 (2:3)", "width": 544, "height": 832},
            {"value": "800x576 ( 4:3 )", "label": "800x576 (4:3)", "width": 800, "height": 576},
            {"value": "576x800 ( 3:4 )", "label": "576x800 (3:4)", "width": 576, "height": 800},
            {"value": "1024x1024 ( 1:1 )", "label": "1024x1024 (1:1)", "width": 1024, "height": 1024},
            {"value": "1152x896 ( 9:7 )", "label": "1152x896 (9:7)", "width": 1152, "height": 896},
            {"value": "896x1152 ( 7:9 )", "label": "896x1152 (7:9)", "width": 896, "height": 1152},
            {"value": "1152x864 ( 4:3 )", "label": "1152x864 (4:3)", "width": 1152, "height": 864},
            {"value": "864x1152 ( 3:4 )", "label": "864x1152 (3:4)", "width": 864, "height": 1152},
            {"value": "1248x832 ( 3:2 )", "label": "1248x832 (3:2)", "width": 1248, "height": 832},
            {"value": "832x1248 ( 2:3 )", "label": "832x1248 (2:3)", "width": 832, "height": 1248},
            {"value": "1280x720 ( 16:9 )", "label": "1280x720 (16:9)", "width": 1280, "height": 720},
            {"value": "720x1280 ( 9:16 )", "label": "720x1280 (9:16)", "width": 720, "height": 1280},
            {"value": "1344x576 ( 21:9 )", "label": "1344x576 (21:9)", "width": 1344, "height": 576},
            {"value": "576x1344 ( 9:21 )", "label": "576x1344 (9:21)", "width": 576, "height": 1344},
            {"value": "1280x1280 ( 1:1 )", "label": "1280x1280 (1:1)", "width": 1280, "height": 1280},
            {"value": "1440x1120 ( 9:7 )", "label": "1440x1120 (9:7)", "width": 1440, "height": 1120},
            {"value": "1120x1440 ( 7:9 )", "label": "1120x1440 (7:9)", "width": 1120, "height": 1440},
            {"value": "1472x1104 ( 4:3 )", "label": "1472x1104 (4:3)", "width": 1472, "height": 1104},
            {"value": "1104x1472 ( 3:4 )", "label": "1104x1472 (3:4)", "width": 1104, "height": 1472},
            {"value": "1536x1024 ( 3:2 )", "label": "1536x1024 (3:2)", "width": 1536, "height": 1024},
            {"value": "1024x1536 ( 2:3 )", "label": "1024x1536 (2:3)", "width": 1024, "height": 1536},
            {"value": "1536x864 ( 16:9 )", "label": "1536x864 (16:9)", "width": 1536, "height": 864},
            {"value": "864x1536 ( 9:16 )", "label": "864x1536 (9:16)", "width": 864, "height": 1536},
        ]
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """Generate an image using Z-Image model with the configured backend."""
    try:
        if ZIMAGE_MODE == "modelscope":
            return generate_modelscope(request)
        elif ZIMAGE_MODE == "local":
            return generate_local(request)
        elif ZIMAGE_MODE == "api":
            return generate_api(request)
        else:  # remote (HuggingFace Space)
            return generate_remote(request)
    except Exception as e:
        logger.error(f"Image generation failed: {e}", exc_info=True)
        return GenerateResponse(success=False, error=str(e), mode=ZIMAGE_MODE)


@app.post("/generate/fallback", response_model=GenerateResponse)
async def generate_with_fallback(request: GenerateRequest):
    """Try primary backend, then fallback to others.

    Fallback order (optimized for Chinese users):
      modelscope → remote (HF Space) → api → local
    """
    # Determine fallback order based on configured mode
    mode_orders = {
        "modelscope": ["modelscope", "remote", "api", "local"],
        "remote": ["remote", "modelscope", "api", "local"],
        "api": ["api", "modelscope", "remote", "local"],
        "local": ["local", "modelscope", "remote", "api"],
    }
    modes = mode_orders.get(ZIMAGE_MODE, ["modelscope", "remote", "api", "local"])

    last_error = None
    for mode in modes:
        try:
            if mode == "modelscope":
                result = generate_modelscope(request)
            elif mode == "remote":
                result = generate_remote(request)
            elif mode == "api":
                if not ZIMAGE_HF_TOKEN:
                    continue
                result = generate_api(request)
            elif mode == "local":
                try:
                    import torch
                    if not torch.cuda.is_available():
                        continue
                except ImportError:
                    continue
                result = generate_local(request)
            else:
                continue

            if result.success:
                return result
            last_error = result.error
        except Exception as e:
            last_error = str(e)
            logger.warning(f"[{mode}] backend failed, trying next: {e}")
            continue

    return GenerateResponse(
        success=False,
        error=f"All backends failed. Last error: {last_error}",
        mode="fallback",
    )


if __name__ == "__main__":
    logger.info(f"Starting Z-Image Bridge Service v3.0 on port {ZIMAGE_PORT} (mode: {ZIMAGE_MODE})")
    logger.info(f"Model: {MODEL_INFO['name']} | ModelScope: {MODEL_INFO['modelscope_url']}")
    uvicorn.run(app, host="0.0.0.0", port=ZIMAGE_PORT, log_level="info")
