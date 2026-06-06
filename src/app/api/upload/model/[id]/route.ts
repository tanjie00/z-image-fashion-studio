import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const modelImage = await db.modelImage.findUnique({ where: { id } });
    if (!modelImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'upload', modelImage.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await db.modelImage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete model image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
