import { NextRequest, NextResponse } from 'next/server';
import { pointsService } from '@/lib/points-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const frame = parseInt(searchParams.get('frame') || '0');
  const file = searchParams.get('file') || undefined;

  try {
    const buffer = await pointsService.getSampleData(frame, file);
    
    // Return binary data
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sample' }, { status: 500 });
  }
}
