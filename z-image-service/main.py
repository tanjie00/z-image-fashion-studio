"""
Z-Image Bridge Service
Wraps the HuggingFace Z-Image Space API via gradio_client
to provide a simple REST API for the Next.js application.
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("z-image-service")

app = FastAPI(title="Z-Image Bridge Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-loaded Gradio client
_client = None


def get_client():
    """Lazily initialize the Gradio client."""
    global _client
    if _client is None:
        from gradio_client import Client
        logger.info("Initializing Gradio client for Z-Image Space...")
        _client = Client("Tongyi-MAI/Z-Image")
        logger.info("Gradio client initialized successfully")
    return _client


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
    # Optional reference image (base64 encoded)
    reference_image: Optional[str] = None


class GenerateResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    seed_used: Optional[str] = None
    seed: Optional[int] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    model: str
    space_url: str


# --- API Endpoints ---

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        model="Tongyi-MAI/Z-Image",
        space_url="https://huggingface.co/spaces/Tongyi-MAI/Z-Image",
    )


@app.get("/resolutions")
async def get_resolutions():
    """Return available resolution options."""
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
            {"value": "1680x720 ( 21:9 )", "label": "1680x720 (21:9)", "width": 1680, "height": 720},
            {"value": "720x1680 ( 9:21 )", "label": "720x1680 (9:21)", "width": 720, "height": 1680},
        ]
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """Generate an image using Z-Image model via HuggingFace Space."""
    try:
        client = get_client()

        # Prepare gallery images if reference image is provided
        gallery_images = []
        if request.reference_image:
            # Decode base64 reference image and save to temp file
            img_data = base64.b64decode(request.reference_image)
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
                f.write(img_data)
                temp_path = f.name
            gallery_images = [{"image": {"path": temp_path}, "caption": None}]

        logger.info(f"Generating image with prompt: {request.prompt[:100]}...")
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
        logger.info(f"Image generated in {elapsed:.2f}s")

        # Clean up temp file if used
        if request.reference_image and gallery_images:
            try:
                os.unlink(gallery_images[0]["image"]["path"])
            except:
                pass

        # Parse result
        generated_images, seed_used, seed_value = result

        if not generated_images or len(generated_images) == 0:
            return GenerateResponse(
                success=False,
                error="No image was generated by the Z-Image model",
            )

        # Get the first generated image
        first_image = generated_images[0]
        image_path = None

        if isinstance(first_image, dict):
            image_info = first_image.get("image", {})
            if isinstance(image_info, dict):
                image_path = image_info.get("path") or image_info.get("url")
            elif isinstance(image_info, str):
                image_path = image_info

        if not image_path:
            return GenerateResponse(
                success=False,
                error="Could not extract image path from response",
            )

        # Read and encode the image as base64
        if os.path.exists(image_path):
            with open(image_path, "rb") as f:
                image_data = f.read()
            image_base64 = base64.b64encode(image_data).decode("utf-8")
        elif image_path.startswith("http"):
            # Download from URL
            import urllib.request
            resp = urllib.request.urlopen(image_path)
            image_data = resp.read()
            image_base64 = base64.b64encode(image_data).decode("utf-8")
        else:
            return GenerateResponse(
                success=False,
                error=f"Image path not accessible: {image_path}",
            )

        return GenerateResponse(
            success=True,
            image_base64=image_base64,
            seed_used=str(seed_used) if seed_used else None,
            seed=seed_value if isinstance(seed_value, (int, float)) else None,
        )

    except Exception as e:
        logger.error(f"Image generation failed: {e}", exc_info=True)
        return GenerateResponse(
            success=False,
            error=str(e),
        )


if __name__ == "__main__":
    port = int(os.environ.get("Z_IMAGE_PORT", "8001"))
    logger.info(f"Starting Z-Image Bridge Service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
