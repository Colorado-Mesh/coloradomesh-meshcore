import { NextResponse } from 'next/server';
import { buildLiveMapStatus } from '@/lib/live-map';
import type { ApiResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const response = NextResponse.json<ApiResponse<ReturnType<typeof buildLiveMapStatus>>>(
    {
      success: true,
      data: buildLiveMapStatus(),
    }
  );

  response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return response;
}
