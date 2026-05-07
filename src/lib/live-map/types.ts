export type LiveMapEndpointAvailability = 'available' | 'unavailable' | 'deferred';

export type LiveMapProxiedEndpointId =
  | 'snapshot'
  | 'stats'
  | 'nodes'
  | 'peers'
  | 'los'
  | 'los-elevations'
  | 'coverage'
  | 'weather-radar-country-bounds';

export type LiveMapDeferredEndpointId = 'websocket' | 'debug' | 'turnstile';

export type LiveMapEndpointId = LiveMapProxiedEndpointId | LiveMapDeferredEndpointId;

export interface LiveMapEndpointDefinition {
  id: LiveMapEndpointId;
  label: string;
  localPath: string;
  upstreamPath: string | null;
  availability: LiveMapEndpointAvailability;
  message: string;
}

export interface LiveMapProxyOptions {
  pathParams?: Record<string, string>;
  query?: URLSearchParams | Record<string, string | number | boolean | null | undefined>;
}

export type LiveMapProxyResult =
  | {
      ok: true;
      status: number;
      data: unknown;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export interface LiveMapQueryValidationSuccess {
  ok: true;
  query: URLSearchParams;
}

export interface LiveMapQueryValidationFailure {
  ok: false;
  status: number;
  error: string;
}

export type LiveMapQueryValidationResult = LiveMapQueryValidationSuccess | LiveMapQueryValidationFailure;
