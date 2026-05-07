export {
  getLiveMapEndpointDefinitions,
  proxyLiveMapEndpoint,
  validateElevationQuery,
  validateLosQuery,
  validateNodesQuery,
  validatePeerQuery,
  validateWeatherBoundsQuery,
} from './client';
export { buildLiveMapStatus } from './normalize';
export type {
  LiveMapDeferredEndpointId,
  LiveMapEndpointAvailability,
  LiveMapEndpointDefinition,
  LiveMapEndpointId,
  LiveMapProxiedEndpointId,
  LiveMapProxyOptions,
  LiveMapProxyResult,
  LiveMapQueryValidationResult,
} from './types';
