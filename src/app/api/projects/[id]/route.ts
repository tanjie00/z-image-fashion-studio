import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        modelImages: { orderBy: { createdAt: 'desc' } },
        garmentImages: { orderBy: { createdAt: 'desc' } },
        generationTasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            results: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        modelImages: true,
        garmentImages: true,
        generationTasks: {
          include: { results: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete associated files from filesystem
    const fs = await import('fs');
    const path = await import('path');

    for (const img of project.modelImages) {
      const filePath = path.join(process.cwd(), 'upload', 'models', path.basename(img.url));
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Failed to delete model image file:', filePath, e);
      }
    }

    for (const img of project.garmentImages) {
      const filePath = path.join(process.cwd(), 'upload', 'garments', path.basename(img.url));
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Failed to delete garment image file:', filePath, e);
      }
    }

    for (const task of project.generationTasks) {
      for (const result of task.results) {
        const filePath = path.join(process.cwd(), 'download', 'results', path.basename(result.url));
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed to delete result image file:', filePath, e);
        }
      }
    }

    // Cascade delete will handle DB records
    await db.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
