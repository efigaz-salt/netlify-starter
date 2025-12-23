/// <reference types="@netlify/edge-functions" />

import type { Context } from "@netlify/edge-functions";

// ============================================================================
// Configuration
// ============================================================================

interface ApiRouterConfig {
  backendUrl: string;
  sseUrl: string;
  timeout: number;
  retries: number;
}

const getConfig = (): ApiRouterConfig => {
  // Get backend URL from environment (set after Terraform deployment)
  // Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
  const backendUrl = Deno.env.get("API_GATEWAY_URL") || Deno.env.get("API_URL") || "";
  // SSE Lambda Function URL for streaming
  const sseUrl = Deno.env.get("SSE_FUNCTION_URL") || "";

  return {
    backendUrl,
    sseUrl,
    timeout: parseInt(Deno.env.get("API_TIMEOUT") || "30000", 10),
    retries: parseInt(Deno.env.get("API_RETRIES") || "2", 10),
  };
};

// ============================================================================
// Request Logging
// ============================================================================

interface ProxyLogEntry {
  type: string;
  timestamp: string;
  traceId: string;
  method: string;
  path: string;
  backendUrl: string;
  status?: number;
  latency?: number;
  error?: string;
  attempt?: number;
}

const log = (entry: ProxyLogEntry): void => {
  console.log(JSON.stringify(entry));
};

// ============================================================================
// SSE Proxy (for Lambda Function URL with Response Streaming)
// ============================================================================

async function proxyToSSE(
  request: Request,
  config: ApiRouterConfig,
  traceId: string
): Promise<Response> {
  const url = new URL(request.url);
  // Build SSE URL with query params
  const sseUrl = new URL(config.sseUrl);
  url.searchParams.forEach((value, key) => {
    sseUrl.searchParams.set(key, value);
  });

  const startTime = Date.now();

  log({
    type: "sse_proxy_request",
    timestamp: new Date().toISOString(),
    traceId,
    method: request.method,
    path: url.pathname,
    backendUrl: sseUrl.toString(),
  });

  try {
    const response = await fetch(sseUrl.toString(), {
      method: request.method,
      headers: {
        "X-Trace-ID": traceId,
        "Accept": "text/event-stream",
      },
    });

    const latency = Date.now() - startTime;

    log({
      type: "sse_proxy_connected",
      timestamp: new Date().toISOString(),
      traceId,
      method: request.method,
      path: url.pathname,
      backendUrl: sseUrl.toString(),
      status: response.status,
      latency,
    });

    // Return streaming response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Trace-ID": traceId,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;

    log({
      type: "sse_proxy_error",
      timestamp: new Date().toISOString(),
      traceId,
      method: request.method,
      path: url.pathname,
      backendUrl: sseUrl.toString(),
      error: (error as Error).message,
      latency,
    });

    return new Response(
      JSON.stringify({
        error: "SSE Connection Failed",
        message: (error as Error).message,
        traceId,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "X-Trace-ID": traceId,
        },
      }
    );
  }
}

// ============================================================================
// Backend Proxy
// ============================================================================

async function proxyToBackend(
  request: Request,
  config: ApiRouterConfig,
  traceId: string
): Promise<Response> {
  const url = new URL(request.url);
  // Remove /api prefix when proxying to API Gateway
  const backendPath = url.pathname.replace(/^\/api/, "");
  const backendUrl = `${config.backendUrl}${backendPath}${url.search}`;

  // Copy headers, add trace headers
  const headers = new Headers(request.headers);
  headers.set("X-Trace-ID", traceId);
  headers.set("X-Forwarded-Host", url.host);
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));
  headers.set("X-Original-Path", url.pathname);

  // Remove headers that shouldn't be forwarded
  headers.delete("host");

  // Add API key if configured
  const apiKey = Deno.env.get("MULESOFT_API_KEY");
  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(backendUrl, {
        method: request.method,
        headers,
        body: ["GET", "HEAD", "OPTIONS"].includes(request.method) ? undefined : request.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      log({
        type: "proxy_success",
        timestamp: new Date().toISOString(),
        traceId,
        method: request.method,
        path: url.pathname,
        backendUrl,
        status: response.status,
        latency,
        attempt: attempt + 1,
      });

      // Clone response and add trace headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Trace-ID", traceId);
      newHeaders.set("X-Backend-Latency", latency.toString());

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });

    } catch (error) {
      lastError = error as Error;
      const latency = Date.now() - startTime;

      log({
        type: "proxy_error",
        timestamp: new Date().toISOString(),
        traceId,
        method: request.method,
        path: url.pathname,
        backendUrl,
        error: (error as Error).message,
        latency,
        attempt: attempt + 1,
      });

      if (attempt < config.retries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }

  // All retries exhausted
  return new Response(
    JSON.stringify({
      error: "Backend Unavailable",
      message: "Unable to reach backend service after multiple attempts",
      details: lastError?.message,
      traceId,
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "X-Trace-ID": traceId,
      },
    }
  );
}

// ============================================================================
// Main Handler
// ============================================================================

export default async function apiRouter(
  request: Request,
  context: Context
): Promise<Response> {
  const config = getConfig();
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle /api/* and /api2/* routes
  if (!path.startsWith("/api") && !path.startsWith("/api2")) {
    return context.next();
  }

  // Generate trace ID
  const traceId = request.headers.get("X-Trace-ID") ||
    `api-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

  // Log incoming request
  log({
    type: "api_request",
    timestamp: new Date().toISOString(),
    traceId,
    method: request.method,
    path,
    backendUrl: config.backendUrl,
  });

  // Handle internal redirects (for Salt Security testing)
  if (path === "/api/larges/newone") {
    // Rewrite the URL to /api/test/large
    const newUrl = new URL(request.url);
    newUrl.pathname = "/api/test/large";
    const newRequest = new Request(newUrl.toString(), request);

    log({
      type: "internal_redirect",
      timestamp: new Date().toISOString(),
      traceId,
      method: request.method,
      path,
      backendUrl: newUrl.toString(),
    });

    // Continue processing with the new path
    return proxyToBackend(newRequest, config, traceId);
  }

  // Handle Akamai backend proxy routes (with Salt collector)
  if (path.startsWith("/api/akamai/")) {
    const akamaiBackend = "https://akamaitest.salt-cng-team-test.org";
    const akamaiPath = path.replace("/api/akamai", "");
    const akamaiUrl = `${akamaiBackend}${akamaiPath}${url.search}`;

    log({
      type: "akamai_proxy",
      timestamp: new Date().toISOString(),
      traceId,
      method: request.method,
      path,
      backendUrl: akamaiUrl,
    });

    try {
      const headers = new Headers(request.headers);
      headers.set("X-Trace-ID", traceId);
      headers.delete("host");

      const response = await fetch(akamaiUrl, {
        method: request.method,
        headers,
        body: ["GET", "HEAD", "OPTIONS"].includes(request.method) ? undefined : request.body,
      });

      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Trace-ID", traceId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      log({
        type: "akamai_proxy_error",
        timestamp: new Date().toISOString(),
        traceId,
        method: request.method,
        path,
        backendUrl: akamaiUrl,
        error: (error as Error).message,
      });

      return new Response(
        JSON.stringify({
          error: "Akamai Backend Unavailable",
          message: (error as Error).message,
          traceId,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "X-Trace-ID": traceId,
          },
        }
      );
    }
  }

  // Handle api2 routes (bypass Salt collector, direct to Akamai)
  if (path.startsWith("/api2/")) {
    const akamaiBackend = "https://akamaitest.salt-cng-team-test.org";
    const akamaiPath = path.replace("/api2", "");
    const akamaiUrl = `${akamaiBackend}${akamaiPath}${url.search}`;

    log({
      type: "api2_proxy",
      timestamp: new Date().toISOString(),
      traceId,
      method: request.method,
      path,
      backendUrl: akamaiUrl,
    });

    try {
      const headers = new Headers(request.headers);
      headers.set("X-Trace-ID", traceId);
      headers.delete("host");

      const response = await fetch(akamaiUrl, {
        method: request.method,
        headers,
        body: ["GET", "HEAD", "OPTIONS"].includes(request.method) ? undefined : request.body,
      });

      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Trace-ID", traceId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      log({
        type: "api2_proxy_error",
        timestamp: new Date().toISOString(),
        traceId,
        method: request.method,
        path,
        backendUrl: akamaiUrl,
        error: (error as Error).message,
      });

      return new Response(
        JSON.stringify({
          error: "Akamai Backend Unavailable",
          message: (error as Error).message,
          traceId,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "X-Trace-ID": traceId,
          },
        }
      );
    }
  }

  // Route /api/sse to SSE Lambda Function URL
  if (path === "/api/sse" || path.startsWith("/api/sse?")) {
    if (!config.sseUrl) {
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          message: "SSE Function URL not configured. Set SSE_FUNCTION_URL environment variable.",
          traceId,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "X-Trace-ID": traceId,
          },
        }
      );
    }

    // Handle CORS preflight for SSE
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Trace-ID",
          "Access-Control-Max-Age": "86400",
          "X-Trace-ID": traceId,
        },
      });
    }

    return proxyToSSE(request, config, traceId);
  }

  // Check if backend URL is configured
  if (!config.backendUrl) {
    return new Response(
      JSON.stringify({
        error: "Configuration Error",
        message: "API Gateway URL not configured. Deploy Terraform infrastructure first.",
        hint: "Set API_GATEWAY_URL environment variable with the Terraform output",
        traceId,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "X-Trace-ID": traceId,
        },
      }
    );
  }

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, X-Trace-ID",
        "Access-Control-Max-Age": "86400",
        "X-Trace-ID": traceId,
      },
    });
  }

  // Proxy to backend
  return proxyToBackend(request, config, traceId);
}

// ============================================================================
// Edge Function Config
// ============================================================================

export const config = {
  path: ["/api/*", "/api2/*"],
};
