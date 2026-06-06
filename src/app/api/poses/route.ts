import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category } : {};

    const poses = await db.poseTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(poses);
  } catch (error) {
    console.error('Failed to fetch pose templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pose templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, thumbnail, poseData } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Pose template name is required' },
        { status: 400 }
      );
    }

    const pose = await db.poseTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'standing',
        thumbnail: thumbnail || null,
        poseData: poseData || null,
        isDefault: false,
      },
    });

    return NextResponse.json(pose, { status: 201 });
  } catch (error) {
    console.error('Failed to create pose template:', error);
    return NextResponse.json(
      { error: 'Failed to create pose template' },
      { status: 500 }
    );
  }
}
