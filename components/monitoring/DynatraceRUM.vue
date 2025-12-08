<template>
  <div class="space-y-6">
    <!-- Performance Overview -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">Real User Monitoring Overview</h4>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ performanceMetrics.responseTime }}ms</div>
          <div class="text-sm text-gray-500">Avg Response Time</div>
          <div class="text-xs text-green-600 mt-1">-15ms from last hour</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ performanceMetrics.errorRate }}%</div>
          <div class="text-sm text-gray-500">Error Rate</div>
          <div class="text-xs text-green-600 mt-1">-0.2% from last hour</div>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{{ performanceMetrics.throughput }}/min</div>
          <div class="text-sm text-gray-500">Throughput</div>
          <div class="text-xs text-green-600 mt-1">+125/min from last hour</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ performanceMetrics.apdex }}</div>
          <div class="text-sm text-gray-500">Apdex Score</div>
          <div class="text-xs text-green-600 mt-1">+0.05 from last hour</div>
        </div>
      </div>
    </div>

    <!-- Performance Timeline -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">Performance Timeline</h4>
      <div class="h-64">
        <LineChart
          :data="performanceTimeline"
          color="#ef4444"
          :width="800"
          :height="250"
        />
      </div>
    </div>

    <!-- User Journey Analysis -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">User Journey Analysis</h4>
      <div class="space-y-4">
        <!-- Journey Flow -->
        <div class="flex items-center justify-between text-sm font-medium text-gray-500 border-b pb-2">
          <span>Step</span>
          <span>Page</span>
          <span>Users</span>
          <span>Avg Time</span>
          <span>Drop-off Rate</span>
          <span>Performance Issues</span>
        </div>
        
        <div
          v-for="(step, index) in userJourney"
          :key="index"
          class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div class="w-12 text-center">
            <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
              {{ index + 1 }}
            </div>
          </div>
          <div class="flex-1 px-4">
            <div class="font-medium text-gray-900">{{ step.page }}</div>
            <div class="text-sm text-gray-500">{{ step.url }}</div>
          </div>
          <div class="w-24 text-center">
            <div class="font-medium text-gray-900">{{ step.users.toLocaleString() }}</div>
          </div>
          <div class="w-24 text-center">
            <div class="font-medium text-gray-900">{{ step.avgTime }}</div>
          </div>
          <div class="w-24 text-center">
            <div :class="[
              'font-medium',
              step.dropoffRate > 30 ? 'text-red-600' : step.dropoffRate > 15 ? 'text-yellow-600' : 'text-green-600'
            ]">
              {{ step.dropoffRate }}%
            </div>
          </div>
          <div class="w-32 text-center">
            <div class="flex justify-center space-x-1">
              <div
                v-if="step.slowLoading"
                class="w-3 h-3 bg-red-400 rounded-full"
                title="Slow loading"
              ></div>
              <div
                v-if="step.jsErrors"
                class="w-3 h-3 bg-orange-400 rounded-full"
                title="JavaScript errors"
              ></div>
              <div
                v-if="step.networkIssues"
                class="w-3 h-3 bg-yellow-400 rounded-full"
                title="Network issues"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Analysis -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h4 class="text-lg font-medium text-gray-900 mb-4">Top Errors</h4>
        <div class="space-y-3">
          <div
            v-for="error in topErrors"
            :key="error.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ error.message }}</div>
              <div class="text-sm text-gray-500">{{ error.location }}</div>
            </div>
            <div class="text-right">
              <div class="font-medium text-red-600">{{ error.count }}</div>
              <div class="text-xs text-gray-500">occurrences</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h4 class="text-lg font-medium text-gray-900 mb-4">Browser Performance</h4>
        <div class="space-y-3">
          <div
            v-for="browser in browserPerformance"
            :key="browser.name"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div class="text-lg">{{ browser.icon }}</div>
              <div>
                <div class="font-medium text-gray-900">{{ browser.name }}</div>
                <div class="text-sm text-gray-500">{{ browser.version }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-medium text-gray-900">{{ browser.avgTime }}ms</div>
              <div class="text-xs text-gray-500">{{ browser.users }} users</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Network Performance -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">Network Performance by Region</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="region in networkRegions"
          :key="region.name"
          class="p-4 border border-gray-200 rounded-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <span class="text-lg">{{ region.flag }}</span>
              <span class="font-medium text-gray-900">{{ region.name }}</span>
            </div>
            <span :class="[
              'text-xs px-2 py-1 rounded-full',
              region.status === 'good' ? 'bg-green-100 text-green-800' :
              region.status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            ]">
              {{ region.status }}
            </span>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Latency:</span>
              <span class="font-medium">{{ region.latency }}ms</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Throughput:</span>
              <span class="font-medium">{{ region.throughput }} Mbps</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Packet Loss:</span>
              <span class="font-medium">{{ region.packetLoss }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Alerts -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">Active Performance Alerts</h4>
      <div class="space-y-3">
        <div
          v-for="alert in performanceAlerts"
          :key="alert.id"
          :class="[
            'flex items-center justify-between p-4 rounded-lg border-l-4',
            alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
            alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          ]"
        >
          <div class="flex items-center space-x-3">
            <div :class="[
              'w-3 h-3 rounded-full',
              alert.severity === 'critical' ? 'bg-red-500' :
              alert.severity === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            ]"></div>
            <div>
              <div class="font-medium text-gray-900">{{ alert.title }}</div>
              <div class="text-sm text-gray-600">{{ alert.description }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-500">{{ alert.timestamp }}</div>
            <button class="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LineChart from '~/components/charts/LineChart.vue'

const performanceMetrics = ref({
  responseTime: 245,
  errorRate: 0.8,
  throughput: 1250,
  apdex: 0.94
})

const performanceTimeline = ref(
  Array.from({ length: 24 }, (_, i) => ({
    label: `${i}:00`,
    value: Math.floor(Math.random() * 200) + 200
  }))
)

const userJourney = ref([
  { 
    page: 'Home Page', 
    url: '/', 
    users: 15420, 
    avgTime: '2:34', 
    dropoffRate: 12,
    slowLoading: false,
    jsErrors: false,
    networkIssues: false
  },
  { 
    page: 'Product Listing', 
    url: '/products', 
    users: 13569, 
    avgTime: '3:45', 
    dropoffRate: 18,
    slowLoading: true,
    jsErrors: false,
    networkIssues: false
  },
  { 
    page: 'Product Details', 
    url: '/product/123', 
    users: 11127, 
    avgTime: '4:12', 
    dropoffRate: 25,
    slowLoading: false,
    jsErrors: true,
    networkIssues: false
  },
  { 
    page: 'Shopping Cart', 
    url: '/cart', 
    users: 8345, 
    avgTime: '1:58', 
    dropoffRate: 35,
    slowLoading: false,
    jsErrors: false,
    networkIssues: true
  },
  { 
    page: 'Checkout', 
    url: '/checkout', 
    users: 5424, 
    avgTime: '5:23', 
    dropoffRate: 15,
    slowLoading: true,
    jsErrors: true,
    networkIssues: false
  }
])

const topErrors = ref([
  { id: 1, message: 'TypeError: Cannot read property of undefined', location: '/js/app.js:245', count: 142 },
  { id: 2, message: 'Network request failed', location: '/api/products', count: 89 },
  { id: 3, message: 'ReferenceError: gtag is not defined', location: '/analytics.js:12', count: 67 },
  { id: 4, message: 'ChunkLoadError: Loading chunk failed', location: 'webpack', count: 34 }
])

const browserPerformance = ref([
  { name: 'Chrome', version: '118.0', icon: '🔵', avgTime: 234, users: '8.2k' },
  { name: 'Safari', version: '17.0', icon: '🟦', avgTime: 267, users: '4.1k' },
  { name: 'Firefox', version: '119.0', icon: '🟠', avgTime: 298, users: '2.3k' },
  { name: 'Edge', version: '118.0', icon: '🔷', avgTime: 245, users: '1.8k' }
])

const networkRegions = ref([
  { name: 'US East', flag: '🇺🇸', latency: 45, throughput: 125, packetLoss: 0.1, status: 'good' },
  { name: 'EU West', flag: '🇪🇺', latency: 89, throughput: 98, packetLoss: 0.3, status: 'fair' },
  { name: 'Asia Pacific', flag: '🌏', latency: 156, throughput: 76, packetLoss: 0.8, status: 'poor' }
])

const performanceAlerts = ref([
  { 
    id: 1, 
    title: 'High Response Time', 
    description: 'API response time exceeded 500ms threshold', 
    severity: 'critical', 
    timestamp: '5 min ago' 
  },
  { 
    id: 2, 
    title: 'JavaScript Error Spike', 
    description: 'Error rate increased by 40% in the last hour', 
    severity: 'warning', 
    timestamp: '12 min ago' 
  },
  { 
    id: 3, 
    title: 'Memory Usage Alert', 
    description: 'Client-side memory usage approaching limits', 
    severity: 'info', 
    timestamp: '25 min ago' 
  }
])

// Simulate real-time updates
onMounted(() => {
  setInterval(() => {
    performanceMetrics.value.responseTime += Math.floor(Math.random() * 20) - 10
    performanceMetrics.value.errorRate = Math.max(0, performanceMetrics.value.errorRate + (Math.random() * 0.2) - 0.1)
    performanceMetrics.value.throughput += Math.floor(Math.random() * 100) - 50
    performanceMetrics.value.apdex = Math.min(1, Math.max(0, performanceMetrics.value.apdex + (Math.random() * 0.02) - 0.01))
  }, 5000)
})
</script>