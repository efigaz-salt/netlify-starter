/**
 * Main Lambda Handler - Mock MuleSoft API
 * Routes requests to appropriate handlers based on path
 */

const users = require('./handlers/users');
const analytics = require('./handlers/analytics');
const features = require('./handlers/features');
const products = require('./handlers/products');
const test = require('./handlers/test');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key,X-Trace-ID',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Response helper
const response = (statusCode, body, additionalHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders,
    ...additionalHeaders,
  },
  body: JSON.stringify(body),
});

// Main handler
exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, pathParameters, queryStringParameters, body } = event;

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // Parse body if present
  let parsedBody = null;
  if (body) {
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      parsedBody = body;
    }
  }

  // Request context for handlers
  const requestContext = {
    method: httpMethod,
    path,
    pathParameters: pathParameters || {},
    query: queryStringParameters || {},
    body: parsedBody,
    headers: event.headers || {},
    requestId: context.awsRequestId,
  };

  try {
    // Route to appropriate handler
    if (path.startsWith('/users')) {
      return await users.handle(requestContext);
    }

    if (path.startsWith('/analytics')) {
      return await analytics.handle(requestContext);
    }

    if (path.startsWith('/features')) {
      return await features.handle(requestContext);
    }

    if (path.startsWith('/products')) {
      return await products.handle(requestContext);
    }

    if (path.startsWith('/test')) {
      return await test.handle(requestContext);
    }

    if (path === '/health') {
      return response(200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.ENVIRONMENT || 'development',
        requestId: context.awsRequestId,
      });
    }

    // 404 for unknown routes
    return response(404, {
      error: 'Not Found',
      message: `Route ${path} not found`,
      path,
    });

  } catch (error) {
    console.error('Error:', error);
    return response(500, {
      error: 'Internal Server Error',
      message: error.message,
      requestId: context.awsRequestId,
    });
  }
};
