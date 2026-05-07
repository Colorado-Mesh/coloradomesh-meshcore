import { NextRequest, NextResponse } from 'next/server';
import { proxyLiveMapEndpoint, validatePeerQuery } from '@/lib/live-map';
import type { ApiResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ deviceId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { deviceId } = await params;
  if (!deviceId) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Missing live-map device id' },
      { status: 400 }
    );
  }

  const validation = validatePeerQuery(request.nextUrl.searchParams);
  if (!validation.ok) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: validation.error },
      { status: validation.status }
    );
  }

  const result = await proxyLiveMapEndpoint('peers', {
    pathParams: { deviceId },
    query: validation.query,
  });

  if (!result.ok) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: result.error },
      { status: result.status }
    );
  }

  const response = NextResponse.json<ApiResponse<unknown>>({ success: true, data: result.data });
  response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=20');
  return response;
}
