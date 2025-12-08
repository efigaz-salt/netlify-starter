# Netlify Client Environment Simulation Project

## Overview
This project mimics the client's Netlify-served application environment based on their tech stack and architecture. The goal is to reproduce their environment locally and via Terraform/AWS for testing and development purposes.

## Client Environment Summary
- **Frontend**: Vue 3 / Nuxt 3 with Vite
- **Edge Functions**: Deno runtime (no bundler)
- **Third-Party Integrations (via GTM)**: Google Analytics, Google Tag Manager, Dynatrace RUM, Quantum Metrics
- **Streaming**: LaunchDarkly for feature flags
- **Edge Function Capabilities**: Security, API Routing, Redirects, Caching, GeoTargeting
- **API Proxy**: All MuleSoft API routes proxied through CDN (Netlify/Akamai)
- **Redirects**: Edge Functions read redirect data from Netlify Blobs
- **Deployment**: Branch-based (dev/staging/prod) via Netlify

---

## Implementation Status

### ✅ COMPLETED

#### Phase 1: Project Foundation
- [x] TypeScript configuration (tsconfig.json)
- [x] Package.json with dependencies (Nuxt 3, Vue 3, Tailwind, Chart.js)
- [x] Folder structure for edge functions, frontend, terraform, mocks, tests
- [x] Netlify CLI integration

#### Phase 2: Netlify Configuration
- [x] netlify.toml with build settings
- [x] Environment-specific variables (dev/staging/prod contexts)
- [x] Security headers (X-Frame-Options, XSS, CSP basics)
- [x] Basic redirects and rewrites
- [x] _redirects file for SPA fallback

#### Phase 3: Vue/Nuxt Frontend Application
- [x] Nuxt 3 + Vue 3 + Vite setup
- [x] Tailwind CSS integration with custom components
- [x] Layout component (header, navigation, footer)
- [x] Dashboard page (index.vue) with mock stats
- [x] Analytics page with tabbed interface
- [x] Features page with flag toggles
- [x] Settings page with environment config

#### Phase 4: Third-Party UI Mocks
- [x] Google Analytics dashboard mock (GoogleAnalytics.vue)
  - Sessions, bounce rate, traffic sources, goals
- [x] Google Tag Manager interface mock (GoogleTagManager.vue)
  - Container management, tags, triggers, variables, DataLayer viewer
- [x] Dynatrace RUM dashboard mock (DynatraceRUM.vue)
  - Performance metrics, user journey, error tracking
- [x] Feature Flag Manager (FeatureFlagManager.vue)
  - Percentage rollout, user targeting, geo rules

#### Phase 5: Chart Components
- [x] LineChart.vue (custom SVG)
- [x] DonutChart.vue (custom SVG)

---

### ❌ NOT IMPLEMENTED (Priority Order)

#### Priority 1: Edge Functions (Deno) - CRITICAL
Client's core architecture relies on Edge Functions for security, routing, caching, and geo-targeting.

**1.1 Security Edge Function** (`netlify/edge-functions/security.ts`) ✅ COMPLETE
- [x] CORS handling with configurable origins
- [x] Security headers injection (X-Frame-Options, HSTS, CSP, etc.)
- [x] Rate limiting (in-memory with sliding window)
- [x] Request logging/tracing (structured JSON logs)
- [x] API token injection for proxied /api/* requests
- [x] Client IP and geo-location tracking

**1.2 API Router Edge Function** (`netlify/edge-functions/api-router.ts`) ✅ COMPLETE
- [x] Route `/api/*` requests to AWS API Gateway backend
- [x] Request/response transformation with trace headers
- [x] Error handling with retries and exponential backoff
- [x] CORS preflight handling
- [x] Configurable timeout and retry settings

**1.3 Redirects Edge Function** (`netlify/edge-functions/redirects.ts`)
- [ ] **Read redirect rules from Netlify Blobs** (client requirement)
- [ ] Dynamic redirect logic
- [ ] GeoTargeting based on `request.headers.get('x-country')` or geo context
- [ ] A/B testing routing
- [ ] Path-based routing rules

**1.4 Caching Edge Function** (`netlify/edge-functions/caching.ts`)
- [ ] Cache headers for static assets
- [ ] Edge caching strategy
- [ ] Cache invalidation patterns
- [ ] Conditional caching based on request type

#### Priority 2: Netlify Blobs Integration
Client stores redirect data in blobs that Edge Functions read at runtime.

**2.1 Blob Store Setup**
- [ ] Configure Netlify Blobs in project
- [ ] Create redirect rules JSON structure
- [ ] Implement blob read in redirects edge function
- [ ] Admin UI for managing redirect rules (optional)

**2.2 Blob Data Structure**
```json
{
  "redirects": [
    { "from": "/old-path", "to": "/new-path", "status": 301 },
    { "from": "/geo/*", "to": "/{{geo.country}}/:splat", "conditions": { "geo": true } }
  ],
  "geoRules": [
    { "country": "US", "redirect": "/us-store" },
    { "country": "UK", "redirect": "/uk-store" }
  ]
}
```

#### Priority 3: Mock MuleSoft Backend (AWS API Gateway + Lambda) ✅ COMPLETE
Client proxies all internal MuleSoft API routes through Netlify Edge Functions.

**3.1 Terraform Infrastructure** (`terraform/`) ✅ COMPLETE
- [x] `main.tf` - AWS provider, local backend config
- [x] `api-gateway.tf` - REST API Gateway with CORS
- [x] `lambda.tf` - Single Lambda with multi-handler routing
- [x] `iam.tf` - IAM roles and policies
- [x] `variables.tf` - Configurable variables
- [x] `outputs.tf` - API Gateway URLs and endpoints
- [x] `modules/cors/` - Reusable CORS module

**3.2 Lambda Functions** (`terraform/lambdas/src/`) ✅ COMPLETE
- [x] `index.js` - Main router handler
- [x] `handlers/users.js` - Mock user management API (CRUD)
- [x] `handlers/analytics.js` - Mock analytics data API (sessions, events, realtime)
- [x] `handlers/features.js` - Mock LaunchDarkly-like feature flags API
- [x] `handlers/products.js` - Mock product catalog API

**3.3 API Gateway Routes** ✅ COMPLETE
```
GET    /health           - Health check
GET    /users            - List users (pagination, filters)
POST   /users            - Create user
GET    /users/:id        - Get user
PUT    /users/:id        - Update user
DELETE /users/:id        - Delete user
GET    /analytics        - Overview dashboard
GET    /analytics/*      - Sessions, pageviews, events, realtime, conversions
GET    /features/flags   - List feature flags
GET    /features/flags/:key - Get flag details
GET    /features/experiments - List A/B experiments
POST   /features/evaluate - Evaluate flags for user context
GET    /products         - List products (search, filters, pagination)
GET    /products/:id     - Get product with related
POST   /products/inventory/check - Check inventory
GET    /test/delay       - Configurable delay response (query: delay=<ms>)
GET    /test/large       - Large response generator (query: size=<MB>)
GET    /test/echo        - Echo request details
GET    /test/status/:code - Return specific HTTP status code
```

**3.4 API Gateway Deployment** ✅ COMPLETE
- Region: `eu-north-1`
- URL: `https://vysuq98i7c.execute-api.eu-north-1.amazonaws.com/v1`
- Tags: `CreatedBy=EfiG`, `Project=netlify-mock-api`, `ManagedBy=terraform`

**3.5 Test Endpoints** (`terraform/lambdas/src/handlers/test.js`) ✅ COMPLETE
- [x] `GET/POST /test/delay?delay=<ms>` - Configurable delay (up to 2 min)
- [x] `GET/POST /test/large?size=<MB>` - Large response generator
- [x] `GET/POST /test/echo` - Echo request details
- [x] `GET /test/status/:code` - Return specific HTTP status codes
- [x] `GET /test/timeout` - Timeout simulation

#### Priority 3.6: Vue UI API Integration ✅ COMPLETE
**Composables** (`composables/`)
- [x] `useApi.ts` - Base API composable with SSR-compatible `$fetch`
- [x] `useAnalytics.ts` - Dashboard stats, recent activity, analytics data
- [x] `useFeatures.ts` - Feature flags, experiments, toggle functionality

**Pages Updated**
- [x] `pages/index.vue` - Dashboard using real API data with auto-refresh
- [x] `pages/features.vue` - Feature flags from API with toggle support
- [x] `pages/test.vue` - API Test Console with delay/large response/echo/status tests

**Data Flow**
```
Vue UI → Edge Function (security) → Edge Function (api-router) → AWS API Gateway → Lambda
```

#### Priority 4: LaunchDarkly Streaming Simulation
Client uses LaunchDarkly with streaming for real-time feature flag updates.

**4.1 SSE Endpoint** (`netlify/edge-functions/ld-stream.ts` or Lambda)
- [ ] Server-Sent Events (SSE) endpoint
- [ ] Streaming feature flag updates
- [ ] Client SDK simulation
- [ ] Flag change events

**4.2 Frontend Integration**
- [ ] EventSource connection in Nuxt app
- [ ] Real-time flag updates in UI
- [ ] Reconnection handling

#### Priority 5: Mock Data Files
Populate mock directories with realistic test data.

**5.1 Google Analytics Mocks** (`mocks/google-analytics/`)
- [ ] `sessions.json` - Session data
- [ ] `events.json` - Event tracking data
- [ ] `pageviews.json` - Page view data
- [ ] `goals.json` - Conversion goals

**5.2 Google Tag Manager Mocks** (`mocks/google-tag-manager/`)
- [ ] `containers.json` - GTM container config
- [ ] `tags.json` - Tag definitions
- [ ] `triggers.json` - Trigger rules
- [ ] `variables.json` - Custom variables

**5.3 Dynatrace Mocks** (`mocks/dynatrace/`)
- [ ] `rum-data.json` - Real User Monitoring data
- [ ] `errors.json` - Error tracking
- [ ] `performance.json` - Performance metrics

**5.4 LaunchDarkly Mocks** (`mocks/launchdarkly/`)
- [ ] `flags.json` - Feature flag definitions
- [ ] `segments.json` - User segments
- [ ] `environments.json` - Environment configs

**5.5 Quantum Metrics Mocks** (`mocks/quantum-metrics/`)
- [ ] `sessions.json` - Session replay data
- [ ] `heatmaps.json` - Click/scroll heatmap data
- [ ] `journeys.json` - User journey data

#### Priority 6: Testing Framework
- [ ] Edge function unit tests (Deno test)
- [ ] Integration tests (Vitest)
- [ ] E2E tests for UI
- [ ] API mock tests

#### Priority 7: Advanced Features
- [ ] WebSocket simulation (if needed for real-time features)
- [ ] Multi-region deployment simulation
- [ ] CDN caching simulation (Akamai-like behavior)

---

## File Structure (Updated)

```
netlify-client-env/
├── netlify.toml                    # ✅ Exists
├── package.json                    # ✅ Exists
├── tsconfig.json                   # ✅ Exists
├── _redirects                      # ✅ Exists
├── .env                            # ✅ Environment variables (API_GATEWAY_URL, etc.)
├── plan.md                         # ✅ This file
│
├── netlify/
│   ├── edge-functions/             # ✅ Implemented
│   │   ├── security.ts             # ✅ CORS, headers, rate limiting, logging
│   │   ├── api-router.ts           # ✅ Route to AWS API Gateway
│   │   ├── redirects.ts            # ❌ Dynamic redirects from blobs
│   │   ├── caching.ts              # ❌ Cache optimization
│   │   └── ld-stream.ts            # ❌ LaunchDarkly streaming (SSE)
│   │
│   └── functions/                  # ❌ Empty - optional serverless functions
│       └── ...
│
├── composables/                    # ✅ API Integration Layer
│   ├── useApi.ts                   # ✅ Base API composable ($fetch, helpers)
│   ├── useAnalytics.ts             # ✅ Dashboard stats, activity, analytics
│   └── useFeatures.ts              # ✅ Feature flags, experiments, toggle
│
├── pages/                          # ✅ Complete (with real API data)
│   ├── index.vue                   # ✅ Dashboard with live stats
│   ├── analytics.vue               # ✅ Analytics tabs
│   ├── features.vue                # ✅ Feature flags from API
│   ├── test.vue                    # ✅ API Test Console (delay, large, echo, status)
│   └── settings.vue                # ✅ Settings
│
├── components/                     # ✅ Complete
│   ├── analytics/
│   ├── monitoring/
│   ├── features/
│   └── charts/
│
├── layouts/                        # ✅ Complete
│   └── default.vue
│
├── assets/css/                     # ✅ Complete
│   └── main.css
│
├── terraform/                      # ✅ Complete - Deployed to AWS
│   ├── main.tf                     # ✅ AWS provider (eu-north-1), tags
│   ├── api-gateway.tf              # ✅ REST API Gateway with CORS
│   ├── lambda.tf                   # ✅ Lambda function
│   ├── iam.tf                      # ✅ IAM roles/policies
│   ├── variables.tf                # ✅ Input variables
│   ├── outputs.tf                  # ✅ Output values
│   ├── terraform.tfvars            # ✅ Configuration
│   ├── modules/cors/               # ✅ CORS module
│   └── lambdas/
│       └── src/
│           ├── index.js            # ✅ Main router
│           └── handlers/
│               ├── users.js        # ✅ User CRUD API
│               ├── analytics.js    # ✅ Analytics API
│               ├── features.js     # ✅ Feature flags + experiments
│               ├── products.js     # ✅ Products API
│               └── test.js         # ✅ Test endpoints (delay, large, echo, status)
│
├── mocks/                          # ❌ Empty directories - needs data
│   ├── google-analytics/
│   ├── google-tag-manager/
│   ├── dynatrace/
│   ├── launchdarkly/
│   └── quantum-metrics/
│
└── tests/                          # ❌ Empty - needs tests
    ├── edge-functions/
    └── integration/
```

---

## Implementation Phases

### ✅ Phase A: Edge Functions - COMPLETE
1. ✅ Implement `security.ts` with CORS, headers, rate limiting
2. ✅ Implement `api-router.ts` with AWS API Gateway routing
3. ✅ Enable edge functions in netlify.toml
4. ✅ Test locally with `netlify dev`

### ✅ Phase B: Terraform Backend - COMPLETE
1. ✅ Set up Terraform project structure
2. ✅ Create API Gateway with CORS
3. ✅ Create Lambda functions (users, analytics, features, products)
4. ✅ Deploy to AWS (eu-north-1)
5. ✅ Update edge functions to route to AWS

### ✅ Phase B.5: Vue UI Integration - COMPLETE
1. ✅ Create composables for API integration
2. ✅ Update Dashboard with real analytics data
3. ✅ Update Features page with real flag data
4. ✅ Add loading/error states

### ❌ Phase C: Blobs & Dynamic Redirects (Remaining)
1. Configure Netlify Blobs
2. Create redirect rules in blob store
3. Implement `redirects.ts` edge function
4. Implement geo-targeting logic
5. Test dynamic redirects

### ❌ Phase D: LaunchDarkly Streaming (Remaining)
1. Implement SSE endpoint
2. Create mock flag stream
3. Integrate with frontend EventSource
4. Test real-time updates

### ❌ Phase E: Mock Data & Testing (Remaining)
1. Populate all mock data directories
2. Write edge function tests
3. Write integration tests
4. E2E test coverage

---

## Technology Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Vue 3 + Nuxt 3 + Vite | ✅ Complete |
| Styling | Tailwind CSS | ✅ Complete |
| API Integration | Nuxt Composables ($fetch) | ✅ Complete |
| Edge Functions | Deno (Netlify Edge) | ✅ security.ts, api-router.ts |
| Backend Mock | AWS API Gateway + Lambda | ✅ Complete (eu-north-1) |
| Infrastructure | Terraform | ✅ Complete |
| Blob Storage | Netlify Blobs | ❌ Not implemented |
| Streaming | SSE (LaunchDarkly mock) | ❌ Not implemented |
| Testing | Deno Test + Vitest | ❌ Not implemented |
| Deployment | Netlify (branch-based) | ✅ Configured |

---

## Quick Start Commands

```bash
# Development
npm run dev              # Start Netlify dev server (http://localhost:8888)

# Build
npm run build            # Build for production

# Testing (once implemented)
npm run test             # Run edge function tests
npm run test:integration # Run integration tests

# Terraform
cd terraform
AWS_PROFILE=SA terraform init
AWS_PROFILE=SA terraform plan
AWS_PROFILE=SA terraform apply

# Test API endpoints
curl http://localhost:8888/api/health
curl http://localhost:8888/api/analytics
curl http://localhost:8888/api/features/flags
curl http://localhost:8888/api/features/experiments
```

---

## Notes

1. **Client uses Blobs for redirects** - This is critical. Edge Functions must read from Netlify Blobs, not hardcoded rules.

2. **No WebSockets** - Client confirmed they don't use WebSockets. Real-time is via LaunchDarkly streaming (SSE).

3. **API Proxy Pattern** - All MuleSoft APIs go through Netlify Edge Functions. This is for security (hiding API tokens) and routing.

4. **GTM-managed integrations** - GA, Dynatrace, Quantum Metrics are all managed via GTM, not direct SDK integration.

5. **Branch-based deploys** - Each branch (dev/staging/prod) has its own environment variables in Netlify.

6. **Netlify Deployment** - Site deployed at `https://efi-test1-ts.netlify.app`
   - GitHub repo: `github.com/efigaz-salt/netlify-ts`
   - Auto-deploys on push to master

---

## AWS/API Gateway Limits (Discovered)

| Resource | Limit | Notes |
|----------|-------|-------|
| API Gateway REST API Timeout | **29 seconds** | Hard limit, cannot be configured higher |
| Lambda Sync Response | **6 MB** | Requests >5.5MB may fail |
| Lambda Timeout | 130 seconds | Configured in terraform.tfvars |
| API Gateway HTTP API Timeout | 30 seconds | Alternative (not used) |

**Workarounds for longer operations:**
- Lambda Function URLs (bypass API Gateway, up to 15 min)
- WebSocket API (connection-based, no request timeout)
- Async pattern (return task ID, poll for result)
- ALB (configurable up to 4000 seconds)
