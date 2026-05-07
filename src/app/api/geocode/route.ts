import { NextRequest, NextResponse } from 'next/server';
import { addRateLimitHeaders, checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { ApiResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; result: GeocodeResult }>();

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(`geocode:${getClientIp(request)}`, {
    limit: 20,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return addRateLimitHeaders(
      NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Too many geocode requests. Try again shortly.' },
        { status: 429 },
      ),
      rateLimit,
    );
  }

  const query = normalizeQuery(request.nextUrl.searchParams.get('q'));
  if (!query) {
    return addRateLimitHeaders(
      NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Query must be 2–120 characters.' },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  const cached = cache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return addRateLimitHeaders(successResponse(cached.result, 'HIT'), rateLimit);
  }

  const outboundRateLimit = checkRateLimit('geocode:nominatim:global', {
    limit: 1,
    windowSeconds: 1,
  });

  if (!outboundRateLimit.success) {
    return addRateLimitHeaders(
      NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Location lookup is busy. Try again shortly.' },
        { status: 429 },
      ),
      outboundRateLimit,
    );
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('q', query);
    url.searchParams.set('countrycodes', 'us');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ColoradoMeshCore-NamingWizard/1.0 (https://coloradomesh.org)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return addRateLimitHeaders(
        NextResponse.json<ApiResponse<never>>(
          { success: false, error: 'Location lookup is temporarily unavailable.' },
          { status: 502 },
        ),
        rateLimit,
      );
    }

    const data = (await response.json()) as NominatimResult[];
    const first = data[0];
    if (!first?.lat || !first.lon) {
      return addRateLimitHeaders(
        NextResponse.json<ApiResponse<never>>(
          { success: false, error: 'Location not found. Try a more specific address.' },
          { status: 404 },
        ),
        rateLimit,
      );
    }

    const result = {
      lat: Number(first.lat),
      lon: Number(first.lon),
      displayName: first.display_name ?? query,
    };

    if (!Number.isFinite(result.lat) || !Number.isFinite(result.lon)) {
      return addRateLimitHeaders(
        NextResponse.json<ApiResponse<never>>(
          { success: false, error: 'Location lookup returned invalid coordinates.' },
          { status: 502 },
        ),
        rateLimit,
      );
    }

    cache.set(query, { expiresAt: Date.now() + CACHE_TTL_MS, result });
    return addRateLimitHeaders(successResponse(result, 'MISS'), rateLimit);
  } catch {
    return addRateLimitHeaders(
      NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Location lookup failed. Try again later.' },
        { status: 502 },
      ),
      rateLimit,
    );
  }
}

function normalizeQuery(value: string | null): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length < 2 || normalized.length > 120) return null;
  return normalized;
}

function successResponse(result: GeocodeResult, cacheStatus: 'HIT' | 'MISS') {
  const response = NextResponse.json<ApiResponse<GeocodeResult>>({ success: true, data: result });
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  response.headers.set('X-Geocode-Cache', cacheStatus);
  return response;
}
