import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const tasks = await db.generationTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        results: true,
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch generation tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generation tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, modelImageId, garmentImageId, poseTemplateId, params, prompt } = body;

    if (!projectId || !modelImageId || !garmentImageId) {
      return NextResponse.json(
        { error: 'projectId, modelImageId, and garmentImageId are required' },
        { status: 400 }
      );
    }

    // Verify related records exist
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const modelImage = await db.modelImage.findUnique({ where: { id: modelImageId } });
    if (!modelImage) {
      return NextResponse.json({ error: 'Model image not found' }, { status: 404 });
    }

    const garmentImage = await db.garmentImage.findUnique({ where: { id: garmentImageId } });
    if (!garmentImage) {
      return NextResponse.json({ error: 'Garment image not found' }, { status: 404 });
    }

    if (poseTemplateId) {
      const pose = await db.poseTemplate.findUnique({ where: { id: poseTemplateId } });
      if (!pose) {
        return NextResponse.json({ error: 'Pose template not found' }, { status: 404 });
      }
    }

    const task = await db.generationTask.create({
      data: {
        projectId,
        modelImageId,
        garmentImageId,
        poseTemplateId: poseTemplateId || null,
        prompt: prompt || null,
        params: params ? JSON.stringify(params) : '{}',
        status: 'pending',
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create generation task:', error);
    return NextResponse.json(
      { error: 'Failed to create generation task' },
      { status: 500 }
    );
  }
}
