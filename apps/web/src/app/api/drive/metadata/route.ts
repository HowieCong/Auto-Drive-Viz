import { NextRequest, NextResponse } from 'next/server';
import { pointsService } from '@/lib/points-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
  }

  try {
    const data = await pointsService.getDriveMetadata(file);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
