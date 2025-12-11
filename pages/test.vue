<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">API Test Console</h1>
      <p class="text-gray-600">Test backend API response times and large payloads</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Delay Test -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Delay Test</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test API response with configurable delay (max 2 minutes)
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Delay (seconds)
            </label>
            <input
              v-model.number="delaySeconds"
              type="number"
              min="0"
              max="120"
              step="1"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p class="text-xs text-gray-400 mt-1">0-120 seconds</p>
          </div>

          <div class="flex items-center space-x-3">
            <button
              @click="runDelayTest"
              :disabled="delayLoading"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ delayLoading ? 'Running...' : 'Run Delay Test' }}
            </button>
            <span v-if="delayLoading" class="text-sm text-gray-500">
              Waiting {{ elapsedTime }}s...
            </span>
          </div>

          <!-- Results -->
          <div v-if="delayResult || delayError" class="mt-4">
            <div v-if="delayError" class="bg-red-50 border border-red-200 rounded-md p-3">
              <p class="text-sm text-red-700">{{ delayError }}</p>
            </div>
            <div v-else-if="delayResult" class="bg-green-50 border border-green-200 rounded-md p-3">
              <p class="text-sm font-medium text-green-800 mb-2">Success!</p>
              <div class="text-xs text-green-700 space-y-1">
                <p>Requested delay: {{ delayResult.requestedDelayMs }}ms</p>
                <p>Actual delay: {{ delayResult.actualDelayMs }}ms</p>
                <p>Total round-trip: {{ delayResult.roundTrip }}ms</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Large Response Test -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Large Response Test</h3>
        <p class="text-sm text-gray-500 mb-4">
          Test API response with large payload size
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Response Size (MB)
            </label>
            <input
              v-model.number="responseSizeMB"
              type="number"
              min="0.1"
              max="50"
              step="0.5"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p class="text-xs text-gray-400 mt-1">
              0.1-50 MB (Lambda response limit ~5.5MB)
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Method
            </label>
            <select
              v-model="largeMethod"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div class="flex items-center space-x-3">
            <button
              @click="runLargeTest"
              :disabled="largeLoading"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ largeLoading ? 'Loading...' : 'Run Large Response Test' }}
            </button>
            <button
              @click="runLargeTest2"
              :disabled="largeLoading"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ largeLoading ? 'Loading...' : 'Test /larges/newone Redirect' }}
            </button>
          </div>

          <!-- Results -->
          <div v-if="largeResult || largeError" class="mt-4">
            <div v-if="largeError" class="bg-red-50 border border-red-200 rounded-md p-3">
              <p class="text-sm text-red-700">{{ largeError }}</p>
            </div>
            <div v-else-if="largeResult" class="bg-green-50 border border-green-200 rounded-md p-3">
              <p class="text-sm font-medium text-green-800 mb-2">Success!</p>
              <div class="text-xs text-green-700 space-y-1">
                <p>Requested size: {{ largeResult.requestedSizeMB }} MB</p>
                <p>Actual size: {{ largeResult.actualSizeMB?.toFixed(2) }} MB</p>
                <p>Item count: {{ largeResult.itemCount?.toLocaleString() }}</p>
                <p>Generation time: {{ largeResult.generationTimeMs }}ms</p>
                <p>Total round-trip: {{ largeResult.roundTrip }}ms</p>
                <p v-if="largeResult.note" class="text-yellow-700">
                  Note: {{ largeResult.note }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Echo Test -->
    <div class="card mt-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Echo Test</h3>
      <p class="text-sm text-gray-500 mb-4">
        Echo back request details to verify API routing
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Query Parameters
          </label>
          <input
            v-model="echoQuery"
            type="text"
            placeholder="key=value&foo=bar"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Request Body (JSON)
          </label>
          <input
            v-model="echoBody"
            type="text"
            placeholder='{"message": "hello"}'
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div class="flex items-center space-x-3 mt-4">
        <button
          @click="runEchoTest('GET')"
          :disabled="echoLoading"
          class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
        >
          GET
        </button>
        <button
          @click="runEchoTest('POST')"
          :disabled="echoLoading"
          class="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
        >
          POST
        </button>
      </div>

      <!-- Echo Results -->
      <div v-if="echoResult" class="mt-4 bg-gray-50 border border-gray-200 rounded-md p-3">
        <pre class="text-xs text-gray-700 overflow-x-auto">{{ JSON.stringify(echoResult, null, 2) }}</pre>
      </div>
    </div>

    <!-- Status Code Test -->
    <div class="card mt-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Status Code Test</h3>
      <p class="text-sm text-gray-500 mb-4">
        Request specific HTTP status codes
      </p>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="code in statusCodes"
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

      <!-- Status Results -->
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
  </div>
</template>

<script setup lang="ts">
const delaySeconds = ref(5)
const delayLoading = ref(false)
const delayResult = ref<{ requestedDelayMs: number; actualDelayMs: number; roundTrip: number } | null>(null)
const delayError = ref<string | null>(null)
const elapsedTime = ref(0)
let elapsedInterval: ReturnType<typeof setInterval> | null = null

const responseSizeMB = ref(1)
const largeMethod = ref('GET')
const largeLoading = ref(false)
const largeResult = ref<{
  requestedSizeMB: number
  actualSizeMB: number
  itemCount: number
  generationTimeMs: number
  roundTrip: number
  note?: string
} | null>(null)
const largeError = ref<string | null>(null)

const echoQuery = ref('')
const echoBody = ref('')
const echoLoading = ref(false)
const echoResult = ref<Record<string, unknown> | null>(null)

const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503, 504]
const statusResult = ref<{ status: number; data: Record<string, unknown> } | null>(null)

const runDelayTest = async () => {
  delayLoading.value = true
  delayResult.value = null
  delayError.value = null
  elapsedTime.value = 0

  // Start elapsed timer
  elapsedInterval = setInterval(() => {
    elapsedTime.value++
  }, 1000)

  const startTime = Date.now()

  try {
    const response = await $fetch<{
      success: boolean
      requestedDelayMs: number
      actualDelayMs: number
    }>(`/api/test/delay?delay=${delaySeconds.value * 1000}`)

    const roundTrip = Date.now() - startTime

    delayResult.value = {
      requestedDelayMs: response.requestedDelayMs,
      actualDelayMs: response.actualDelayMs,
      roundTrip,
    }
  } catch (e) {
    delayError.value = e instanceof Error ? e.message : 'Request failed'
  } finally {
    delayLoading.value = false
    if (elapsedInterval) {
      clearInterval(elapsedInterval)
      elapsedInterval = null
    }
  }
}

const runLargeTest = async () => {
  largeLoading.value = true
  largeResult.value = null
  largeError.value = null

  const startTime = Date.now()

  try {
    const url = `/api/test/large?size=${responseSizeMB.value}`
    const options: Parameters<typeof $fetch>[1] = {
      method: largeMethod.value as 'GET' | 'POST',
    }

    if (largeMethod.value === 'POST') {
      options.body = { size: responseSizeMB.value }
    }

    const response = await $fetch<{
      requestedSizeMB: number
      actualSizeMB: number
      itemCount: number
      generationTimeMs: number
      note?: string
    }>(url, options)

    const roundTrip = Date.now() - startTime

    largeResult.value = {
      requestedSizeMB: response.requestedSizeMB,
      actualSizeMB: response.actualSizeMB,
      itemCount: response.itemCount,
      generationTimeMs: response.generationTimeMs,
      roundTrip,
      note: response.note || undefined,
    }
  } catch (e) {
    largeError.value = e instanceof Error ? e.message : 'Request failed'
  } finally {
    largeLoading.value = false
  }
}

const runLargeTest2 = async () => {
  largeLoading.value = true
  largeResult.value = null
  largeError.value = null

  const startTime = Date.now()

  try {
    const url = `/api/larges/newone?size=${responseSizeMB.value}`
    const options: Parameters<typeof $fetch>[1] = {
      method: largeMethod.value as 'GET' | 'POST',
    }

    if (largeMethod.value === 'POST') {
      options.body = { size: responseSizeMB.value }
    }

    const response = await $fetch<{
      requestedSizeMB: number
      actualSizeMB: number
      itemCount: number
      generationTimeMs: number
      note?: string
    }>(url, options)

    const roundTrip = Date.now() - startTime

    largeResult.value = {
      requestedSizeMB: response.requestedSizeMB,
      actualSizeMB: response.actualSizeMB,
      itemCount: response.itemCount,
      generationTimeMs: response.generationTimeMs,
      roundTrip,
      note: response.note ? `[via /larges/newone redirect] ${response.note}` : '[via /larges/newone redirect]',
    }
  } catch (e) {
    largeError.value = e instanceof Error ? e.message : 'Request failed'
  } finally {
    largeLoading.value = false
  }
}

const runEchoTest = async (method: 'GET' | 'POST') => {
  echoLoading.value = true
  echoResult.value = null

  try {
    const queryString = echoQuery.value ? `?${echoQuery.value}` : ''
    const url = `/api/test/echo${queryString}`

    const options: Parameters<typeof $fetch>[1] = { method }

    if (method === 'POST' && echoBody.value) {
      try {
        options.body = JSON.parse(echoBody.value)
      } catch {
        options.body = echoBody.value
      }
    }

    echoResult.value = await $fetch(url, options)
  } catch (e) {
    echoResult.value = { error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    echoLoading.value = false
  }
}

const runStatusTest = async (code: number) => {
  statusResult.value = null

  try {
    const response = await $fetch<Record<string, unknown>>(`/api/test/status/${code}`, {
      ignoreResponseError: true,
    })
    statusResult.value = { status: code, data: response }
  } catch (e) {
    statusResult.value = {
      status: code,
      data: { error: e instanceof Error ? e.message : 'Request failed' },
    }
  }
}

onUnmounted(() => {
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
  }
})

useHead({
  title: 'API Test Console - Netlify Client',
})
</script>
