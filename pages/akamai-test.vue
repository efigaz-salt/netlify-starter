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

        <button
          @click="runHealthCheck"
          :disabled="healthLoading"
          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ healthLoading ? 'Checking...' : 'Check Health' }}
        </button>

        <div v-if="healthResult" class="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
          <pre class="text-xs text-green-700 overflow-x-auto">{{ JSON.stringify(healthResult, null, 2) }}</pre>
        </div>
      </div>

      <!-- Simple API -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Simple API</h3>
        <p class="text-sm text-gray-500 mb-4">
          Basic GET/POST request/response test
        </p>

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

        <div v-if="simpleResult" class="mt-4 bg-gray-50 border border-gray-200 rounded-md p-3">
          <pre class="text-xs text-gray-700 overflow-x-auto">{{ JSON.stringify(simpleResult, null, 2) }}</pre>
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

          <button
            @click="runLargePayloadTest"
            :disabled="largeLoading"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ largeLoading ? 'Loading...' : 'Run Test' }}
          </button>

          <div v-if="largeResult" class="bg-green-50 border border-green-200 rounded-md p-3">
            <p class="text-sm font-medium text-green-800 mb-2">Success!</p>
            <div class="text-xs text-green-700 space-y-1">
              <p>Size: {{ (largeResult.size / 1024 / 1024).toFixed(2) }} MB</p>
              <p>Items: {{ largeResult.items?.length || 0 }}</p>
              <p>Round-trip: {{ largeResult.roundTrip }}ms</p>
            </div>
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

          <button
            @click="runDelayTest"
            :disabled="delayLoading"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ delayLoading ? `Waiting ${elapsed}s...` : 'Run Delay Test' }}
          </button>

          <div v-if="delayResult" class="bg-green-50 border border-green-200 rounded-md p-3">
            <pre class="text-xs text-green-700 overflow-x-auto">{{ JSON.stringify(delayResult, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- Status Code Test -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Status Code Test</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test different HTTP status codes
        </p>

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

        <div v-if="statusResult" class="mt-4">
          <div
            :class="[
              'border rounded-md p-3',
              statusResult.status >= 200 && statusResult.status < 300 ? 'bg-green-50 border-green-200' :
              statusResult.status >= 400 && statusResult.status < 500 ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            ]"
          >
            <p class="text-sm font-medium">Status: {{ statusResult.status }}</p>
            <pre class="text-xs mt-2 overflow-x-auto">{{ JSON.stringify(statusResult.data, null, 2) }}</pre>
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
    </div>
  </div>
</template>

<script setup lang="ts">
const BACKEND_URL = 'https://akamaitest.salt-cng-team-test.org'

// Health Check
const healthLoading = ref(false)
const healthResult = ref<any>(null)

const runHealthCheck = async () => {
  healthLoading.value = true
  healthResult.value = null

  try {
    const response = await $fetch(`${BACKEND_URL}/health`)
    healthResult.value = response
  } catch (e) {
    healthResult.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    healthLoading.value = false
  }
}

// Simple API
const simpleLoading = ref(false)
const simpleResult = ref<any>(null)

const runSimpleTest = async (method: 'GET' | 'POST') => {
  simpleLoading.value = true
  simpleResult.value = null

  try {
    const options: any = { method }
    if (method === 'POST') {
      options.body = { test: 'data', timestamp: new Date().toISOString() }
    }
    const response = await $fetch(`${BACKEND_URL}/api/simple`, options)
    simpleResult.value = response
  } catch (e) {
    simpleResult.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    simpleLoading.value = false
  }
}

// Large Payload
const payloadSize = ref(1)
const largeLoading = ref(false)
const largeResult = ref<any>(null)

const runLargePayloadTest = async () => {
  largeLoading.value = true
  largeResult.value = null

  const startTime = Date.now()

  try {
    const response = await $fetch(`${BACKEND_URL}/api/payload/large?size=${payloadSize.value}`)
    const roundTrip = Date.now() - startTime
    largeResult.value = { ...response, roundTrip }
  } catch (e) {
    largeResult.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    largeLoading.value = false
  }
}

// Delay Test
const delaySeconds = ref(3)
const delayLoading = ref(false)
const delayResult = ref<any>(null)
const elapsed = ref(0)
let elapsedInterval: ReturnType<typeof setInterval> | null = null

const runDelayTest = async () => {
  delayLoading.value = true
  delayResult.value = null
  elapsed.value = 0

  elapsedInterval = setInterval(() => {
    elapsed.value++
  }, 1000)

  try {
    const response = await $fetch(`${BACKEND_URL}/api/long/delay?delay=${delaySeconds.value * 1000}`)
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

// Status Code Test
const statusResult = ref<{ status: number; data: any } | null>(null)

const runStatusTest = async (code: number) => {
  statusResult.value = null

  try {
    const response = await $fetch<any>(`${BACKEND_URL}/api/status/${code}`, {
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

// SSE Streaming
const sseCount = ref(10)
const sseConnected = ref(false)
const sseEvents = ref<{ type: string; data: string }[]>([])
let eventSource: EventSource | null = null

const startSSE = () => {
  sseEvents.value = []
  sseConnected.value = true

  eventSource = new EventSource(`${BACKEND_URL}/api/sse/stream?count=${sseCount.value}`)

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

onUnmounted(() => {
  stopSSE()
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
  }
})

useHead({
  title: 'Akamai Backend Test - Netlify Client',
})
</script>
