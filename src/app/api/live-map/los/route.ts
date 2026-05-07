import { NextRequest, NextResponse } from 'next/server';
import { proxyLiveMapEndpoint, validateLosQuery } from '@/lib/live-map';
import type { ApiResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const validation = validateLosQuery(request.nextUrl.searchParams);
  if (!validation.ok) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: validation.error },
      { status: validation.status }
    );
  }

  const result = await proxyLiveMapEndpoint('los', { query: validation.query });

  if (!result.ok) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: result.error },
      { status: result.status }
    );
  }

  const response = NextResponse.json<ApiResponse<unknown>>({ success: true, data: result.data });
  response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return response;
}
