# WebSocket Implementation on Netlify Edge Functions

## Overview

This project implements WebSocket support using Netlify Edge Functions with Deno's native WebSocket API. The implementation creates a bidirectional proxy between the client and backend WebSocket server.

## Architecture

```
Client Browser
    ↓ (WebSocket Upgrade: ws://yoursite.com/api/ws)
Netlify Edge Function (websocket-proxy.ts)
    ↓ (WebSocket Connection: wss://akamaitest.salt-cng-team-test.org/ws)
Backend WebSocket Server
```

## How It Works

### 1. Client Connection
The client initiates a WebSocket connection to `/api/ws`:

```javascript
const wsUrl = `${protocol}//${window.location.host}/api/ws`
websocket = new WebSocket(wsUrl)
```

### 2. Edge Function Upgrade
The edge function receives the WebSocket upgrade request and:
- Validates the `upgrade: websocket` header
- Calls `Deno.upgradeWebSocket(request)` to accept the client connection
- Immediately opens a connection to the backend WebSocket server

### 3. Bidirectional Proxying
The edge function sets up event handlers to:
- **Client → Backend**: Forward all messages from client to backend
- **Backend → Client**: Forward all messages from backend to client
- Handle connection close and errors on both sides

### 4. Logging
All WebSocket events are logged with trace IDs:
- `websocket_upgrade`: Initial connection request
- `websocket_client_connected`: Client successfully connected
- `websocket_backend_connected`: Backend successfully connected
- `websocket_client_to_backend`: Message forwarded client → backend
- `websocket_backend_to_client`: Message forwarded backend → client
- `websocket_client_closed`: Client disconnected
- `websocket_backend_closed`: Backend disconnected
- `websocket_client_error` / `websocket_backend_error`: Error events

## Key Implementation Details

### Using Deno.upgradeWebSocket()
This is the critical API that allows Edge Functions to handle WebSocket connections:

```typescript
const { socket: clientSocket, response } = Deno.upgradeWebSocket(request);
```

Returns:
- `socket`: WebSocket instance for the client connection
- `response`: HTTP response with status 101 (Switching Protocols)

### Message Forwarding Pattern
```typescript
clientSocket.onmessage = (event) => {
  if (backendSocket.readyState === WebSocket.OPEN) {
    backendSocket.send(event.data);
  }
};

backendSocket.onmessage = (event) => {
  if (clientSocket.readyState === WebSocket.OPEN) {
    clientSocket.send(event.data);
  }
};
```

### Connection Cleanup
When either side closes:
```typescript
clientSocket.onclose = () => {
  if (backendSocket.readyState === WebSocket.OPEN) {
    backendSocket.close();
  }
};

backendSocket.onclose = () => {
  if (clientSocket.readyState === WebSocket.OPEN) {
    clientSocket.close();
  }
};
```

## Configuration

### netlify.toml
The WebSocket proxy runs on `/api/ws` and is excluded from other edge functions:

```toml
# Security edge function - excludes /api/ws
[[edge_functions]]
  function = "security"
  path = "/*"
  excludedPath = ["/_nuxt/*", "/__nuxt/*", "/favicon.ico", "/api/ws"]

# Salt collector - excludes /api/ws (can't collect WebSocket as HTTP)
[[edge_functions]]
  function = "salt-collector"
  path = "/api/*"
  excludedPath = ["/api/ws"]

# API router - excludes /api/ws (handled by websocket-proxy instead)
[[edge_functions]]
  function = "api-router"
  path = "/api/*"
  excludedPath = ["/api/ws"]

# WebSocket proxy - only handles /api/ws
[[edge_functions]]
  function = "websocket-proxy"
  path = "/api/ws"
```

This ensures `/api/ws` is **only** processed by the WebSocket proxy, bypassing security, salt-collector, and api-router edge functions.

### Backend URL
Currently hardcoded in `websocket-proxy.ts`:
```typescript
const BACKEND_WS_URL = "wss://akamaitest.salt-cng-team-test.org/ws";
```

For production, consider making this configurable via environment variables:
```typescript
const BACKEND_WS_URL = Deno.env.get("WEBSOCKET_BACKEND_URL") ||
  "wss://akamaitest.salt-cng-team-test.org/ws";
```

## Limitations

### 1. Salt Collector Cannot Capture WebSocket Traffic
WebSocket traffic **does not** flow through the `salt-collector` edge function because:
- WebSocket uses protocol upgrade (HTTP → WebSocket)
- Salt collector is designed for HTTP request/response pairs
- WebSocket maintains persistent bidirectional connection

### 2. Edge Function Execution Limits
Netlify Edge Functions have:
- Maximum execution time limits
- Memory constraints
- May not be suitable for very long-lived connections (hours)

For production WebSocket with high requirements, consider:
- Third-party services (Ably, Pusher, Socket.io)
- Dedicated WebSocket infrastructure
- AWS API Gateway WebSocket APIs

### 3. Message Size Limits
Large WebSocket messages may hit Edge Function limits. Monitor and test with your expected payload sizes.

## Testing

### From Browser Console
```javascript
const ws = new WebSocket('wss://your-site.netlify.app/api/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Received:', e.data);
ws.send('ping');
```

### From UI
Use the Akamai Test page at `/akamai-test`:
1. Click "Connect" in the WebSocket section
2. Send messages or ping
3. See bidirectional communication
4. Click "Disconnect" to close

## Monitoring

Check Netlify Function logs for WebSocket events:
```bash
netlify logs:function websocket-proxy
```

Look for:
- Connection establishment
- Message forwarding counts
- Error patterns
- Connection duration

## Alternatives to Edge Function WebSocket Proxy

### 1. Direct Connection (Current akamai-test.vue approach)
```javascript
// Bypass edge functions entirely
const wsUrl = 'wss://akamaitest.salt-cng-team-test.org/ws'
websocket = new WebSocket(wsUrl)
```

**Pros**: Simple, no proxy overhead
**Cons**: No logging, no traffic visibility

### 2. Third-Party Services
- **Ably**: Managed WebSocket/SSE service
- **Pusher**: Real-time messaging platform
- **Socket.io**: WebSocket library with fallbacks

**Pros**: Production-ready, scalable, reliable
**Cons**: Additional cost, external dependency

### 3. AWS API Gateway WebSocket APIs
**Pros**: Native AWS integration, serverless
**Cons**: More complex setup, AWS-specific

## References

- [Netlify Edge Functions API Docs](https://docs.netlify.com/edge-functions/api/)
- [Deno WebSocket API](https://docs.deno.com/api/web/websocket/)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
