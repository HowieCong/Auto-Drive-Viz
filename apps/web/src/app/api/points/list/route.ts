import { NextResponse } from 'next/server';
import { pointsService } from '@/lib/points-service';

export async function GET() {
  try {
    const files = pointsService.getFiles();
    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
