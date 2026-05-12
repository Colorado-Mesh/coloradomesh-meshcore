import { afterEach, describe, expect, it } from 'vitest';

import { getClientIp, trustProxyHeaders } from '../rate-limit';

const TRUST_PROXY_ENV = 'MESHCORE_TRUST_PROXY_HEADERS';

afterEach(() => {
  delete process.env[TRUST_PROXY_ENV];
});

describe('rate limit client IP detection', () => {
  it('does not trust forwarded client-IP headers by default', () => {
    const request = new Request('https://coloradomesh.test/api/geocode', {
      headers: {
        'x-forwarded-for': '203.0.113.10',
        'x-real-ip': '203.0.113.11',
        'cf-connecting-ip': '203.0.113.12',
        'x-nf-client-connection-ip': '203.0.113.13',
      },
    });

    expect(trustProxyHeaders()).toBe(false);
    expect(getClientIp(request)).toBe('unknown');
  });

  it('uses proxy-provided IP headers only when explicitly trusted', () => {
    process.env[TRUST_PROXY_ENV] = 'true';
    const request = new Request('https://coloradomesh.test/api/geocode', {
      headers: {
        'x-forwarded-for': '203.0.113.10',
        'x-real-ip': '203.0.113.11',
      },
    });

    expect(trustProxyHeaders()).toBe(true);
    expect(getClientIp(request)).toBe('203.0.113.10');
  });
});
