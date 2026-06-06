# Work Log

## Task 6 - Z-Image Model Integration (ModelScope + HuggingFace)
**Date:** 2026-06-06
**Status:** Completed

### Summary
Integrated the Tongyi-MAI/Z-Image 6B text-to-image model into the application, replacing the default `z-ai-web-dev-sdk` as the primary generation backend. Added ModelScope support for better China mainland access.

### Key Changes

1. **Z-Image Python Bridge Service v3.0** (`z-image-service/main.py`):
   - Added `modelscope` mode (default) — ModelScope Space API for China mainland users
   - Kept `remote` mode — HuggingFace Space via gradio_client
   - Kept `api` mode — HuggingFace Inference API (serverless)
   - Kept `local` mode — Local diffusers pipeline (GPU required)
   - Added `/generate/fallback` endpoint with smart fallback chain: modelscope → remote → api → local
   - Health endpoint returns both ModelScope and HuggingFace URLs

2. **Missing Upload API Routes** (previously broken, now fixed):
   - `src/app/api/upload/model/route.ts` — POST: Upload model images
   - `src/app/api/upload/garment/route.ts` — POST: Upload garment images
   - `src/app/api/upload/model/[id]/route.ts` — DELETE: Remove model image
   - `src/app/api/upload/garment/[id]/route.ts` — DELETE: Remove garment image

3. **Generation API Enhancement** (`src/app/api/generate/[id]/process/route.ts`):
   - Z-Image is now the default generation model
   - Added automatic fallback to `z-ai-web-dev-sdk` when Z-Image service is offline
   - Tries `/generate/fallback` endpoint first for multi-backend resilience

4. **Z-Image Proxy API** (`src/app/api/z-image/generate/route.ts`):
   - Updated to try fallback endpoint first, then regular generate
   - Returns mode information in health response

5. **Frontend Updates**:
   - Z-Image shown as primary model with "默认" badge
   - Default AI SDK relabeled as "备选 AI 模型"
   - Added ModelScope mode indicator in health display
   - Default negative prompt set to common quality exclusions
   - Model badge shows "ModelScope/HF"

6. **Configuration**:
   - `.env` updated with Z-Image environment variables
   - `package.json` scripts: `z-image` (modelscope), `z-image:hf`, `z-image:local`
   - `z-image-service/start.sh` updated with mode-specific dependency installation

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| ZIMAGE_MODE | modelscope | Backend mode |
| ZIMAGE_PORT | 8001 | Bridge service port |
| ZIMAGE_SERVICE_URL | http://localhost:8001 | Used by Next.js |
| ZIMAGE_HF_TOKEN | | HuggingFace API token |
| ZIMAGE_MS_TOKEN | | ModelScope token (optional) |
| ZIMAGE_LOCAL_MODEL | Tongyi-MAI/Z-Image | Model repo/path for local mode |
| ZIMAGE_DEVICE | cuda | Device for local mode |

### Model Info
- **Name**: Tongyi-MAI/Z-Image
- **Parameters**: 6B
- **Architecture**: S3-DiT (Scalable Single-Stream Diffusion Transformer)
- **ModelScope**: https://www.modelscope.cn/models/Tongyi-MAI/Z-Image/
- **HuggingFace**: https://huggingface.co/Tongyi-MAI/Z-Image/
- **Paper**: arXiv:2511.22699
- **License**: Apache 2.0

## Task 4 - Backend Developer: API Routes Implementation
**Date:** 2025-01-23
**Status:** Completed

### Summary
Created all 12 backend API route files for the 模特换装 + 姿势裂变工具 (Model Try-On + Pose Fission Tool) application.

### Files Created
1. `src/app/api/projects/route.ts` - GET (list projects) + POST (create project)
2. `src/app/api/projects/[id]/route.ts` - GET (project detail with relations) + DELETE (cascade delete with file cleanup)
3. `src/app/api/upload/model/route.ts` - POST (upload model image with sharp dimension detection)
4. `src/app/api/upload/garment/route.ts` - POST (upload garment image with category support)
5. `src/app/api/upload/model/[id]/route.ts` - DELETE (delete model image + file)
6. `src/app/api/upload/garment/[id]/route.ts` - DELETE (delete garment image + file)
7. `src/app/api/poses/route.ts` - GET (list poses with optional category filter) + POST (create pose)
8. `src/app/api/poses/seed/route.ts` - POST (seed 8 default Chinese-named poses)
9. `src/app/api/generate/route.ts` - GET (list tasks with optional filters) + POST (create generation task)
10. `src/app/api/generate/[id]/process/route.ts` - POST (process task using z-ai-web-dev-sdk)
11. `src/app/api/generate/[id]/results/route.ts` - GET (get results for a task)
12. `src/app/api/images/[...path]/route.ts` - GET (serve uploaded/generated images with proper content-type)

### Key Implementation Details
- Used `@paralleldrive/cuid2` for unique filenames (installed as new dependency)
- Used `sharp` for image dimension detection on upload
- Used `z-ai-web-dev-sdk` (dynamic import) for AI image generation with portrait 768x1344 size
- Image serving route supports models/, garments/, results/ folders with path traversal protection
- Project delete cascade-cleans associated files from filesystem
- All routes have proper error handling with try/catch and appropriate HTTP status codes
- ESLint passes with no errors

## Task 5 - Frontend Developer: Complete Frontend Implementation
**Date:** 2025-01-23
**Status:** Completed

### Summary
Built the complete frontend for the "AI 模特换装 + 姿势裂变工具" web application using Next.js 16, Tailwind CSS 4, shadcn/ui, Zustand, and Lucide React icons.

### Files Created
1. `src/lib/types.ts` - Type definitions for all entities plus constants for step labels, garment categories, pose categories
2. `src/lib/store.ts` - Zustand store with project, step, selection, and generation params state
3. `src/components/image-dropzone.tsx` - Reusable drag & drop upload component
4. `src/components/project-selector.tsx` - Project selector dialog with create/select/delete
5. `src/components/steps/upload-step.tsx` - Upload step with model/garment image panels, selection, delete
6. `src/components/steps/pose-step.tsx` - Pose selection with category tabs, gradient cards, seed button
7. `src/components/steps/configure-step.tsx` - Configuration with previews, sliders, batch size, prompt
8. `src/components/steps/generate-step.tsx` - Generation tasks list with status, process/retry, auto-refresh
9. `src/components/steps/preview-step.tsx` - Comparison view with navigation, enlarge dialog
10. `src/components/steps/export-step.tsx` - Export with selection, batch download
11. `src/app/page.tsx` - Main page with header, step nav, content, footer

### Key Design Choices
- Rose/pink accent color scheme (no indigo/blue)
- Chinese UI text throughout
- Mobile-first responsive design
- 6-step horizontal workflow stepper
- All ESLint errors resolved
