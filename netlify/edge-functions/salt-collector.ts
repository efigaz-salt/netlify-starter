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
  collectorVersion: '0.1.0-efi-test-8',
  collectorPlatform: 'netlify',
  

  collectorLabels: {
    environment: Netlify.env.get('CONTEXT') || 'production',
    site: Netlify.env.get('SITE_NAME') || 'unknown',
    region: Netlify.env.get('DEPLOY_PRIME_URL') || 'unknown',
  },
});

export default async (request: Request, context: Context) => {
  // Pass the request through to the next handler in the chain
  // This allows security.ts and api-router.ts to continue processing
  const response = await context.next();

  // Collect traffic data (fire-and-forget, doesn't block the response)
  // This sends the request/response pair to Salt Security for analysis
  return await collector.collect(request, response);
};

// Configure which paths this edge function runs on
export const config = {
  path: '/api/*', // Run on all /api/* paths to collect API traffic
};
