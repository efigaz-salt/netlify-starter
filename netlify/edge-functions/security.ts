/// <reference types="@netlify/edge-functions" />

import type { Context } from "@netlify/edge-functions";

// ============================================================================
// Configuration
// ============================================================================

interface SecurityConfig {
  allowedOrigins: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
  apiTokenHeader: string;
  excludePaths: string[];
}

const getConfig = (): SecurityConfig => {
  const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS") || "";

  return {
    allowedOrigins: allowedOriginsEnv
      ? allowedOriginsEnv.split(",").map((o) => o.trim())
      : ["http://localhost:3000", "http://localhost:8888"],
    rateLimitWindow: parseInt(Deno.env.get("RATE_LIMIT_WINDOW") || "60000", 10),
    rateLimitMax: parseInt(Deno.env.get("RATE_LIMIT_MAX") || "100", 10),
    apiTokenHeader: "X-API-Key",
    excludePaths: ["/_nuxt/", "/favicon.ico", "/__nuxt"],
  };
};

// ============================================================================
// Rate Limiting (In-Memory Store)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
  clientIP: string,
  config: SecurityConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [ip, data] of rateLimitStore.entries()) {
      if (data.resetAt < now) {
        rateLimitStore.delete(ip);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.rateLimitWindow,
    };
    rateLimitStore.set(clientIP, newEntry);
    return {
      allowed: true,
      remaining: config.rateLimitMax - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Existing window
  entry.count++;
  const allowed = entry.count <= config.rateLimitMax;
  return {
    allowed,
    remaining: Math.max(0, config.rateLimitMax - entry.count),
    resetAt: entry.resetAt,
  };
}

// ============================================================================
// CORS Handling
// ============================================================================

function getCORSHeaders(
  request: Request,
  config: SecurityConfig
): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const isAllowed =
    config.allowedOrigins.includes("*") ||
    config.allowedOrigins.includes(origin);

  if (!isAllowed) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-API-Key, X-Trace-ID",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

function handlePreflight(
  request: Request,
  config: SecurityConfig
): Response | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  const corsHeaders = getCORSHeaders(request, config);

  if (Object.keys(corsHeaders).length === 0) {
    return new Response("CORS origin not allowed", { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// ============================================================================
// Security Headers
// ============================================================================

function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

// ============================================================================
// Request Logging
// ============================================================================

interface LogEntry {
  timestamp: string;
  traceId: string;
  method: string;
  path: string;
  clientIP: string;
  userAgent: string;
  origin: string;
  country: string;
  rateLimitRemaining: number;
}

function generateTraceId(): string {
  return `tr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

function logRequest(entry: LogEntry): void {
  // Structured logging for Netlify logs
  console.log(JSON.stringify(entry));
}

// ============================================================================
// API Token Injection
// ============================================================================

function injectAPIToken(request: Request): Headers {
  const newHeaders = new Headers(request.headers);
  const url = new URL(request.url);

  // Only inject token for /api/* routes
  if (url.pathname.startsWith("/api/")) {
    const mulesoftToken = Deno.env.get("MULESOFT_API_KEY");
    if (mulesoftToken) {
      newHeaders.set("X-MuleSoft-API-Key", mulesoftToken);
    }

    // Remove client-side auth tokens that shouldn't reach backend
    // (backend uses the injected server-side token instead)
    const clientToken = newHeaders.get("X-Client-Token");
    if (clientToken) {
      newHeaders.delete("X-Client-Token");
    }
  }

  return newHeaders;
}

// ============================================================================
// Main Handler
// ============================================================================

export default async function security(
  request: Request,
  context: Context
): Promise<Response> {
  const config = getConfig();
  const url = new URL(request.url);

  // Skip security for static assets
  if (config.excludePaths.some((p) => url.pathname.startsWith(p))) {
    return context.next();
  }

  // Generate trace ID for this request
  const traceId = generateTraceId();

  // Get client IP
  const clientIP = context.ip || request.headers.get("x-forwarded-for") || "unknown";

  // Get geo info from Netlify context
  const country = context.geo?.country?.code || "XX";

  // 1. Handle CORS preflight
  const preflightResponse = handlePreflight(request, config);
  if (preflightResponse) {
    return preflightResponse;
  }

  // 2. Check rate limit
  const rateLimit = checkRateLimit(clientIP, config);
  if (!rateLimit.allowed) {
    logRequest({
      timestamp: new Date().toISOString(),
      traceId,
      method: request.method,
      path: url.pathname,
      clientIP,
      userAgent: request.headers.get("user-agent") || "",
      origin: request.headers.get("origin") || "",
      country,
      rateLimitRemaining: 0,
    });

    return new Response(
      JSON.stringify({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(
            (rateLimit.resetAt - Date.now()) / 1000
          ).toString(),
          "X-RateLimit-Limit": config.rateLimitMax.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.resetAt.toString(),
        },
      }
    );
  }

  // 3. Log the request
  logRequest({
    timestamp: new Date().toISOString(),
    traceId,
    method: request.method,
    path: url.pathname,
    clientIP,
    userAgent: request.headers.get("user-agent") || "",
    origin: request.headers.get("origin") || "",
    country,
    rateLimitRemaining: rateLimit.remaining,
  });

  // 4. Inject API tokens for backend requests
  const modifiedHeaders = injectAPIToken(request);
  modifiedHeaders.set("X-Trace-ID", traceId);
  modifiedHeaders.set("X-Client-IP", clientIP);
  modifiedHeaders.set("X-Client-Country", country);

  // 5. Create modified request with new headers
  // Note: GET/HEAD requests cannot have a body
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const modifiedRequest = new Request(request.url, {
    method: request.method,
    headers: modifiedHeaders,
    body: hasBody ? request.body : undefined,
    redirect: request.redirect,
  });

  // 6. Continue to next handler and get response
  const response = await context.next(modifiedRequest);

  // 7. Add security headers and CORS headers to response
  const newHeaders = new Headers(response.headers);

  // Add security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }

  // Add CORS headers
  const corsHeaders = getCORSHeaders(request, config);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }

  // Add rate limit headers
  newHeaders.set("X-RateLimit-Limit", config.rateLimitMax.toString());
  newHeaders.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
  newHeaders.set("X-RateLimit-Reset", rateLimit.resetAt.toString());

  // Add trace ID to response
  newHeaders.set("X-Trace-ID", traceId);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// ============================================================================
// Edge Function Config
// ============================================================================

export const config = {
  path: "/*",
  excludedPath: ["/_nuxt/*", "/__nuxt/*", "/favicon.ico"],
};
