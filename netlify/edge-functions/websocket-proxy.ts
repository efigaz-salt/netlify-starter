/// <reference types="@netlify/edge-functions" />

import type { Context } from "@netlify/edge-functions";

/**
 * WebSocket Proxy Edge Function
 *
 * This edge function handles WebSocket connections by:
 * 1. Accepting the upgrade request from the client
 * 2. Creating a connection to the backend WebSocket server
 * 3. Proxying messages bidirectionally between client and backend
 *
 * Note: This bypasses the Salt collector since WebSocket protocol
 * cannot be captured in the same way as HTTP request/response pairs.
 */

const BACKEND_WS_URL = "wss://akamaitest.salt-cng-team-test.org/ws";

export default async function websocketProxy(
  request: Request,
  context: Context
): Promise<Response> {
  const url = new URL(request.url);

  // Only handle WebSocket upgrade requests
  const upgradeHeader = request.headers.get("upgrade");
  if (upgradeHeader !== "websocket") {
    return new Response("Expected WebSocket upgrade request", { status: 426 });
  }

  // Generate trace ID for logging
  const traceId = request.headers.get("X-Trace-ID") ||
    `ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

  console.log(JSON.stringify({
    type: "websocket_upgrade",
    timestamp: new Date().toISOString(),
    traceId,
    path: url.pathname,
    backendUrl: BACKEND_WS_URL,
  }));

  try {
    // Accept the WebSocket upgrade from the client
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(request);

    // Connect to backend WebSocket
    const backendSocket = new WebSocket(BACKEND_WS_URL);

    // Client -> Backend: Forward messages from client to backend
    clientSocket.onmessage = (event) => {
      if (backendSocket.readyState === WebSocket.OPEN) {
        backendSocket.send(event.data);
        console.log(JSON.stringify({
          type: "websocket_client_to_backend",
          timestamp: new Date().toISOString(),
          traceId,
          data: typeof event.data === "string" ? event.data.substring(0, 100) : "[binary]",
        }));
      }
    };

    // Backend -> Client: Forward messages from backend to client
    backendSocket.onmessage = (event) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
        console.log(JSON.stringify({
          type: "websocket_backend_to_client",
          timestamp: new Date().toISOString(),
          traceId,
          data: typeof event.data === "string" ? event.data.substring(0, 100) : "[binary]",
        }));
      }
    };

    // Handle client connection open
    clientSocket.onopen = () => {
      console.log(JSON.stringify({
        type: "websocket_client_connected",
        timestamp: new Date().toISOString(),
        traceId,
      }));
    };

    // Handle backend connection open
    backendSocket.onopen = () => {
      console.log(JSON.stringify({
        type: "websocket_backend_connected",
        timestamp: new Date().toISOString(),
        traceId,
        backendUrl: BACKEND_WS_URL,
      }));
    };

    // Handle client disconnection
    clientSocket.onclose = () => {
      console.log(JSON.stringify({
        type: "websocket_client_closed",
        timestamp: new Date().toISOString(),
        traceId,
      }));
      if (backendSocket.readyState === WebSocket.OPEN) {
        backendSocket.close();
      }
    };

    // Handle backend disconnection
    backendSocket.onclose = () => {
      console.log(JSON.stringify({
        type: "websocket_backend_closed",
        timestamp: new Date().toISOString(),
        traceId,
      }));
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close();
      }
    };

    // Handle client errors
    clientSocket.onerror = (error) => {
      console.error(JSON.stringify({
        type: "websocket_client_error",
        timestamp: new Date().toISOString(),
        traceId,
        error: String(error),
      }));
      backendSocket.close();
    };

    // Handle backend errors
    backendSocket.onerror = (error) => {
      console.error(JSON.stringify({
        type: "websocket_backend_error",
        timestamp: new Date().toISOString(),
        traceId,
        backendUrl: BACKEND_WS_URL,
        error: String(error),
      }));
      clientSocket.close();
    };

    // Return the WebSocket upgrade response
    return response;

  } catch (error) {
    console.error(JSON.stringify({
      type: "websocket_upgrade_error",
      timestamp: new Date().toISOString(),
      traceId,
      error: (error as Error).message,
    }));

    return new Response(
      JSON.stringify({
        error: "WebSocket Upgrade Failed",
        message: (error as Error).message,
        traceId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Trace-ID": traceId,
        },
      }
    );
  }
}

export const config = {
  path: "/api/ws",
};
