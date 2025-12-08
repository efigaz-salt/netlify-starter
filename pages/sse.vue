<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">SSE Stream Test</h1>
      <p class="text-gray-600">Test Server-Sent Events streaming from Lambda</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Controls -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Stream Configuration</h3>

        <div class="space-y-4">
          <!-- Event Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select v-model="eventType" class="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="message">Message (default)</option>
              <option value="counter">Counter</option>
              <option value="stock">Stock Prices</option>
              <option value="notification">Notifications</option>
              <option value="metrics">System Metrics</option>
            </select>
          </div>

          <!-- Event Count -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Number of Events: {{ eventCount }}
            </label>
            <input
              v-model.number="eventCount"
              type="range"
              min="1"
              max="50"
              class="w-full"
            />
          </div>

          <!-- Interval -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Interval: {{ interval }}ms
            </label>
            <input
              v-model.number="interval"
              type="range"
              min="100"
              max="3000"
              step="100"
              class="w-full"
            />
          </div>

          <!-- SSE URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">SSE Endpoint</label>
            <input
              v-model="sseUrl"
              type="text"
              readonly
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono bg-gray-50"
            />
            <p class="text-xs text-gray-400 mt-1">Proxied through Edge Function to Lambda Function URL</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-3 pt-2">
            <button
              @click="startStream"
              :disabled="isStreaming"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isStreaming ? 'Streaming...' : 'Start Stream' }}
            </button>
            <button
              @click="stopStream"
              :disabled="!isStreaming"
              class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop
            </button>
            <button
              @click="clearEvents"
              class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Status -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                isStreaming ? 'bg-green-500 animate-pulse' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
              ]"
            ></div>
            <span class="text-sm text-gray-600">
              {{ statusText }}
            </span>
          </div>
          <div v-if="isStreaming" class="mt-2">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">{{ receivedCount }} / {{ eventCount }} events</p>
          </div>
        </div>
      </div>

      <!-- Event Log -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">Event Log</h3>
          <span class="text-sm text-gray-500">{{ events.length }} events</span>
        </div>

        <div class="h-96 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-2 font-mono text-xs">
          <div v-if="events.length === 0" class="text-gray-400 text-center py-8">
            No events yet. Click "Start Stream" to begin.
          </div>
          <div
            v-for="(event, index) in events"
            :key="index"
            :class="[
              'p-2 mb-1 rounded',
              event.type === 'connected' ? 'bg-green-100 text-green-800' :
              event.type === 'complete' ? 'bg-blue-100 text-blue-800' :
              event.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-white border border-gray-200'
            ]"
          >
            <div class="flex justify-between items-start">
              <span class="font-semibold">{{ event.type }}</span>
              <span class="text-gray-400">{{ event.id ? `#${event.id}` : '' }}</span>
            </div>
            <pre class="mt-1 whitespace-pre-wrap break-all">{{ JSON.stringify(event.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Type Previews -->
    <div class="card mt-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Event Type Examples</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="p-3 bg-gray-50 rounded-md">
          <h4 class="font-medium text-sm text-gray-700">message</h4>
          <pre class="text-xs text-gray-500 mt-1">{ index, total, progress, message }</pre>
        </div>
        <div class="p-3 bg-gray-50 rounded-md">
          <h4 class="font-medium text-sm text-gray-700">counter</h4>
          <pre class="text-xs text-gray-500 mt-1">{ count, total, progress }</pre>
        </div>
        <div class="p-3 bg-gray-50 rounded-md">
          <h4 class="font-medium text-sm text-gray-700">stock</h4>
          <pre class="text-xs text-gray-500 mt-1">{ symbol, price, change }</pre>
        </div>
        <div class="p-3 bg-gray-50 rounded-md">
          <h4 class="font-medium text-sm text-gray-700">notification</h4>
          <pre class="text-xs text-gray-500 mt-1">{ id, message, priority }</pre>
        </div>
        <div class="p-3 bg-gray-50 rounded-md">
          <h4 class="font-medium text-sm text-gray-700">metrics</h4>
          <pre class="text-xs text-gray-500 mt-1">{ cpu, memory, requests, latency }</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SSEEvent {
  type: string
  id?: number
  data: Record<string, unknown>
}

const eventType = ref('message')
const eventCount = ref(10)
const interval = ref(1000)
const sseUrl = ref('/api/sse')
const isStreaming = ref(false)
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
const events = ref<SSEEvent[]>([])
const receivedCount = ref(0)

let eventSource: EventSource | null = null

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connecting': return 'Connecting...'
    case 'connected': return 'Connected - receiving events'
    case 'error': return 'Connection error'
    default: return 'Disconnected'
  }
})

const progress = computed(() => {
  if (eventCount.value === 0) return 0
  return Math.round((receivedCount.value / eventCount.value) * 100)
})

const startStream = () => {
  // Build URL with query params
  const baseUrl = sseUrl.value.startsWith('http')
    ? sseUrl.value
    : `${window.location.origin}${sseUrl.value}`
  const url = new URL(baseUrl)
  url.searchParams.set('type', eventType.value)
  url.searchParams.set('count', eventCount.value.toString())
  url.searchParams.set('interval', interval.value.toString())

  isStreaming.value = true
  connectionStatus.value = 'connecting'
  receivedCount.value = 0

  eventSource = new EventSource(url.toString())

  // Handle different event types
  const eventTypes = ['connected', 'message', 'counter', 'stock', 'notification', 'metrics', 'complete', 'error']

  eventTypes.forEach(type => {
    eventSource!.addEventListener(type, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        events.value.push({
          type,
          id: e.lastEventId ? parseInt(e.lastEventId) : undefined,
          data,
        })

        if (type === eventType.value) {
          receivedCount.value++
        }

        if (type === 'connected') {
          connectionStatus.value = 'connected'
        }

        if (type === 'complete' || type === 'error') {
          stopStream()
        }

        // Auto-scroll to bottom
        nextTick(() => {
          const logContainer = document.querySelector('.h-96.overflow-y-auto')
          if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight
          }
        })
      } catch (err) {
        console.error('Failed to parse SSE data:', err)
      }
    })
  })

  eventSource.onerror = () => {
    connectionStatus.value = 'error'
    stopStream()
  }
}

const stopStream = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  isStreaming.value = false
  if (connectionStatus.value !== 'error') {
    connectionStatus.value = 'disconnected'
  }
}

const clearEvents = () => {
  events.value = []
  receivedCount.value = 0
  connectionStatus.value = 'disconnected'
}

onUnmounted(() => {
  stopStream()
})

useHead({
  title: 'SSE Stream Test - Netlify Client',
})
</script>
