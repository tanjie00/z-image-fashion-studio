import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createId } from '@paralleldrive/cuid2';

// Ensure download directory exists
function ensureDownloadDir() {
  const downloadDir = path.join(process.cwd(), 'download', 'results');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  return downloadDir;
}

function getCategoryDescription(category: string | null): string {
  const descriptions: Record<string, string> = {
    top: 'a stylish top',
    bottom: 'fashionable bottoms',
    dress: 'an elegant dress',
    outerwear: 'a trendy outerwear piece',
    accessory: 'a fashionable accessory',
  };
  return descriptions[category || ''] || 'a fashionable garment';
}

function getPoseDescription(poseName: string | null, poseCategory: string | null): string {
  if (!poseName) return 'in a natural standing pose';
  return `in a ${poseName} pose`;
}

/**
 * Convert a local upload image file to base64
 */
function imageToBase64(relativePath: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), 'upload', relativePath);
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      return buffer.toString('base64');
    }
  } catch (e) {
    console.warn('Failed to read image for base64:', e);
  }
  return null;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the task with related data
    const task = await db.generationTask.findUnique({
      where: { id },
      include: {
        results: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Generation task not found' },
        { status: 404 }
      );
    }

    if (task.status === 'processing') {
      return NextResponse.json(
        { error: 'Task is already being processed' },
        { status: 400 }
      );
    }

    if (task.status === 'completed') {
      return NextResponse.json(
        { error: 'Task has already been completed' },
        { status: 400 }
      );
    }

    // Update task status to processing
    await db.generationTask.update({
      where: { id },
      data: { status: 'processing' },
    });

    try {
      // Fetch related images and pose
      const modelImage = await db.modelImage.findUnique({
        where: { id: task.modelImageId },
      });
      const garmentImage = await db.garmentImage.findUnique({
        where: { id: task.garmentImageId },
      });
      const poseTemplate = task.poseTemplateId
        ? await db.poseTemplate.findUnique({ where: { id: task.poseTemplateId } })
        : null;

      // Parse generation params
      const taskParams = JSON.parse(task.params || '{}');
      const useZImage = taskParams.model === 'z-image';

      // Build prompt
      const garmentDesc = getCategoryDescription(garmentImage?.category || null);
      const poseDesc = getPoseDescription(poseTemplate?.name || null, poseTemplate?.category || null);

      const userPrompt = task.prompt || '';
      const aiPrompt = userPrompt.trim()
        ? `${userPrompt}, professional fashion photography, studio lighting, full body shot, high quality, 8k`
        : `A fashion model wearing ${garmentDesc} ${poseDesc}, professional studio photography, full body shot, high fashion editorial style, studio lighting, high quality, 8k resolution`;

      let imageBuffer: Buffer;

      if (useZImage) {
        // --- Z-Image Model Generation ---
        console.log('[Z-Image] Using Z-Image model for generation...');

        const Z_IMAGE_SERVICE_URL = process.env.Z_IMAGE_SERVICE_URL || 'http://localhost:8001';

        // Prepare reference image if available
        let referenceImage: string | null = null;
        if (modelImage?.url) {
          referenceImage = imageToBase64(modelImage.url);
        }

        const zImagePayload: Record<string, unknown> = {
          prompt: aiPrompt,
          negative_prompt: taskParams.negativePrompt || '',
          resolution: taskParams.resolution || '864x1152 ( 3:4 )',
          seed: taskParams.seed ?? 42,
          num_inference_steps: taskParams.numInferenceSteps ?? 30,
          guidance_scale: taskParams.guidanceScale ?? 4.0,
          cfg_normalization: taskParams.cfgNormalization ?? false,
          random_seed: taskParams.randomSeed ?? true,
          reference_image: referenceImage,
        };

        const zImageResponse = await fetch(`${Z_IMAGE_SERVICE_URL}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zImagePayload),
          signal: AbortSignal.timeout(300000), // 5 minutes timeout
        });

        if (!zImageResponse.ok) {
          const errorText = await zImageResponse.text();
          throw new Error(`Z-Image service error: ${errorText}`);
        }

        const zImageResult = await zImageResponse.json();

        if (!zImageResult.success || !zImageResult.image_base64) {
          throw new Error(zImageResult.error || 'Z-Image generation returned no image');
        }

        imageBuffer = Buffer.from(zImageResult.image_base64, 'base64');
        console.log('[Z-Image] Image generated successfully');

      } else {
        // --- Default AI SDK Generation ---
        console.log('[Default] Using default AI SDK for generation...');

        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const zai = await ZAI.create();
        const response = await zai.images.generations.create({
          prompt: aiPrompt,
          size: '768x1344',
        });

        // Extract the generated image
        const generatedImage = response.data?.[0];
        if (!generatedImage) {
          throw new Error('No image was generated');
        }

        if (generatedImage.base64) {
          imageBuffer = Buffer.from(generatedImage.base64, 'base64');
        } else if (generatedImage.b64_json) {
          imageBuffer = Buffer.from(generatedImage.b64_json, 'base64');
        } else if (generatedImage.url) {
          const imageResponse = await fetch(generatedImage.url);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`);
          }
          const arrayBuffer = await imageResponse.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
        } else {
          throw new Error('No image data returned from AI');
        }
      }

      // Save the generated image
      const downloadDir = ensureDownloadDir();
      const uniqueId = createId();
      const filename = `${uniqueId}.png`;
      const filePath = path.join(downloadDir, filename);

      // Convert to PNG and save
      await sharp(imageBuffer).png().toFile(filePath);

      // Get dimensions
      let width: number | null = null;
      let height: number | null = null;
      try {
        const metadata = await sharp(filePath).metadata();
        width = metadata.width || null;
        height = metadata.height || null;
      } catch (e) {
        console.warn('Failed to get result image dimensions:', e);
      }

      // Create result record
      const url = `results/${filename}`;
      const result = await db.generationResult.create({
        data: {
          taskId: id,
          url,
          width,
          height,
        },
      });

      // Update task status to completed
      await db.generationTask.update({
        where: { id },
        data: { status: 'completed' },
      });

      return NextResponse.json({
        task: { ...task, status: 'completed' },
        result,
      });
    } catch (generationError) {
      // Update task status to failed
      console.error('Image generation failed:', generationError);
      await db.generationTask.update({
        where: { id },
        data: { status: 'failed' },
      });

      return NextResponse.json(
        {
          error: 'Image generation failed',
          details: generationError instanceof Error ? generationError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to process generation task:', error);
    return NextResponse.json(
      { error: 'Failed to process generation task' },
      { status: 500 }
    );
  }
}
