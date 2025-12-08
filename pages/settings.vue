<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-600">Configure your Netlify environment</p>
    </div>

    <div class="space-y-6">
      <!-- Environment Configuration -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Environment Configuration</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Environment</label>
            <select v-model="settings.environment" class="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">API URL</label>
            <input 
              v-model="settings.apiUrl" 
              type="text" 
              class="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="https://api.example.com"
            >
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">CDN Region</label>
            <select v-model="settings.cdnRegion" class="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="us-east-1">US East (Virginia)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">EU West (Ireland)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Edge Functions Configuration -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Edge Functions</h3>
        <div class="space-y-4">
          <div 
            v-for="func in edgeFunctions" 
            :key="func.name"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">{{ func.name }}</h4>
              <p class="text-sm text-gray-500">{{ func.description }}</p>
              <div class="flex items-center space-x-4 mt-2">
                <span class="text-xs text-gray-500">Path: {{ func.path }}</span>
                <span :class="[
                  'text-xs',
                  func.status === 'active' ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ func.status }}
                </span>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="func.enabled" 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Monitoring & Analytics -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Monitoring & Analytics</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900">Google Analytics</h4>
              <p class="text-sm text-gray-500">Track page views and user behavior</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="monitoring.googleAnalytics" 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900">Dynatrace RUM</h4>
              <p class="text-sm text-gray-500">Real user monitoring and performance tracking</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="monitoring.dynatrace" 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900">Quantum Metrics</h4>
              <p class="text-sm text-gray-500">Session replay and heatmap analytics</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="monitoring.quantumMetrics" 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Security</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900">CORS Protection</h4>
              <p class="text-sm text-gray-500">Enable Cross-Origin Resource Sharing protection</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="security.cors" 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900">Rate Limiting</h4>
              <p class="text-sm text-gray-500">Protect against API abuse and DDoS attacks</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="security.rateLimiting" 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900">Security Headers</h4>
              <p class="text-sm text-gray-500">Add security headers to all responses</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="security.headers" 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Save Changes -->
      <div class="flex justify-end">
        <button @click="saveSettings" class="btn-primary">
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const settings = ref({
  environment: 'development',
  apiUrl: 'https://api.dev.example.com',
  cdnRegion: 'us-east-1'
})

const edgeFunctions = ref([
  {
    name: 'security',
    description: 'Handle CORS, security headers, and rate limiting',
    path: '/*',
    status: 'active',
    enabled: true
  },
  {
    name: 'api-router',
    description: 'Route API requests to backend services',
    path: '/api/*',
    status: 'active',
    enabled: true
  },
  {
    name: 'redirects',
    description: 'Handle dynamic redirects and geo-targeting',
    path: '/*',
    status: 'active',
    enabled: true
  },
  {
    name: 'caching',
    description: 'Optimize caching for static assets',
    path: '/static/*',
    status: 'inactive',
    enabled: false
  }
])

const monitoring = ref({
  googleAnalytics: true,
  dynatrace: true,
  quantumMetrics: false
})

const security = ref({
  cors: true,
  rateLimiting: true,
  headers: true
})

const saveSettings = () => {
  console.log('Saving settings...', { settings: settings.value, monitoring: monitoring.value, security: security.value })
}

useHead({
  title: 'Settings - Netlify Client'
})
</script>