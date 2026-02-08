import { NextResponse } from 'next/server';
import { runDataCleanup, upsertNetworkHealthDaily } from '@/lib/db';

const CLEANUP_SECRET = process.env.CLEANUP_SECRET;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (!CLEANUP_SECRET) {
    console.error('CLEANUP_SECRET not configured');
    return NextResponse.json(
      { success: false, error: 'Cleanup not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${CLEANUP_SECRET}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('Running scheduled data cleanup...');
    const result = await runDataCleanup();

    console.log(
      `Cleanup complete: ${result.packetsDeleted} packets deleted (${result.packetRetentionDays}d), ` +
        `${result.dailyStatsDeleted} daily stats deleted (${result.statsRetentionDays}d), ` +
        `${result.healthSnapshotsDeleted} health snapshots deleted, ` +
        `${result.staleNodes} stale nodes`
    );

    // Capture today's health snapshot after cleanup
    try {
      const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://denvermc.com';
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthData = await healthRes.json();

      if (healthData.success && healthData.data) {
        const h = healthData.data;
        await upsertNetworkHealthDaily({
          score: h.network_score ?? 0,
          status: h.status ?? 'offline',
          active_nodes: h.active_nodes ?? 0,
          total_nodes: h.total_nodes ?? 0,
          avg_snr: h.avg_snr,
          messages_24h: h.messages_24h,
          max_hop_count: h.max_hop_count,
          unique_contributors: h.unique_contributors,
          geo_spread_km: h.geo_spread_km,
          score_breakdown: h.score_breakdown,
        });
        console.log(`Health snapshot captured: score=${h.network_score}, status=${h.status}`);
      }
    } catch (snapshotErr) {
      console.warn('Failed to capture health snapshot:', snapshotErr instanceof Error ? snapshotErr.message : snapshotErr);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Cleanup failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
