import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { trustProxyHeaders } from '@/lib/rate-limit';

/**
 * Simple in-memory rate limiter for middleware
 * Note: In serverless, each instance has its own store
 * For distributed rate limiting, use Redis or similar
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit config: 100 requests per minute per IP
const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 1000;

function getClientIp(request: NextRequest): string {
  if (trustProxyHeaders()) {
    const netlifyIp = request.headers.get('x-nf-client-connection-ip');
    if (netlifyIp) return netlifyIp;

    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();

    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;
  }

  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Cleanup old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (val.resetTime < now) rateLimitStore.delete(key);
    }
  }

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetTime: now + WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetTime: entry.resetTime };
}

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const { allowed, remaining, resetTime } = checkRateLimit(ip);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
