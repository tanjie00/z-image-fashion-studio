import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const BASE_DIRS: Record<string, string> = {
  models: path.join(process.cwd(), 'upload', 'models'),
  garments: path.join(process.cwd(), 'upload', 'garments'),
  poses: path.join(process.cwd(), 'upload', 'poses'),
  results: path.join(process.cwd(), 'download', 'results'),
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json(
        { error: 'Invalid image path' },
        { status: 400 }
      );
    }

    const [folder, ...filenameParts] = pathSegments;
    const filename = filenameParts.join('/');

    // Resolve the base directory
    const baseDir = BASE_DIRS[folder];
    if (!baseDir) {
      return NextResponse.json(
        { error: 'Invalid image folder' },
        { status: 400 }
      );
    }

    const filePath = path.join(baseDir, filename);

    // Security: ensure the resolved path is within the base directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBaseDir = path.resolve(baseDir);
    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      return NextResponse.json(
        { error: 'Invalid image path' },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = fs.readFileSync(resolvedPath);

    // Determine content type
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to serve image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
