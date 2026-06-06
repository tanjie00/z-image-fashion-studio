import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createId } from '@paralleldrive/cuid2';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;
    const category = formData.get('category') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'No projectId provided' }, { status: 400 });
    }

    // Verify project exists
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'upload', 'garments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueId = createId();
    const ext = path.extname(file.name) || '.png';
    const filename = `${uniqueId}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Get image dimensions
    let width: number | null = null;
    let height: number | null = null;
    try {
      const metadata = await sharp(filePath).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
    } catch {
      // Ignore metadata errors
    }

    // Create database record with relative path
    const garmentImage = await db.garmentImage.create({
      data: {
        projectId,
        url: `garments/${filename}`,
        name: file.name,
        width,
        height,
        category: category || null,
      },
    });

    return NextResponse.json(garmentImage);
  } catch (error) {
    console.error('Failed to upload garment image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
