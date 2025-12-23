<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Akamai Backend Test Console</h1>
      <p class="text-gray-600">Test Akamai backend at https://akamaitest.salt-cng-team-test.org</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Health Check -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Health Check</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test backend health endpoint
        </p>

        <div class="flex items-center space-x-3">
          <button
            @click="runHealthCheck"
            :disabled="healthLoading"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ healthLoading ? 'Checking...' : 'Check Health (/api)' }}
          </button>
          <button
            @click="runHealthCheckApi2"
            :disabled="healthApi2Loading"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed !bg-purple-600 hover:!bg-purple-700"
          >
            {{ healthApi2Loading ? 'Checking...' : 'Check Health (/api2)' }}
          </button>
        </div>

        <div v-if="healthResult" class="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
          <p class="text-xs font-medium text-green-700 mb-1">Result from /api/akamai:</p>
          <pre class="text-xs text-green-700 overflow-x-auto">{{ JSON.stringify(healthResult, null, 2) }}</pre>
        </div>

        <div v-if="healthApi2Result" class="mt-4 bg-purple-50 border border-purple-200 rounded-md p-3">
          <p class="text-xs font-medium text-purple-700 mb-1">Result from /api2:</p>
          <pre class="text-xs text-purple-700 overflow-x-auto">{{ JSON.stringify(healthApi2Result, null, 2) }}</pre>
        </div>
      </div>

      <!-- Simple API -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Simple API</h3>
        <p class="text-sm text-gray-500 mb-4">
          Basic GET/POST request/response test
        </p>

        <div class="space-y-3">
          <div>
            <p class="text-xs text-gray-600 mb-2">With Salt Collector (/api/akamai):</p>
            <div class="flex items-center space-x-3">
              <button
                @click="runSimpleTest('GET')"
                :disabled="simpleLoading"
                class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
              >
                GET
              </button>
              <button
                @click="runSimpleTest('POST')"
                :disabled="simpleLoading"
                class="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50"
              >
                POST
              </button>
            </div>
          </div>

          <div>
            <p class="text-xs text-gray-600 mb-2">Without Salt Collector (/api2):</p>
            <div class="flex items-center space-x-3">
              <button
                @click="runApi2Test('GET')"
                :disabled="api2Loading"
                class="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 disabled:opacity-50"
              >
                GET (api2)
              </button>
              <button
                @click="runApi2Test('POST')"
                :disabled="api2Loading"
                class="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50"
              >
                POST (api2)
              </button>
            </div>
          </div>
        </div>

        <div v-if="simpleResult" class="mt-4 bg-gray-50 border border-gray-200 rounded-md p-3">
          <p class="text-xs font-medium text-gray-700 mb-1">Result from /api/akamai:</p>
          <pre class="text-xs text-gray-700 overflow-x-auto">{{ JSON.stringify(simpleResult, null, 2) }}</pre>
        </div>

        <div v-if="api2Result" class="mt-4 bg-purple-50 border border-purple-200 rounded-md p-3">
          <p class="text-xs font-medium text-purple-700 mb-1">Result from /api2:</p>
          <pre class="text-xs text-purple-700 overflow-x-auto">{{ JSON.stringify(api2Result, null, 2) }}</pre>
        </div>
      </div>

      <!-- Large Payload -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Large Payload Test</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test with large response payloads
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Payload Size (MB)
            </label>
            <input
              v-model.number="payloadSize"
              type="number"
              min="0.1"
              max="10"
              step="0.5"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div class="flex items-center space-x-3">
            <button
              @click="runLargePayloadTest"
              :disabled="largeLoading"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ largeLoading ? 'Loading...' : 'Run Test (/api)' }}
            </button>
            <button
              @click="runLargePayloadTestApi2"
              :disabled="largeApi2Loading"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed !bg-purple-600 hover:!bg-purple-700"
            >
              {{ largeApi2Loading ? 'Loading...' : 'Run Test (/api2)' }}
            </button>
          </div>

          <div v-if="largeResult && !largeResult.error" class="bg-green-50 border border-green-200 rounded-md p-3">
            <p class="text-sm font-medium text-green-800 mb-2">Success (/api/akamai)!</p>
            <div class="text-xs text-green-700 space-y-1">
              <p>Requested: {{ (largeResult.requestedSize / 1024 / 1024).toFixed(2) }} MB</p>
              <p>Actual: {{ (largeResult.actualSize / 1024 / 1024).toFixed(2) }} MB</p>
              <p>Round-trip: {{ largeResult.roundTrip }}ms</p>
            </div>
          </div>

          <div v-if="largeApi2Result && !largeApi2Result.error" class="bg-purple-50 border border-purple-200 rounded-md p-3">
            <p class="text-sm font-medium text-purple-800 mb-2">Success (/api2)!</p>
            <div class="text-xs text-purple-700 space-y-1">
              <p>Requested: {{ (largeApi2Result.requestedSize / 1024 / 1024).toFixed(2) }} MB</p>
              <p>Actual: {{ (largeApi2Result.actualSize / 1024 / 1024).toFixed(2) }} MB</p>
              <p>Round-trip: {{ largeApi2Result.roundTrip }}ms</p>
            </div>
          </div>

          <div v-if="largeResult?.error" class="bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-xs text-red-700">{{ largeResult.error }}</p>
          </div>
          <div v-if="largeApi2Result?.error" class="bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-xs text-red-700">{{ largeApi2Result.error }}</p>
          </div>
        </div>
      </div>

      <!-- Delay Test -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Delay Test</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test delayed responses
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Delay (seconds)
            </label>
            <input
              v-model.number="delaySeconds"
              type="number"
              min="1"
              max="30"
              step="1"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div class="flex items-center space-x-3">
            <button
              @click="runDelayTest"
              :disabled="delayLoading"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ delayLoading ? `Waiting ${elapsed}s...` : 'Run Delay (/api)' }}
            </button>
            <button
              @click="runDelayTestApi2"
              :disabled="delayApi2Loading"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed !bg-purple-600 hover:!bg-purple-700"
            >
              {{ delayApi2Loading ? `Waiting ${elapsedApi2}s...` : 'Run Delay (/api2)' }}
            </button>
          </div>

          <div v-if="delayResult" class="bg-green-50 border border-green-200 rounded-md p-3">
            <p class="text-xs font-medium text-green-700 mb-1">Result from /api/akamai:</p>
            <pre class="text-xs text-green-700 overflow-x-auto">{{ JSON.stringify(delayResult, null, 2) }}</pre>
          </div>

          <div v-if="delayApi2Result" class="bg-purple-50 border border-purple-200 rounded-md p-3">
            <p class="text-xs font-medium text-purple-700 mb-1">Result from /api2:</p>
            <pre class="text-xs text-purple-700 overflow-x-auto">{{ JSON.stringify(delayApi2Result, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- Status Code Test -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Status Code Test</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test different HTTP status codes
        </p>

        <div class="space-y-3">
          <div>
            <p class="text-xs text-gray-600 mb-2">/api/akamai:</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="code in [200, 201, 400, 401, 403, 404, 500, 502, 503]"
                :key="code"
                @click="runStatusTest(code)"
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-md border',
                  code >= 200 && code < 300 ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100' :
                  code >= 400 && code < 500 ? 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                  'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                ]"
              >
                {{ code }}
              </button>
            </div>
          </div>

          <div>
            <p class="text-xs text-gray-600 mb-2">/api2:</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="code in [200, 201, 400, 401, 403, 404, 500, 502, 503]"
                :key="`api2-${code}`"
                @click="runStatusTestApi2(code)"
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-md border',
                  code >= 200 && code < 300 ? 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100' :
                  code >= 400 && code < 500 ? 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100' :
                  'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                ]"
              >
                {{ code }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="statusResult" class="mt-4">
          <div
            :class="[
              'border rounded-md p-3',
              statusResult.status >= 200 && statusResult.status < 300 ? 'bg-green-50 border-green-200' :
              statusResult.status >= 400 && statusResult.status < 500 ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            ]"
          >
            <p class="text-sm font-medium">Status from /api/akamai: {{ statusResult.status }}</p>
            <pre class="text-xs mt-2 overflow-x-auto">{{ JSON.stringify(statusResult.data, null, 2) }}</pre>
          </div>
        </div>

        <div v-if="statusApi2Result" class="mt-4">
          <div
            :class="[
              'border rounded-md p-3',
              statusApi2Result.status >= 200 && statusApi2Result.status < 300 ? 'bg-purple-50 border-purple-200' :
              statusApi2Result.status >= 400 && statusApi2Result.status < 500 ? 'bg-orange-50 border-orange-200' :
              'bg-red-50 border-red-200'
            ]"
          >
            <p class="text-sm font-medium">Status from /api2: {{ statusApi2Result.status }}</p>
            <pre class="text-xs mt-2 overflow-x-auto">{{ JSON.stringify(statusApi2Result.data, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- SSE Streaming -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">SSE Streaming</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test Server-Sent Events streaming
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Event Count
            </label>
            <input
              v-model.number="sseCount"
              type="number"
              min="5"
              max="50"
              step="5"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div class="flex items-center space-x-3">
            <button
              @click="startSSE"
              :disabled="sseConnected"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ sseConnected ? 'Connected' : 'Start Stream' }}
            </button>
            <button
              @click="stopSSE"
              :disabled="!sseConnected"
              class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
            >
              Stop
            </button>
          </div>

          <div v-if="sseEvents.length > 0" class="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-60 overflow-y-auto">
            <div v-for="(event, idx) in sseEvents" :key="idx" class="text-xs text-gray-700 mb-1">
              <span class="font-medium">{{ event.type }}:</span> {{ event.data }}
            </div>
          </div>
        </div>
      </div>

      <!-- WebSocket -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">WebSocket</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test WebSocket bidirectional communication
        </p>

        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <button
              @click="connectWS"
              :disabled="wsConnected"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ wsConnected ? 'Connected' : 'Connect' }}
            </button>
            <button
              @click="disconnectWS"
              :disabled="!wsConnected"
              class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>

          <div v-if="wsConnected" class="space-y-2">
            <div class="flex items-center space-x-2">
              <input
                v-model="wsMessage"
                @keyup.enter="sendWSMessage"
                type="text"
                placeholder="Type a message..."
                class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <button
                @click="sendWSMessage"
                :disabled="!wsMessage.trim()"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>

            <button
              @click="sendWSPing"
              class="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Send Ping
            </button>
          </div>

          <div v-if="wsMessages.length > 0" class="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-60 overflow-y-auto">
            <div v-for="(msg, idx) in wsMessages" :key="idx" class="text-xs mb-1">
              <span :class="msg.type === 'sent' ? 'text-blue-600' : msg.type === 'received' ? 'text-green-600' : 'text-gray-600'" class="font-medium">
                [{{ msg.type }}]
              </span>
              <span class="text-gray-700">{{ msg.data }}</span>
            </div>
          </div>

          <div v-if="wsError" class="bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-xs text-red-700">{{ wsError }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// All requests go through /api/akamai/* which proxies to akamaitest.salt-cng-team-test.org
// This ensures Salt collector captures all traffic

// Helper to generate UUID for request tracking
const generateRequestId = () => {
  return crypto.randomUUID()
}

// Health Check
const healthLoading = ref(false)
const healthResult = ref<any>(null)
const healthApi2Loading = ref(false)
const healthApi2Result = ref<any>(null)

const runHealthCheck = async () => {
  healthLoading.value = true
  healthResult.value = null

  try {
    const requestId = generateRequestId()
    const response = await $fetch(`/api/akamai/health?request_id=${requestId}`)
    healthResult.value = response
  } catch (e) {
    healthResult.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    healthLoading.value = false
  }
}

const runHealthCheckApi2 = async () => {
  healthApi2Loading.value = true
  healthApi2Result.value = null

  try {
    const requestId = generateRequestId()
    const response = await $fetch(`/api2/health?request_id=${requestId}`)
    healthApi2Result.value = response
  } catch (e) {
    healthApi2Result.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    healthApi2Loading.value = false
  }
}

// Simple API
const simpleLoading = ref(false)
const simpleResult = ref<any>(null)

const runSimpleTest = async (method: 'GET' | 'POST') => {
  simpleLoading.value = true
  simpleResult.value = null

  try {
    const requestId = generateRequestId()
    const options: any = { method }
    if (method === 'POST') {
      options.body = { test: 'data', timestamp: new Date().toISOString(), request_id: requestId }
    }
    const response = await $fetch(`/api/akamai/api/simple?request_id=${requestId}`, options)
    simpleResult.value = response
  } catch (e) {
    simpleResult.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    simpleLoading.value = false
  }
}

// API2 (no Salt collector)
const api2Loading = ref(false)
const api2Result = ref<any>(null)

const runApi2Test = async (method: 'GET' | 'POST') => {
  api2Loading.value = true
  api2Result.value = null

  try {
    const requestId = generateRequestId()
    const options: any = { method }
    if (method === 'POST') {
      options.body = { test: 'data', timestamp: new Date().toISOString(), request_id: requestId }
    }
    const response = await $fetch(`/api2/api/simple?request_id=${requestId}`, options)
    api2Result.value = response
  } catch (e) {
    api2Result.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    api2Loading.value = false
  }
}

// Large Payload
const payloadSize = ref(1)
const largeLoading = ref(false)
const largeResult = ref<any>(null)
const largeApi2Loading = ref(false)
const largeApi2Result = ref<any>(null)

const runLargePayloadTest = async () => {
  largeLoading.value = true
  largeResult.value = null

  const startTime = Date.now()

  try {
    const requestId = generateRequestId()
    // Convert MB to bytes (backend expects size in bytes)
    const sizeInBytes = payloadSize.value * 1024 * 1024
    const response = await $fetch(`/api/akamai/api/payload/large?size=${sizeInBytes}&request_id=${requestId}`)
    const roundTrip = Date.now() - startTime
    largeResult.value = { ...response, roundTrip }
  } catch (e) {
    largeResult.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    largeLoading.value = false
  }
}

const runLargePayloadTestApi2 = async () => {
  largeApi2Loading.value = true
  largeApi2Result.value = null

  const startTime = Date.now()

  try {
    const requestId = generateRequestId()
    // Convert MB to bytes (backend expects size in bytes)
    const sizeInBytes = payloadSize.value * 1024 * 1024
    const response = await $fetch(`/api2/api/payload/large?size=${sizeInBytes}&request_id=${requestId}`)
    const roundTrip = Date.now() - startTime
    largeApi2Result.value = { ...response, roundTrip }
  } catch (e) {
    largeApi2Result.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    largeApi2Loading.value = false
  }
}

// Delay Test
const delaySeconds = ref(3)
const delayLoading = ref(false)
const delayResult = ref<any>(null)
const elapsed = ref(0)
let elapsedInterval: ReturnType<typeof setInterval> | null = null

const delayApi2Loading = ref(false)
const delayApi2Result = ref<any>(null)
const elapsedApi2 = ref(0)
let elapsedApi2Interval: ReturnType<typeof setInterval> | null = null

const runDelayTest = async () => {
  delayLoading.value = true
  delayResult.value = null
  elapsed.value = 0

  elapsedInterval = setInterval(() => {
    elapsed.value++
  }, 1000)

  try {
    const requestId = generateRequestId()
    const response = await $fetch(`/api/akamai/api/long/delay?delay=${delaySeconds.value * 1000}&request_id=${requestId}`)
    delayResult.value = response
  } catch (e) {
    delayResult.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    delayLoading.value = false
    if (elapsedInterval) {
      clearInterval(elapsedInterval)
      elapsedInterval = null
    }
  }
}

const runDelayTestApi2 = async () => {
  delayApi2Loading.value = true
  delayApi2Result.value = null
  elapsedApi2.value = 0

  elapsedApi2Interval = setInterval(() => {
    elapsedApi2.value++
  }, 1000)

  try {
    const requestId = generateRequestId()
    const response = await $fetch(`/api2/api/long/delay?delay=${delaySeconds.value * 1000}&request_id=${requestId}`)
    delayApi2Result.value = response
  } catch (e) {
    delayApi2Result.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    delayApi2Loading.value = false
    if (elapsedApi2Interval) {
      clearInterval(elapsedApi2Interval)
      elapsedApi2Interval = null
    }
  }
}

// Status Code Test
const statusResult = ref<{ status: number; data: any } | null>(null)
const statusApi2Result = ref<{ status: number; data: any } | null>(null)

const runStatusTest = async (code: number) => {
  statusResult.value = null

  try {
    const requestId = generateRequestId()
    const response = await $fetch<any>(`/api/akamai/api/status/${code}?request_id=${requestId}`, {
      ignoreResponseError: true,
    })
    statusResult.value = { status: code, data: response }
  } catch (e: any) {
    statusResult.value = {
      status: e.response?.status || code,
      data: e.data || { error: e.message }
    }
  }
}

const runStatusTestApi2 = async (code: number) => {
  statusApi2Result.value = null

  try {
    const requestId = generateRequestId()
    const response = await $fetch<any>(`/api2/api/status/${code}?request_id=${requestId}`, {
      ignoreResponseError: true,
    })
    statusApi2Result.value = { status: code, data: response }
  } catch (e: any) {
    statusApi2Result.value = {
      status: e.response?.status || code,
      data: e.data || { error: e.message }
    }
  }
}

// SSE Streaming
const sseCount = ref(10)
const sseConnected = ref(false)
const sseEvents = ref<{ type: string; data: string }[]>([])
let eventSource: EventSource | null = null

const startSSE = () => {
  sseEvents.value = []
  sseConnected.value = true

  const requestId = generateRequestId()
  eventSource = new EventSource(`/api/akamai/api/sse/stream?count=${sseCount.value}&request_id=${requestId}`)

  eventSource.onmessage = (e) => {
    sseEvents.value.push({ type: 'message', data: e.data })
  }

  eventSource.onerror = () => {
    sseConnected.value = false
    eventSource?.close()
  }

  // Auto-close after receiving expected count + buffer
  setTimeout(() => {
    if (sseConnected.value) {
      stopSSE()
    }
  }, (sseCount.value + 2) * 1000)
}

const stopSSE = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  sseConnected.value = false
}

// WebSocket
const wsConnected = ref(false)
const wsMessages = ref<{ type: string; data: string }[]>([])
const wsMessage = ref('')
const wsError = ref<string | null>(null)
let websocket: WebSocket | null = null

const connectWS = () => {
  wsMessages.value = []
  wsError.value = null

  try {
    // Connect directly to Akamai backend WebSocket endpoint
    // Note: WebSocket connections cannot go through HTTP edge functions
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//akamaitest.salt-cng-team-test.org/ws`

    websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      wsConnected.value = true
      wsMessages.value.push({ type: 'info', data: 'Connected to WebSocket' })
    }

    websocket.onmessage = (event) => {
      wsMessages.value.push({ type: 'received', data: event.data })
    }

    websocket.onerror = (error) => {
      wsError.value = 'WebSocket error occurred'
      wsMessages.value.push({ type: 'error', data: 'Connection error' })
    }

    websocket.onclose = () => {
      wsConnected.value = false
      wsMessages.value.push({ type: 'info', data: 'Disconnected from WebSocket' })
    }
  } catch (error) {
    wsError.value = (error as Error).message
    wsConnected.value = false
  }
}

const disconnectWS = () => {
  if (websocket) {
    websocket.close()
    websocket = null
  }
  wsConnected.value = false
}

const sendWSMessage = () => {
  if (websocket && wsConnected.value && wsMessage.value.trim()) {
    websocket.send(wsMessage.value)
    wsMessages.value.push({ type: 'sent', data: wsMessage.value })
    wsMessage.value = ''
  }
}

const sendWSPing = () => {
  if (websocket && wsConnected.value) {
    websocket.send('ping')
    wsMessages.value.push({ type: 'sent', data: 'ping' })
  }
}

onUnmounted(() => {
  stopSSE()
  disconnectWS()
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
  }
  if (elapsedApi2Interval) {
    clearInterval(elapsedApi2Interval)
  }
})

useHead({
  title: 'Akamai Backend Test - Netlify Client',
})
</script>
