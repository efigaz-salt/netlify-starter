/**
 * SSE (Server-Sent Events) Streaming Handler
 * Uses Lambda Response Streaming via Function URL
 */

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// SSE event formatter
const formatSSE = (event, data, id = null) => {
  let message = '';
  if (id) message += `id: ${id}\n`;
  message += `event: ${event}\n`;
  message += `data: ${JSON.stringify(data)}\n\n`;
  return message;
};

/**
 * Streaming handler for SSE
 * This uses the awslambda.streamifyResponse wrapper
 */
exports.handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};
  const eventCount = Math.min(parseInt(queryParams.count || '10', 10), 100);
  const intervalMs = Math.min(parseInt(queryParams.interval || '1000', 10), 5000);
  const eventType = queryParams.type || 'message';

  // Set SSE content type
  const metadata = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  };

  // Create HTTP response stream with metadata
  responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

  try {
    // Send initial connection event
    responseStream.write(formatSSE('connected', {
      message: 'SSE connection established',
      totalEvents: eventCount,
      intervalMs: intervalMs,
      timestamp: new Date().toISOString(),
    }, 0));

    // Stream events
    for (let i = 1; i <= eventCount; i++) {
      await sleep(intervalMs);

      const eventData = generateEventData(eventType, i, eventCount);
      responseStream.write(formatSSE(eventType, eventData, i));
    }

    // Send completion event
    responseStream.write(formatSSE('complete', {
      message: 'Stream completed',
      totalSent: eventCount,
      timestamp: new Date().toISOString(),
    }, eventCount + 1));

  } catch (error) {
    responseStream.write(formatSSE('error', {
      message: error.message,
      timestamp: new Date().toISOString(),
    }));
  } finally {
    responseStream.end();
  }
});

/**
 * Generate event data based on type
 */
function generateEventData(type, index, total) {
  const timestamp = new Date().toISOString();
  const progress = Math.round((index / total) * 100);

  switch (type) {
    case 'counter':
      return {
        count: index,
        total: total,
        progress: progress,
        timestamp,
      };

    case 'stock':
      return {
        symbol: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'][index % 5],
        price: (100 + Math.random() * 50).toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
        timestamp,
      };

    case 'notification':
      const notifications = [
        'New user signed up',
        'Order completed',
        'Payment received',
        'Item shipped',
        'Review submitted',
        'Support ticket created',
        'Feature flag updated',
        'Deployment completed',
      ];
      return {
        id: `notif-${index}`,
        message: notifications[index % notifications.length],
        priority: ['low', 'medium', 'high'][index % 3],
        timestamp,
      };

    case 'metrics':
      return {
        cpu: (20 + Math.random() * 60).toFixed(1),
        memory: (40 + Math.random() * 40).toFixed(1),
        requests: Math.floor(100 + Math.random() * 500),
        latency: Math.floor(10 + Math.random() * 100),
        timestamp,
      };

    case 'message':
    default:
      return {
        index: index,
        total: total,
        progress: progress,
        message: `Event ${index} of ${total}`,
        timestamp,
      };
  }
}
