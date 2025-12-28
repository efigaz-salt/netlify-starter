/**
 * Example Netlify Edge Function with Salt Security Collector
 *
 * This example shows how to integrate the Salt Security collector
 * into your Netlify Edge Function to capture HTTP traffic.
 *
 * Note: This file will show TypeScript errors about 'Netlify' not being defined.
 * This is expected - 'Netlify' is a global available only in the Netlify runtime.
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
    site: Netlify.env.get('SITE_NAME') || 'unknown',
  },

  // Optional: Maximum exchange size (default: 3.99MB)
  // Exchanges larger than this will be dropped with a warning
  maxExchangeSizeBytes: 4182425, // 3.99MB

  // Optional: Memory safety configuration (defaults shown)
  // Allow body collection without Content-Length headers (default: false)
  // WARNING: May cause OOM with large responses. Only enable if responses are guaranteed small.
  allowBodyWithoutContentLengthHeader: false, // Recommended: false (default)

  // Collect exchanges even when bodies are skipped due to missing Content-Length (default: false)
  // When true: sends metadata (headers, URL, method, status) even if body is empty
  // When false: drops entire exchange if body cannot be safely collected
  collectExchangeWithoutBody: false, // Default: false
});

export default async (request: Request, context: Context) => {
  // IMPORTANT: Clone the request BEFORE calling context.next() to capture request bodies
  // This is necessary for POST/PUT/PATCH requests with bodies
  const requestForCollection = request.clone();

  // Your application logic here
  // For example, proxying to an origin or generating a response
  const response = await context.next(); // Get response from origin

  // OR create your own response:
  // const response = new Response(JSON.stringify({ message: 'Hello World' }), {
  //   status: 200,
  //   headers: { 'Content-Type': 'application/json' },
  // });

  // Collect traffic data using the cloned request
  // The collector returns immediately while sending data in the background via context.waitUntil()
  return await collector.collect(requestForCollection, response, context);
};

// Optional: Configure which paths this edge function runs on
export const config = {
  path: '/api/short', // Run on all /api/* paths
};
