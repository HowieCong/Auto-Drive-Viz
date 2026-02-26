import { NextRequest, NextResponse } from 'next/server';
import { pointsService } from '@/lib/points-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const frame = parseInt(searchParams.get('frame') || '0');
  const file = searchParams.get('file') || undefined;
  const camera = searchParams.get('camera') || 'image_02';

  try {
    const buffer = await pointsService.getImageData(frame, camera, file);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600'
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
