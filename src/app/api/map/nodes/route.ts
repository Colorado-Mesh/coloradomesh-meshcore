import { NextResponse } from 'next/server';
import { getMapNodes } from '@/lib/map';
import type { ApiResponse, MapNode } from '@/lib/types';

export const revalidate = 10;

export async function GET() {
  try {
    const nodes = await getMapNodes();
    const response = NextResponse.json<ApiResponse<MapNode[]>>({
      success: true,
      data: nodes,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=20');

    return response;
  } catch (error) {
    console.error('Error fetching map nodes:', error);

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch map nodes',
      },
      { status: 500 }
    );
  }
}
