import { NextRequest, NextResponse } from 'next/server';
import { pointsService } from '@/lib/points-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const frame = parseInt(searchParams.get('frame') || '0');
  const file = searchParams.get('file') || undefined;
  const camera = searchParams.get('camera') || 'front';

  try {
    const boxes = await pointsService.get2DBoxes(frame, camera, file);
    return NextResponse.json(boxes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 });
  }
}
