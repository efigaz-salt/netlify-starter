<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Binary Content Test</h1>
        <p class="text-gray-600">
          Test binary content endpoints (images, PDFs, videos) with Salt collector
        </p>
        <div class="mt-4 flex gap-2">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            With Salt: /api/aws/binary/*
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Without Salt: /api2/binary/*
          </span>
        </div>
      </div>

      <!-- Image Tests -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Image Tests</h2>

        <!-- PNG Test -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-700 mb-2">PNG Image</h3>
          <div class="flex items-center gap-3 mb-2">
            <input
              v-model.number="pngSize"
              type="number"
              min="1"
              max="1000"
              placeholder="Size (KB)"
              class="px-3 py-2 border border-gray-300 rounded-md w-32"
            />
            <span class="text-sm text-gray-600">KB</span>
          </div>
          <div class="flex gap-3 mb-3">
            <button
              @click="testPNG('api')"
              :disabled="pngApiLoading"
              class="btn-primary disabled:opacity-50"
            >
              {{ pngApiLoading ? 'Loading...' : 'Test PNG (/api)' }}
            </button>
            <button
              @click="testPNG('api2')"
              :disabled="pngApi2Loading"
              class="btn-primary !bg-purple-600 hover:!bg-purple-700 disabled:opacity-50"
            >
              {{ pngApi2Loading ? 'Loading...' : 'Test PNG (/api2)' }}
            </button>
          </div>

          <div v-if="pngApiResult" class="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
            <p class="text-xs font-medium text-blue-700 mb-2">Result from /api:</p>
            <img v-if="pngApiResult.dataUrl" :src="pngApiResult.dataUrl" alt="PNG via API" class="mb-2" />
            <div class="text-xs text-blue-700">
              <p>Size: {{ (pngApiResult.size / 1024).toFixed(2) }} KB</p>
              <p>Content-Type: {{ pngApiResult.contentType }}</p>
              <p>Load Time: {{ pngApiResult.loadTime }}ms</p>
            </div>
          </div>

          <div v-if="pngApi2Result" class="mt-3 bg-purple-50 border border-purple-200 rounded-md p-3">
            <p class="text-xs font-medium text-purple-700 mb-2">Result from /api2:</p>
            <img v-if="pngApi2Result.dataUrl" :src="pngApi2Result.dataUrl" alt="PNG via API2" class="mb-2" />
            <div class="text-xs text-purple-700">
              <p>Size: {{ (pngApi2Result.size / 1024).toFixed(2) }} KB</p>
              <p>Content-Type: {{ pngApi2Result.contentType }}</p>
              <p>Load Time: {{ pngApi2Result.loadTime }}ms</p>
            </div>
          </div>
        </div>

        <!-- JPEG Test -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-700 mb-2">JPEG Image</h3>
          <div class="flex items-center gap-3 mb-2">
            <input
              v-model.number="jpegSize"
              type="number"
              min="1"
              max="1000"
              placeholder="Size (KB)"
              class="px-3 py-2 border border-gray-300 rounded-md w-32"
            />
            <span class="text-sm text-gray-600">KB</span>
          </div>
          <div class="flex gap-3 mb-3">
            <button
              @click="testJPEG('api')"
              :disabled="jpegApiLoading"
              class="btn-primary disabled:opacity-50"
            >
              {{ jpegApiLoading ? 'Loading...' : 'Test JPEG (/api)' }}
            </button>
            <button
              @click="testJPEG('api2')"
              :disabled="jpegApi2Loading"
              class="btn-primary !bg-purple-600 hover:!bg-purple-700 disabled:opacity-50"
            >
              {{ jpegApi2Loading ? 'Loading...' : 'Test JPEG (/api2)' }}
            </button>
          </div>

          <div v-if="jpegApiResult" class="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
            <p class="text-xs font-medium text-blue-700 mb-2">Result from /api:</p>
            <img v-if="jpegApiResult.dataUrl" :src="jpegApiResult.dataUrl" alt="JPEG via API" class="mb-2 max-w-xs" />
            <div class="text-xs text-blue-700">
              <p>Size: {{ (jpegApiResult.size / 1024).toFixed(2) }} KB</p>
              <p>Content-Type: {{ jpegApiResult.contentType }}</p>
              <p>Load Time: {{ jpegApiResult.loadTime }}ms</p>
            </div>
          </div>

          <div v-if="jpegApi2Result" class="mt-3 bg-purple-50 border border-purple-200 rounded-md p-3">
            <p class="text-xs font-medium text-purple-700 mb-2">Result from /api2:</p>
            <img v-if="jpegApi2Result.dataUrl" :src="jpegApi2Result.dataUrl" alt="JPEG via API2" class="mb-2 max-w-xs" />
            <div class="text-xs text-purple-700">
              <p>Size: {{ (jpegApi2Result.size / 1024).toFixed(2) }} KB</p>
              <p>Content-Type: {{ jpegApi2Result.contentType }}</p>
              <p>Load Time: {{ jpegApi2Result.loadTime }}ms</p>
            </div>
          </div>
        </div>
      </div>

      <!-- PDF Test -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">PDF Document Test</h2>
        <div class="flex items-center gap-3 mb-2">
          <input
            v-model.number="pdfSize"
            type="number"
            min="1"
            max="5000"
            placeholder="Size (KB)"
            class="px-3 py-2 border border-gray-300 rounded-md w-32"
          />
          <span class="text-sm text-gray-600">KB</span>
        </div>
        <div class="flex gap-3 mb-3">
          <button
            @click="testPDF('api')"
            :disabled="pdfApiLoading"
            class="btn-primary disabled:opacity-50"
          >
            {{ pdfApiLoading ? 'Loading...' : 'Test PDF (/api)' }}
          </button>
          <button
            @click="testPDF('api2')"
            :disabled="pdfApi2Loading"
            class="btn-primary !bg-purple-600 hover:!bg-purple-700 disabled:opacity-50"
          >
            {{ pdfApi2Loading ? 'Loading...' : 'Test PDF (/api2)' }}
          </button>
        </div>

        <div v-if="pdfApiResult" class="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p class="text-xs font-medium text-blue-700 mb-2">Result from /api:</p>
          <div class="text-xs text-blue-700">
            <p>Size: {{ (pdfApiResult.size / 1024).toFixed(2) }} KB</p>
            <p>Content-Type: {{ pdfApiResult.contentType }}</p>
            <p>Load Time: {{ pdfApiResult.loadTime }}ms</p>
            <a v-if="pdfApiResult.blobUrl" :href="pdfApiResult.blobUrl" download="test-api.pdf" class="text-blue-600 underline">Download PDF</a>
          </div>
        </div>

        <div v-if="pdfApi2Result" class="mt-3 bg-purple-50 border border-purple-200 rounded-md p-3">
          <p class="text-xs font-medium text-purple-700 mb-2">Result from /api2:</p>
          <div class="text-xs text-purple-700">
            <p>Size: {{ (pdfApi2Result.size / 1024).toFixed(2) }} KB</p>
            <p>Content-Type: {{ pdfApi2Result.contentType }}</p>
            <p>Load Time: {{ pdfApi2Result.loadTime }}ms</p>
            <a v-if="pdfApi2Result.blobUrl" :href="pdfApi2Result.blobUrl" download="test-api2.pdf" class="text-purple-600 underline">Download PDF</a>
          </div>
        </div>
      </div>

      <!-- Video Test -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Video Test</h2>
        <div class="flex items-center gap-3 mb-2">
          <input
            v-model.number="videoSize"
            type="number"
            min="10"
            max="10000"
            placeholder="Size (KB)"
            class="px-3 py-2 border border-gray-300 rounded-md w-32"
          />
          <span class="text-sm text-gray-600">KB</span>
        </div>
        <div class="flex gap-3 mb-3">
          <button
            @click="testVideo('api')"
            :disabled="videoApiLoading"
            class="btn-primary disabled:opacity-50"
          >
            {{ videoApiLoading ? 'Loading...' : 'Test Video (/api)' }}
          </button>
          <button
            @click="testVideo('api2')"
            :disabled="videoApi2Loading"
            class="btn-primary !bg-purple-600 hover:!bg-purple-700 disabled:opacity-50"
          >
            {{ videoApi2Loading ? 'Loading...' : 'Test Video (/api2)' }}
          </button>
        </div>

        <div v-if="videoApiResult" class="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p class="text-xs font-medium text-blue-700 mb-2">Result from /api:</p>
          <div class="text-xs text-blue-700">
            <p>Size: {{ (videoApiResult.size / 1024).toFixed(2) }} KB</p>
            <p>Content-Type: {{ videoApiResult.contentType }}</p>
            <p>Load Time: {{ videoApiResult.loadTime }}ms</p>
          </div>
        </div>

        <div v-if="videoApi2Result" class="mt-3 bg-purple-50 border border-purple-200 rounded-md p-3">
          <p class="text-xs font-medium text-purple-700 mb-2">Result from /api2:</p>
          <div class="text-xs text-purple-700">
            <p>Size: {{ (videoApi2Result.size / 1024).toFixed(2) }} KB</p>
            <p>Content-Type: {{ videoApi2Result.contentType }}</p>
            <p>Load Time: {{ videoApi2Result.loadTime }}ms</p>
          </div>
        </div>
      </div>

      <!-- ZIP Test -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">ZIP Archive Test</h2>
        <div class="flex items-center gap-3 mb-2">
          <input
            v-model.number="zipSize"
            type="number"
            min="1"
            max="5000"
            placeholder="Size (KB)"
            class="px-3 py-2 border border-gray-300 rounded-md w-32"
          />
          <span class="text-sm text-gray-600">KB</span>
        </div>
        <div class="flex gap-3 mb-3">
          <button
            @click="testZIP('api')"
            :disabled="zipApiLoading"
            class="btn-primary disabled:opacity-50"
          >
            {{ zipApiLoading ? 'Loading...' : 'Test ZIP (/api)' }}
          </button>
          <button
            @click="testZIP('api2')"
            :disabled="zipApi2Loading"
            class="btn-primary !bg-purple-600 hover:!bg-purple-700 disabled:opacity-50"
          >
            {{ zipApi2Loading ? 'Loading...' : 'Test ZIP (/api2)' }}
          </button>
        </div>

        <div v-if="zipApiResult" class="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p class="text-xs font-medium text-blue-700 mb-2">Result from /api:</p>
          <div class="text-xs text-blue-700">
            <p>Size: {{ (zipApiResult.size / 1024).toFixed(2) }} KB</p>
            <p>Content-Type: {{ zipApiResult.contentType }}</p>
            <p>Load Time: {{ zipApiResult.loadTime }}ms</p>
            <a v-if="zipApiResult.blobUrl" :href="zipApiResult.blobUrl" download="test-api.zip" class="text-blue-600 underline">Download ZIP</a>
          </div>
        </div>

        <div v-if="zipApi2Result" class="mt-3 bg-purple-50 border border-purple-200 rounded-md p-3">
          <p class="text-xs font-medium text-purple-700 mb-2">Result from /api2:</p>
          <div class="text-xs text-purple-700">
            <p>Size: {{ (zipApi2Result.size / 1024).toFixed(2) }} KB</p>
            <p>Content-Type: {{ zipApi2Result.contentType }}</p>
            <p>Load Time: {{ zipApi2Result.loadTime }}ms</p>
            <a v-if="zipApi2Result.blobUrl" :href="zipApi2Result.blobUrl" download="test-api2.zip" class="text-purple-600 underline">Download ZIP</a>
          </div>
        </div>
      </div>

      <!-- Direct AWS Test -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Direct AWS API Gateway Test</h2>
        <p class="text-sm text-gray-600 mb-4">
          Test directly against AWS API Gateway (bypassing Netlify edge functions)
        </p>
        <div class="flex gap-3">
          <button
            @click="testDirectAWS"
            :disabled="awsDirectLoading"
            class="btn-primary disabled:opacity-50"
          >
            {{ awsDirectLoading ? 'Loading...' : 'Test Direct AWS PNG' }}
          </button>
        </div>

        <div v-if="awsDirectResult" class="mt-3 bg-green-50 border border-green-200 rounded-md p-3">
          <p class="text-xs font-medium text-green-700 mb-2">Direct AWS Result:</p>
          <img v-if="awsDirectResult.dataUrl" :src="awsDirectResult.dataUrl" alt="Direct AWS" class="mb-2" />
          <div class="text-xs text-green-700">
            <p>Size: {{ (awsDirectResult.size / 1024).toFixed(2) }} KB</p>
            <p>Content-Type: {{ awsDirectResult.contentType }}</p>
            <p>Load Time: {{ awsDirectResult.loadTime }}ms</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const AWS_API_URL = 'https://vysuq98i7c.execute-api.eu-north-1.amazonaws.com/v1'

// PNG state
const pngSize = ref(10)
const pngApiLoading = ref(false)
const pngApi2Loading = ref(false)
const pngApiResult = ref(null)
const pngApi2Result = ref(null)

// JPEG state
const jpegSize = ref(50)
const jpegApiLoading = ref(false)
const jpegApi2Loading = ref(false)
const jpegApiResult = ref(null)
const jpegApi2Result = ref(null)

// PDF state
const pdfSize = ref(100)
const pdfApiLoading = ref(false)
const pdfApi2Loading = ref(false)
const pdfApiResult = ref(null)
const pdfApi2Result = ref(null)

// Video state
const videoSize = ref(100)
const videoApiLoading = ref(false)
const videoApi2Loading = ref(false)
const videoApiResult = ref(null)
const videoApi2Result = ref(null)

// ZIP state
const zipSize = ref(20)
const zipApiLoading = ref(false)
const zipApi2Loading = ref(false)
const zipApiResult = ref(null)
const zipApi2Result = ref(null)

// Direct AWS state
const awsDirectLoading = ref(false)
const awsDirectResult = ref(null)

// Helper to generate request ID
const generateRequestId = () => {
  return crypto.randomUUID()
}

// Test PNG
const testPNG = async (apiType) => {
  const isApi2 = apiType === 'api2'
  const loading = isApi2 ? pngApi2Loading : pngApiLoading
  const result = isApi2 ? pngApi2Result : pngApiResult

  loading.value = true
  result.value = null

  const startTime = Date.now()
  const requestId = generateRequestId()
  const url = `/${apiType}/binary/image/png?size=${pngSize.value}&request_id=${requestId}`

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const loadTime = Date.now() - startTime

    const reader = new FileReader()
    reader.onloadend = () => {
      if (isApi2) {
        pngApi2Result.value = {
          dataUrl: reader.result,
          size: blob.size,
          contentType: response.headers.get('content-type'),
          loadTime
        }
      } else {
        pngApiResult.value = {
          dataUrl: reader.result,
          size: blob.size,
          contentType: response.headers.get('content-type'),
          loadTime
        }
      }
    }
    reader.readAsDataURL(blob)
  } catch (error) {
    if (isApi2) {
      pngApi2Result.value = { error: error.message }
    } else {
      pngApiResult.value = { error: error.message }
    }
  } finally {
    loading.value = false
  }
}

// Test JPEG
const testJPEG = async (apiType) => {
  const isApi2 = apiType === 'api2'
  const loading = isApi2 ? jpegApi2Loading : jpegApiLoading
  const result = isApi2 ? jpegApi2Result : jpegApiResult

  loading.value = true
  result.value = null

  const startTime = Date.now()
  const requestId = generateRequestId()
  const url = `/${apiType}/binary/image/jpeg?size=${jpegSize.value}&request_id=${requestId}`

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const loadTime = Date.now() - startTime

    const reader = new FileReader()
    reader.onloadend = () => {
      if (isApi2) {
        jpegApi2Result.value = {
          dataUrl: reader.result,
          size: blob.size,
          contentType: response.headers.get('content-type'),
          loadTime
        }
      } else {
        jpegApiResult.value = {
          dataUrl: reader.result,
          size: blob.size,
          contentType: response.headers.get('content-type'),
          loadTime
        }
      }
    }
    reader.readAsDataURL(blob)
  } catch (error) {
    if (isApi2) {
      jpegApi2Result.value = { error: error.message }
    } else {
      jpegApiResult.value = { error: error.message }
    }
  } finally {
    loading.value = false
  }
}

// Test PDF
const testPDF = async (apiType) => {
  const isApi2 = apiType === 'api2'
  const loading = isApi2 ? pdfApi2Loading : pdfApiLoading
  const result = isApi2 ? pdfApi2Result : pdfApiResult

  loading.value = true
  result.value = null

  const startTime = Date.now()
  const requestId = generateRequestId()
  const url = `/${apiType}/binary/pdf?size=${pdfSize.value}&request_id=${requestId}`

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const loadTime = Date.now() - startTime
    const blobUrl = URL.createObjectURL(blob)

    if (isApi2) {
      pdfApi2Result.value = {
        blobUrl,
        size: blob.size,
        contentType: response.headers.get('content-type'),
        loadTime
      }
    } else {
      pdfApiResult.value = {
        blobUrl,
        size: blob.size,
        contentType: response.headers.get('content-type'),
        loadTime
      }
    }
  } catch (error) {
    if (isApi2) {
      pdfApi2Result.value = { error: error.message }
    } else {
      pdfApiResult.value = { error: error.message }
    }
  } finally {
    loading.value = false
  }
}

// Test Video
const testVideo = async (apiType) => {
  const isApi2 = apiType === 'api2'
  const loading = isApi2 ? videoApi2Loading : videoApiLoading
  const result = isApi2 ? videoApi2Result : videoApiResult

  loading.value = true
  result.value = null

  const startTime = Date.now()
  const requestId = generateRequestId()
  const url = `/${apiType}/binary/video?size=${videoSize.value}&request_id=${requestId}`

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const loadTime = Date.now() - startTime

    if (isApi2) {
      videoApi2Result.value = {
        size: blob.size,
        contentType: response.headers.get('content-type'),
        loadTime
      }
    } else {
      videoApiResult.value = {
        size: blob.size,
        contentType: response.headers.get('content-type'),
        loadTime
      }
    }
  } catch (error) {
    if (isApi2) {
      videoApi2Result.value = { error: error.message }
    } else {
      videoApiResult.value = { error: error.message }
    }
  } finally {
    loading.value = false
  }
}

// Test ZIP
const testZIP = async (apiType) => {
  const isApi2 = apiType === 'api2'
  const loading = isApi2 ? zipApi2Loading : zipApiLoading
  const result = isApi2 ? zipApi2Result : zipApiResult

  loading.value = true
  result.value = null

  const startTime = Date.now()
  const requestId = generateRequestId()
  const url = `/${apiType}/binary/zip?size=${zipSize.value}&request_id=${requestId}`

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const loadTime = Date.now() - startTime
    const blobUrl = URL.createObjectURL(blob)

    if (isApi2) {
      zipApi2Result.value = {
        blobUrl,
        size: blob.size,
        contentType: response.headers.get('content-type'),
        loadTime
      }
    } else {
      zipApiResult.value = {
        blobUrl,
        size: blob.size,
        contentType: response.headers.get('content-type'),
        loadTime
      }
    }
  } catch (error) {
    if (isApi2) {
      zipApi2Result.value = { error: error.message }
    } else {
      zipApiResult.value = { error: error.message }
    }
  } finally {
    loading.value = false
  }
}

// Test direct AWS
const testDirectAWS = async () => {
  awsDirectLoading.value = true
  awsDirectResult.value = null

  const startTime = Date.now()
  const url = `${AWS_API_URL}/binary/image/png?size=10`

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const loadTime = Date.now() - startTime

    const reader = new FileReader()
    reader.onloadend = () => {
      awsDirectResult.value = {
        dataUrl: reader.result,
        size: blob.size,
        contentType: response.headers.get('content-type'),
        loadTime
      }
    }
    reader.readAsDataURL(blob)
  } catch (error) {
    awsDirectResult.value = { error: error.message }
  } finally {
    awsDirectLoading.value = false
  }
}

useHead({
  title: 'Binary Content Test - Netlify Client'
})
</script>

<style scoped>
.btn-primary {
  @apply px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors;
}
</style>
