/// <reference types="@netlify/edge-functions" />

import type { Context } from "@netlify/edge-functions";

// ============================================================================
// Configuration
// ============================================================================

interface ApiRouterConfig {
  backendUrl: string;
  timeout: number;
  retries: number;
}

const getConfig = (): ApiRouterConfig => {
  // Get backend URL from environment (set after Terraform deployment)
  // Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
  const backendUrl = Deno.env.get("API_GATEWAY_URL") || Deno.env.get("API_URL") || "";

  return {
    backendUrl,
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

  // Only handle /api/* routes
  if (!path.startsWith("/api")) {
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
  path: "/api/*",
};
