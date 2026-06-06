import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify task exists
    const task = await db.generationTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Generation task not found' },
        { status: 404 }
      );
    }

    const results = await db.generationResult.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch generation results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generation results' },
      { status: 500 }
    );
  }
}
