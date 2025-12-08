/**
 * Test API Handler - Configurable delay and large response endpoints
 */

// Response helper
const response = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    ...headers,
  },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate large response data
const generateLargeResponse = (sizeInMB) => {
  // Each character is roughly 1 byte in ASCII
  // We'll generate a JSON array with repeated objects
  const targetSize = sizeInMB * 1024 * 1024; // Convert MB to bytes

  // Create a sample object (~100 bytes each)
  const sampleObj = {
    id: 0,
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    data: "Lorem ipsum dolor sit amet consectetur adipiscing",
    timestamp: new Date().toISOString(),
  };

  const objSize = JSON.stringify(sampleObj).length + 1; // +1 for comma
  const numObjects = Math.floor(targetSize / objSize);

  // For very large responses, we'll stream or chunk
  // Lambda has a 6MB response limit, so we'll return what we can
  // and indicate the actual requested size
  const maxLambdaSize = 5.5 * 1024 * 1024; // 5.5MB to be safe
  const actualObjects = Math.min(numObjects, Math.floor(maxLambdaSize / objSize));

  const items = [];
  for (let i = 0; i < actualObjects; i++) {
    items.push({
      ...sampleObj,
      id: i,
      uuid: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
    });
  }

  return {
    requestedSizeMB: sizeInMB,
    actualSizeMB: (actualObjects * objSize) / (1024 * 1024),
    itemCount: actualObjects,
    note: sizeInMB > 5.5 ? 'Lambda response limit is ~6MB. For larger responses, use streaming or pagination.' : null,
    items,
  };
};

// Handler
exports.handle = async (ctx) => {
  const { method, path, query, body } = ctx;

  // GET /test/delay - Delayed response endpoint
  if (path === '/test/delay' && (method === 'GET' || method === 'POST')) {
    // Get delay from query param or body (in milliseconds)
    let delayMs = parseInt(query.delay || (body && body.delay) || '1000', 10);

    // Cap at 2 minutes (120000ms) - Lambda timeout is typically 30s, but we'll allow longer for testing
    const maxDelay = 120000;
    if (delayMs > maxDelay) {
      delayMs = maxDelay;
    }
    if (delayMs < 0) {
      delayMs = 0;
    }

    const startTime = Date.now();

    // Wait for the specified delay
    await sleep(delayMs);

    const endTime = Date.now();
    const actualDelay = endTime - startTime;

    return response(200, {
      success: true,
      message: 'Delayed response completed',
      requestedDelayMs: delayMs,
      actualDelayMs: actualDelay,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      timestamp: new Date().toISOString(),
    });
  }

  // GET /test/large - Large response endpoint
  if (path === '/test/large' && (method === 'GET' || method === 'POST')) {
    // Get size from query param or body (in MB)
    let sizeMB = parseFloat(query.size || (body && body.size) || '1');

    // Cap at reasonable size (Lambda limit is ~6MB for response)
    if (sizeMB > 500) {
      sizeMB = 500; // We'll note that actual response is capped
    }
    if (sizeMB < 0.001) {
      sizeMB = 0.001;
    }

    const startTime = Date.now();
    const data = generateLargeResponse(sizeMB);
    const endTime = Date.now();

    return response(200, {
      ...data,
      generationTimeMs: endTime - startTime,
      timestamp: new Date().toISOString(),
    });
  }

  // GET /test/echo - Echo back request details
  if (path === '/test/echo' && (method === 'GET' || method === 'POST')) {
    return response(200, {
      method,
      path,
      query,
      body,
      timestamp: new Date().toISOString(),
    });
  }

  // GET /test/status/:code - Return specific status code
  const statusMatch = path.match(/^\/test\/status\/(\d+)$/);
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1], 10);
    const validCodes = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503, 504];

    if (!validCodes.includes(statusCode)) {
      return response(400, {
        error: 'Invalid status code',
        validCodes,
      });
    }

    return response(statusCode, {
      requestedStatus: statusCode,
      message: `Returned ${statusCode} as requested`,
      timestamp: new Date().toISOString(),
    });
  }

  // GET /test/timeout - Simulate timeout (wait longer than typical timeout)
  if (path === '/test/timeout' && method === 'GET') {
    const timeoutMs = parseInt(query.ms || '35000', 10); // Default 35s (longer than typical 30s timeout)
    await sleep(Math.min(timeoutMs, 120000)); // Cap at 2 minutes

    return response(200, {
      message: 'Did not timeout',
      waitedMs: timeoutMs,
      timestamp: new Date().toISOString(),
    });
  }

  return response(404, { error: 'Not Found', message: 'Test endpoint not found' });
};
