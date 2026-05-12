import { getLiveMapBaseUrl, getLiveMapEndpointDefinitions } from './client';

export function buildLiveMapStatus() {
  const configured = Boolean(getLiveMapBaseUrl());
  const endpoints = getLiveMapEndpointDefinitions(configured);

  return {
    configured,
    endpoints,
  };
}
