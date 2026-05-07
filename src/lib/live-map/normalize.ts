import { getLiveMapEndpointDefinitions } from './client';

export function buildLiveMapStatus() {
  const endpoints = getLiveMapEndpointDefinitions();

  return {
    configured: endpoints.some((endpoint) => endpoint.availability === 'available'),
    endpoints,
  };
}
