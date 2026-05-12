import { RUNTIME_ENV } from '@/lib/constants';

/**
 * Simple in-memory rate limiter for API routes
 * Uses a sliding window approach with automatic cleanup
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (per serverless instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export function trustProxyHeaders(): boolean {
  return process.env[RUNTIME_ENV.TRUST_PROXY_HEADERS]?.trim().toLowerCase() === 'true';
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowSeconds: 60 }
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (entry.count >= config.limit) {
    // Rate limited
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request headers
 * Handles Netlify, Cloudflare, and standard proxies
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  if (trustProxyHeaders()) {
    const netlifyIp = headers.get('x-nf-client-connection-ip');
    if (netlifyIp) return netlifyIp;

    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp;
  }

  return 'unknown';
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
