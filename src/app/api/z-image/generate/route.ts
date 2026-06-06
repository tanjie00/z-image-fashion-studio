import { NextRequest, NextResponse } from 'next/server';

const Z_IMAGE_SERVICE_URL = process.env.Z_IMAGE_SERVICE_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, negative_prompt, resolution, seed, num_inference_steps, guidance_scale, cfg_normalization, random_seed, reference_image } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Try fallback endpoint first (supports multiple backends), then regular generate
    let response: Response | null = null;

    try {
      response = await fetch(`${Z_IMAGE_SERVICE_URL}/generate/fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negative_prompt: negative_prompt || '',
          resolution: resolution || '864x1152 ( 3:4 )',
          seed: seed ?? 42,
          num_inference_steps: num_inference_steps ?? 30,
          guidance_scale: guidance_scale ?? 4.0,
          cfg_normalization: cfg_normalization ?? false,
          random_seed: random_seed ?? true,
          reference_image: reference_image || null,
        }),
        signal: AbortSignal.timeout(300000), // 5 minutes
      });
    } catch {
      // Fallback endpoint might not exist in older versions
      response = null;
    }

    // If fallback failed, try regular generate endpoint
    if (!response || !response.ok) {
      response = await fetch(`${Z_IMAGE_SERVICE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negative_prompt: negative_prompt || '',
          resolution: resolution || '864x1152 ( 3:4 )',
          seed: seed ?? 42,
          num_inference_steps: num_inference_steps ?? 30,
          guidance_scale: guidance_scale ?? 4.0,
          cfg_normalization: cfg_normalization ?? false,
          random_seed: random_seed ?? true,
          reference_image: reference_image || null,
        }),
        signal: AbortSignal.timeout(300000),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Z-Image service error:', errorText);
      return NextResponse.json(
        { error: 'Z-Image service request failed', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Z-Image generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Z-Image generation route error:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to Z-Image service',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${Z_IMAGE_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'offline', model: 'Tongyi-MAI/Z-Image', mode: 'unknown' },
        { status: 200 }
      );
    }

    const health = await response.json();
    return NextResponse.json({ ...health, status: 'online' });
  } catch {
    return NextResponse.json(
      { status: 'offline', model: 'Tongyi-MAI/Z-Image', mode: 'unknown' },
      { status: 200 }
    );
  }
}
