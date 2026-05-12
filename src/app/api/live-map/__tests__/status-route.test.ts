import { describe, expect, it, vi } from 'vitest';
import type { LiveMapEndpointDefinition } from '@/lib/live-map';

const mocks = vi.hoisted(() => ({
  status: {
    configured: false,
    endpoints: [] as LiveMapEndpointDefinition[],
  },
}));

vi.mock('@/lib/live-map', () => ({
  buildLiveMapStatus: vi.fn(() => mocks.status),
}));

describe('live-map status route', () => {
  it('returns configured from buildLiveMapStatus', async () => {
    vi.resetModules();
    mocks.status.configured = false;
    mocks.status.endpoints = [
      {
        id: 'stats',
        label: 'Live-map stats',
        localPath: '/api/live-map/stats',
        upstreamPath: '/stats',
        availability: 'available',
        message: 'Available from local map snapshot fallback data when the upstream endpoint is unavailable.',
      },
    ];

    const { GET } = await import('../status/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.configured).toBe(false);
    expect(body.data.endpoints[0].availability).toBe('available');
  });
});
