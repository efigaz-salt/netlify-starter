<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Analytics</h1>
      <p class="text-gray-600">Detailed analytics and performance metrics</p>
    </div>

    <!-- Analytics Tabs -->
    <div class="mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Google Analytics Mock -->
    <div v-if="activeTab === 'ga'">
      <GoogleAnalytics />
    </div>

    <!-- Google Tag Manager Mock -->
    <div v-if="activeTab === 'gtm'">
      <GoogleTagManager />
    </div>

    <!-- Dynatrace Mock -->
    <div v-if="activeTab === 'dynatrace'">
      <DynatraceRUM />
    </div>

    <!-- Quantum Metrics Mock -->
    <div v-if="activeTab === 'quantum'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card">
          <h4 class="text-sm font-medium text-gray-500 mb-2">Session Replays</h4>
          <p class="text-2xl font-bold text-gray-900">{{ quantumData.sessions }}</p>
          <p class="text-sm text-blue-600">{{ quantumData.sessionsActive }} active now</p>
        </div>
        <div class="card">
          <h4 class="text-sm font-medium text-gray-500 mb-2">Heatmap Clicks</h4>
          <p class="text-2xl font-bold text-gray-900">{{ quantumData.clicks.toLocaleString() }}</p>
          <p class="text-sm text-green-600">+8.2% from yesterday</p>
        </div>
        <div class="card">
          <h4 class="text-sm font-medium text-gray-500 mb-2">User Journeys</h4>
          <p class="text-2xl font-bold text-gray-900">{{ quantumData.journeys }}</p>
          <p class="text-sm text-gray-600">{{ quantumData.journeysCompleted }} completed</p>
        </div>
      </div>
      
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">User Behavior Heatmap</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">Quantum Metrics heatmap visualization</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoogleAnalytics from '~/components/analytics/GoogleAnalytics.vue'
import GoogleTagManager from '~/components/analytics/GoogleTagManager.vue'
import DynatraceRUM from '~/components/monitoring/DynatraceRUM.vue'

const activeTab = ref('ga')

const tabs = [
  { id: 'ga', name: 'Google Analytics' },
  { id: 'gtm', name: 'Google Tag Manager' },
  { id: 'dynatrace', name: 'Dynatrace' },
  { id: 'quantum', name: 'Quantum Metrics' }
]

const gaData = ref({
  sessions: 15420,
  bounceRate: 42.3,
  avgDuration: '2:34'
})

const dynatraceData = ref({
  responseTime: 245,
  errorRate: 0.8,
  throughput: 1250,
  apdex: 0.94
})

const quantumData = ref({
  sessions: 1834,
  sessionsActive: 23,
  clicks: 45892,
  journeys: 892,
  journeysCompleted: 734
})

useHead({
  title: 'Analytics - Netlify Client'
})
</script>