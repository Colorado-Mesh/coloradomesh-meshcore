import { NextResponse } from 'next/server';
import { getNetworkHealthHistory } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';

export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = Number(searchParams.get('days')) || 30;
    const days = Math.min(Math.max(1, daysParam), 90);

    const history = await getNetworkHealthHistory(days);

    return NextResponse.json<ApiResponse<typeof history>>({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching health history:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch health history',
      },
      { status: 500 }
    );
  }
}
