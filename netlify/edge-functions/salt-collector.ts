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
  debug: Netlify.env.get('SALT_DEBUG') === 'true',
  
  // Optional metadata
  collectorUuid: Netlify.env.get('SALT_COLLECTOR_UUID') || "undefined UUID",
  collectorPlatform: 'netlify',

 
});

export default async (request: Request, context: Context) => {
  // IMPORTANT: Clone the request BEFORE calling context.next() to capture request bodies
  // This is necessary for POST/PUT/PATCH requests with bodies
  const requestForCollection = request.clone();

  // Pass the request through to the next handler in the chain
  // This allows security.ts and api-router.ts to continue processing
  const response = await context.next();

  // Debug: Log request and response details
  const requestBody = await requestForCollection.clone().text();
  const responseBody = await response.clone().text();

  console.log('[salt-collector] Request:', {
    method: requestForCollection.method,
    url: requestForCollection.url,
    body: requestBody
  });

  console.log('[salt-collector] Response:', {
    status: response.status,
    body: responseBody
  });

  // Collect traffic data using the cloned request (fire-and-forget, doesn't block the response)
  return collector.collect(requestForCollection, response);
};

// Configure which paths this edge function runs on
export const config = {
  path: '/api/*', // Run on all /api/* paths to collect API traffic
};
