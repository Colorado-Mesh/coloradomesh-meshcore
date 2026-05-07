import { NextResponse } from 'next/server';
import { proxyLiveMapEndpoint } from '@/lib/live-map';
import type { ApiResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await proxyLiveMapEndpoint('snapshot');

  if (!result.ok) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: result.error },
      { status: result.status }
    );
  }

  const response = NextResponse.json<ApiResponse<unknown>>({ success: true, data: result.data });
  response.headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10');
  return response;
}
