/**
 * Salt Security Collector Edge Function
 *
 * This edge function integrates the Salt Security collector
 * to capture and analyze HTTP traffic flowing through Netlify Edge.
 *
 * Traffic Flow:
 * Client → security.ts → salt-collector.ts → api-router.ts → Backend
 */

import { createCollector } from '@saltsecurity/netlify-collector';
import type { Context } from '@netlify/edge-functions';

// Initialize the collector once (outside the handler for efficiency)
const collector = createCollector({
  hybridUrl: Netlify.env.get('SALT_HYBRID_URL')!,
  hybridToken: Netlify.env.get('SALT_HYBRID_TOKEN')!,
  collectorUuid: Netlify.env.get('SALT_COLLECTOR_UUID')!,
  debug: Netlify.env.get('SALT_DEBUG') === 'true',

  // Optional metadata
  collectorPlatform: 'netlify',
  collectorLabels: {
    environment: Netlify.env.get('CONTEXT') || 'production',
  },
});

export default async (request: Request, context: Context) => {
  // IMPORTANT: Clone the request BEFORE calling context.next() to capture request bodies
  // This is necessary for POST/PUT/PATCH requests with bodies
  const requestForCollection = request.clone();

  // Pass the request through to the next handler in the chain
  // This allows next edge functions and the backend to process it
  const response = await context.next();

  // Collect traffic data using the cloned request
  // This waits for bodies to be collected and sent before returning
  return await collector.collect(requestForCollection, response);
};

// Configure which paths this edge function runs on
export const config = {
  path: '/api/*', // Run on all /api/* paths to collect API traffic
  excludedPath: ['/api/ws'], // Exclude WebSocket - cannot be collected as HTTP traffic
};
