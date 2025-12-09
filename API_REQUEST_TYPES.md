# API Request Types - Implementation Summary

This document provides a comprehensive overview of all request types implemented in the Netlify Client Environment Simulation Project.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Request Types](#request-types)
- [Request Flow](#request-flow)
- [Key Differentiators](#key-differentiators)

---

## Architecture Overview

All requests flow through Netlify Edge Functions before reaching the backend:

```
Client (Vue/Nuxt App)
    ↓
Netlify Edge Functions (Deno)
    ├─ security.ts (CORS, headers, rate limiting, logging)
    └─ api-router.ts (routing, retries, error handling)
        ↓
    ┌───┴────┐
    ↓        ↓
API Gateway  Lambda Function URL
(REST)       (SSE Streaming)
    ↓
Lambda Handlers (Node.js 20)
```

**Deployed Infrastructure:**
- **AWS Region**: `eu-north-1`
- **API Gateway URL**: `https://vysuq98i7c.execute-api.eu-north-1.amazonaws.com/v1`
- **Netlify Site**: `https://efi-test1-ts.netlify.app`

---

## Request Types

### 1. Standard REST API (via API Gateway)

**Route Flow**: `Edge Function (security) → Edge Function (api-router) → AWS API Gateway → Lambda`

#### Business APIs

**Health Check**
```http
GET /api/health
```
Returns service health status, version, environment, and request ID.

**Users API**
```http
GET    /api/users              # List users (pagination, filters)
POST   /api/users              # Create user
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user
```
Full CRUD operations for user management.

**Analytics API**
```http
GET /api/analytics             # Overview dashboard
GET /api/analytics/sessions    # Session data
GET /api/analytics/pageviews   # Pageview tracking
GET /api/analytics/events      # Event tracking
GET /api/analytics/realtime    # Real-time metrics
GET /api/analytics/conversions # Conversion goals
```
Mock analytics data similar to Google Analytics.

**Features API**
```http
GET  /api/features/flags              # List feature flags
GET  /api/features/flags/:key         # Get flag details
GET  /api/features/experiments        # List A/B experiments
POST /api/features/evaluate           # Evaluate flags for user context
```
Mock LaunchDarkly-style feature flag management.

**Products API**
```http
GET  /api/products                    # List products (search, filters, pagination)
GET  /api/products/:id                # Get product with related items
POST /api/products/inventory/check   # Check inventory levels
```
Mock product catalog and inventory system.

---

### 2. REST with Configurable Delay

**Route Flow**: Same as Standard REST → `handlers/test.js`

```http
GET  /api/test/delay?delay=<milliseconds>
POST /api/test/delay
```

**Parameters:**
- `delay`: Delay in milliseconds (0 - 120000)

**Response:**
```json
{
  "success": true,
  "message": "Delayed response completed",
  "requestedDelayMs": 5000,
  "actualDelayMs": 5003,
  "startTime": "2025-12-09T10:30:00.000Z",
  "endTime": "2025-12-09T10:30:05.003Z",
  "timestamp": "2025-12-09T10:30:05.003Z"
}
```

**Limits:**
- Maximum delay: 120 seconds (2 minutes)
- Lambda timeout: 130 seconds (configured)

**Use Cases:**
- Testing timeout handling in clients
- Testing loading states and spinners
- Simulating slow network conditions
- Testing API Gateway timeout (29s limit)

---

### 3. REST with Large Response

**Route Flow**: Same as Standard REST → `handlers/test.js`

```http
GET  /api/test/large?size=<MB>
POST /api/test/large
```

**Parameters:**
- `size`: Response size in megabytes (0.001 - 500)

**Response:**
```json
{
  "requestedSizeMB": 2.5,
  "actualSizeMB": 2.48,
  "itemCount": 26214,
  "note": null,
  "items": [
    {
      "id": 0,
      "uuid": "550e8400-e29b-41d4-a716-000000000000",
      "data": "Lorem ipsum dolor sit amet consectetur adipiscing",
      "timestamp": "2025-12-09T10:30:00.000Z"
    }
  ],
  "generationTimeMs": 245,
  "timestamp": "2025-12-09T10:30:00.245Z"
}
```

**Limits:**
- Lambda response limit: ~6 MB (hard limit)
- Actual response capped at: 5.5 MB
- Returns note if requested size exceeds limit

**Use Cases:**
- Testing pagination strategies
- Testing memory usage and performance
- Testing network bandwidth handling
- Stress testing client-side JSON parsing

---

### 4. REST Echo (Request Inspector)

**Route Flow**: Same as Standard REST → `handlers/test.js`

```http
GET  /api/test/echo
POST /api/test/echo
```

**Response:**
```json
{
  "method": "POST",
  "path": "/test/echo",
  "query": {
    "foo": "bar"
  },
  "body": {
    "userId": 123,
    "action": "test"
  },
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

**Use Cases:**
- Debugging request payloads
- Verifying header transformations
- Testing request/response transformation in edge functions
- Development and troubleshooting

---

### 5. REST Status Code Generator

**Route Flow**: Same as Standard REST → `handlers/test.js`

```http
GET /api/test/status/:code
```

**Supported Status Codes:**
- Success: `200`, `201`, `204`
- Client Errors: `400`, `401`, `403`, `404`
- Server Errors: `500`, `502`, `503`, `504`

**Example:**
```http
GET /api/test/status/404
```

**Response:**
```json
{
  "requestedStatus": 404,
  "message": "Returned 404 as requested",
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

**Use Cases:**
- Testing error handling for different status codes
- Testing error UI states
- Testing retry logic
- QA and integration testing

---

### 6. REST Timeout Simulator

**Route Flow**: Same as Standard REST → `handlers/test.js`

```http
GET /api/test/timeout?ms=<milliseconds>
```

**Parameters:**
- `ms`: Wait time in milliseconds (default: 35000)

**Limits:**
- Default: 35 seconds (exceeds API Gateway's 29s timeout)
- Maximum: 120 seconds

**Response** (if doesn't timeout):
```json
{
  "message": "Did not timeout",
  "waitedMs": 35000,
  "timestamp": "2025-12-09T10:30:35.000Z"
}
```

**Use Cases:**
- Testing API Gateway timeout limits (29s hard limit)
- Testing client-side timeout handling
- Verifying retry mechanisms
- Testing Lambda Function URL bypass (no timeout limit)

**Important Notes:**
- Requests via API Gateway will timeout at 29 seconds
- Lambda itself has 130-second timeout configured
- Use SSE endpoint for truly long-running operations

---

### 7. Server-Sent Events (SSE) Streaming

**Route Flow**: `Edge Function (security) → Edge Function (api-router) → Lambda Function URL (RESPONSE_STREAM)`

```http
GET /api/sse?type=<type>&count=<count>&interval=<ms>
```

**Parameters:**
- `type`: Event type (`message`, `counter`, `stock`, `notification`, `metrics`)
- `count`: Number of events to send (1-100, default: 10)
- `interval`: Interval between events in ms (100-5000, default: 1000)

**Event Types:**

**1. Message Event**
```
event: message
id: 1
data: {"index":1,"total":10,"progress":10,"message":"Event 1 of 10","timestamp":"2025-12-09T10:30:00.000Z"}
```

**2. Counter Event**
```
event: counter
id: 2
data: {"count":2,"total":10,"progress":20,"timestamp":"2025-12-09T10:30:01.000Z"}
```

**3. Stock Event**
```
event: stock
id: 3
data: {"symbol":"AAPL","price":"142.35","change":"-2.15","timestamp":"2025-12-09T10:30:02.000Z"}
```

**4. Notification Event**
```
event: notification
id: 4
data: {"id":"notif-4","message":"Order completed","priority":"high","timestamp":"2025-12-09T10:30:03.000Z"}
```

**5. Metrics Event**
```
event: metrics
id: 5
data: {"cpu":"45.2","memory":"62.8","requests":327,"latency":45,"timestamp":"2025-12-09T10:30:04.000Z"}
```

**Connection Lifecycle:**

1. **Connected Event** (on connection establishment)
```
event: connected
id: 0
data: {"message":"SSE connection established","totalEvents":10,"intervalMs":1000,"timestamp":"2025-12-09T10:30:00.000Z"}
```

2. **Data Events** (sent at specified interval)

3. **Complete Event** (after all events sent)
```
event: complete
id: 11
data: {"message":"Stream completed","totalSent":10,"timestamp":"2025-12-09T10:30:10.000Z"}
```

**Client-Side Implementation:**
```javascript
const eventSource = new EventSource('/api/sse?type=stock&count=20&interval=500');

eventSource.addEventListener('stock', (e) => {
  const data = JSON.parse(e.data);
  console.log('Stock update:', data);
});

eventSource.addEventListener('complete', (e) => {
  eventSource.close();
});

eventSource.onerror = () => {
  console.error('Connection error');
  eventSource.close();
};
```

**Key Features:**
- Bypasses API Gateway 29s timeout using Lambda Function URL
- Response streaming enabled (`RESPONSE_STREAM` mode)
- Long-lived connections
- No timeout limits
- Real-time event delivery

**Use Cases:**
- Real-time dashboards
- Live metric updates
- Stock price streaming
- Notification feeds
- LaunchDarkly feature flag streaming simulation

**Technical Notes:**
- Uses Lambda Response Streaming via Function URL
- Direct Lambda invocation (no API Gateway)
- Content-Type: `text/event-stream`
- Cache-Control: `no-cache`
- Connection: `keep-alive`

---

### 8. Edge Function Processing

All `/api/*` requests pass through two edge functions before reaching the backend:

#### Security Edge Function (`netlify/edge-functions/security.ts`)

**Responsibilities:**
- CORS handling with configurable origins
- Security headers injection:
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
- Rate limiting (in-memory sliding window)
  - Default: 100 requests per 60 seconds per IP
  - Configurable via environment variables
- Request logging and tracing
  - Generates unique trace IDs
  - Structured JSON logging
- Client IP tracking
- Geo-location information extraction

**Path Coverage:**
- Applies to: `/*`
- Excludes: `/_nuxt/*`, `/__nuxt/*`, `/favicon.ico`

#### API Router Edge Function (`netlify/edge-functions/api-router.ts`)

**Responsibilities:**
- Routes `/api/*` requests to appropriate backend:
  - `/api/sse` → Lambda Function URL (streaming)
  - All other `/api/*` → API Gateway (REST)
- Request transformation:
  - Adds trace headers
  - Injects API tokens (for security)
  - Forwards client IP and geo headers
- Error handling:
  - Retry logic with exponential backoff
  - Circuit breaker pattern
  - Graceful degradation
- Response transformation
- CORS preflight handling
- Timeout configuration

**Configuration:**
- API Gateway URL: Set via `API_GATEWAY_URL` environment variable
- SSE Function URL: Set via `SSE_FUNCTION_URL` environment variable
- Retry attempts: 3
- Timeout: Configurable per endpoint

**Path Coverage:**
- Applies to: `/api/*`

---

## Request Flow

### Standard REST Request Flow

```
┌─────────────────────────────────────────────────────┐
│ Client (Browser/Vue App)                            │
│  - Nuxt 3 composables (useApi, useAnalytics, etc.) │
└────────────────┬────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS Request
                 ▼
┌─────────────────────────────────────────────────────┐
│ Netlify Edge Network (Global CDN)                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Edge Function 1: security.ts                        │
│  ✓ Validate CORS                                    │
│  ✓ Check rate limits                                │
│  ✓ Inject security headers                          │
│  ✓ Generate trace ID                                │
│  ✓ Log request                                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Edge Function 2: api-router.ts                      │
│  ✓ Route determination                              │
│  ✓ Add trace headers                                │
│  ✓ Transform request                                │
│  ✓ Add retry logic                                  │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐   ┌──────────────────────┐
│ API Gateway  │   │ Lambda Function URL  │
│ (REST APIs)  │   │ (SSE Streaming)      │
│              │   │                      │
│ Timeout: 29s │   │ Timeout: None        │
│ Limit: 6 MB  │   │ Limit: Streaming     │
└──────┬───────┘   └──────┬───────────────┘
       │                   │
       ▼                   ▼
┌──────────────────────────────────────────┐
│ AWS Lambda (Node.js 20)                  │
│  ┌────────────────────────────────────┐  │
│  │ index.js (Main Router)             │  │
│  └────────┬───────────────────────────┘  │
│           │                               │
│  ┌────────┴───────────────────────────┐  │
│  │ handlers/                          │  │
│  │  ├─ users.js                       │  │
│  │  ├─ analytics.js                   │  │
│  │  ├─ features.js                    │  │
│  │  ├─ products.js                    │  │
│  │  ├─ test.js (delay, large, echo)   │  │
│  │  └─ sse.js (streaming)             │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### SSE Streaming Request Flow

```
Client EventSource Connection
    ↓
Netlify Edge Functions
    ├─ security.ts (CORS, headers)
    └─ api-router.ts (routes to Function URL)
        ↓
Lambda Function URL (RESPONSE_STREAM)
    ↓
handlers/sse.js
    ├─ Open streaming connection
    ├─ Send: event: connected
    ├─ Loop: Send events at interval
    └─ Send: event: complete
        ↓
Client receives real-time events
```

---

## Key Differentiators

### Comparison Table

| Type | Timeout | Response Size | Connection | Use Case |
|------|---------|---------------|------------|----------|
| **REST (API Gateway)** | 29s (hard limit) | 6 MB max | Request/Response | Standard CRUD operations |
| **SSE (Function URL)** | None | Unlimited streaming | Long-lived | Real-time updates |
| **Test Delay** | Up to 120s | Normal JSON | Request/Response | Timeout testing |
| **Test Large** | 29s | Up to 5.5 MB | Request/Response | Large payload testing |
| **Test Echo** | 29s | Small JSON | Request/Response | Debugging |
| **Test Status** | 29s | Small JSON | Request/Response | Error handling testing |
| **Test Timeout** | Exceeds 29s | N/A (times out) | Request/Response | Timeout limit testing |

### Technical Limits

#### API Gateway (REST APIs)
- **Hard timeout**: 29 seconds (cannot be configured higher)
- **Response size**: 6 MB maximum (5.5 MB recommended)
- **Request size**: 10 MB maximum
- **Integration timeout**: 29 seconds to Lambda

#### Lambda (Both REST and SSE)
- **Configured timeout**: 130 seconds (REST Lambda)
- **SSE timeout**: 120 seconds (configurable, can be higher)
- **Memory**: 256 MB (SSE), 512 MB (REST)
- **Runtime**: Node.js 20

#### Lambda Function URL (SSE)
- **Timeout**: No hard limit (connection-based)
- **Response size**: Unlimited (streaming)
- **Streaming**: Enabled via `RESPONSE_STREAM` invoke mode

#### Edge Functions
- **Timeout**: 50 seconds maximum
- **Memory**: 128 MB
- **Runtime**: Deno
- **Regions**: Global (runs at edge locations)

---

## Environment Configuration

### Required Environment Variables

Set in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# API Backend
API_GATEWAY_URL=https://vysuq98i7c.execute-api.eu-north-1.amazonaws.com/v1
SSE_FUNCTION_URL=https://<function-url>.lambda-url.eu-north-1.on.aws/

# Security
ALLOWED_ORIGINS=http://localhost:8888,https://efi-test1-ts.netlify.app

# Rate Limiting
RATE_LIMIT_WINDOW=60000        # 60 seconds
RATE_LIMIT_MAX=100             # 100 requests per window
```

---

## Testing Examples

### cURL Examples

**Standard REST**
```bash
curl https://efi-test1-ts.netlify.app/api/health
```

**Delayed Response (5 seconds)**
```bash
curl "https://efi-test1-ts.netlify.app/api/test/delay?delay=5000"
```

**Large Response (2 MB)**
```bash
curl "https://efi-test1-ts.netlify.app/api/test/large?size=2"
```

**Echo Request**
```bash
curl -X POST https://efi-test1-ts.netlify.app/api/test/echo \
  -H "Content-Type: application/json" \
  -d '{"userId":123,"action":"test"}'
```

**Status Code Test**
```bash
curl https://efi-test1-ts.netlify.app/api/test/status/404
```

**SSE Streaming**
```bash
curl -N "https://efi-test1-ts.netlify.app/api/sse?type=stock&count=5&interval=1000"
```

### JavaScript Examples

**Fetch with Delay**
```javascript
const response = await fetch('/api/test/delay?delay=3000');
const data = await response.json();
console.log(`Delayed by ${data.actualDelayMs}ms`);
```

**SSE Connection**
```javascript
const es = new EventSource('/api/sse?type=metrics&count=10&interval=500');

es.addEventListener('metrics', (e) => {
  const metrics = JSON.parse(e.data);
  updateDashboard(metrics);
});

es.addEventListener('complete', () => {
  es.close();
});
```

---

## Vue/Nuxt Integration

The project uses composables for API integration:

### useApi Composable
```javascript
// composables/useApi.ts
const { data, error, loading } = await useApi('/api/analytics');
```

### useAnalytics Composable
```javascript
// composables/useAnalytics.ts
const { dashboardStats, recentActivity } = useAnalytics();
```

### Pages Using APIs

- **Dashboard** (`pages/index.vue`) - Real-time analytics with auto-refresh
- **Features** (`pages/features.vue`) - Feature flags with toggle support
- **Test Console** (`pages/test.vue`) - API testing interface
- **SSE Demo** (`pages/sse.vue`) - Live SSE streaming visualization

---

## Summary

This project implements **8 distinct request types** covering:
- ✅ Standard REST CRUD operations
- ✅ Configurable delay testing
- ✅ Large payload testing
- ✅ Request debugging (echo)
- ✅ Status code testing
- ✅ Timeout simulation
- ✅ Real-time SSE streaming
- ✅ Edge function security and routing

All requests flow through Netlify Edge Functions for security, rate limiting, and intelligent routing before reaching AWS Lambda backends.

The architecture supports both synchronous REST operations (via API Gateway) and asynchronous streaming operations (via Lambda Function URLs), providing comprehensive testing capabilities for modern web applications.
