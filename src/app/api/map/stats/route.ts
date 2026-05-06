import { NextResponse } from 'next/server';
import { getMapStats } from '@/lib/map';
import type { ApiResponse, MapStats } from '@/lib/types';

export const revalidate = 10;

export async function GET() {
  try {
    const stats = await getMapStats();
    const response = NextResponse.json<ApiResponse<MapStats>>({
      success: true,
      data: stats,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=20');

    return response;
  } catch (error) {
    console.error('Error fetching map stats:', error);

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch map stats',
      },
      { status: 500 }
    );
  }
}
