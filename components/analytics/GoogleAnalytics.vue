<template>
  <div class="space-y-6">
    <!-- Real-time Overview -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-medium text-gray-900">Real-time Overview</h4>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span class="text-sm text-gray-600">Live</span>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ realtimeData.activeUsers }}</div>
          <div class="text-sm text-gray-500">Active Users</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ realtimeData.pageviewsPerMinute }}/min</div>
          <div class="text-sm text-gray-500">Pageviews</div>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{{ realtimeData.topPage }}</div>
          <div class="text-sm text-gray-500">Top Page</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ realtimeData.topSource }}</div>
          <div class="text-sm text-gray-500">Top Source</div>
        </div>
      </div>
    </div>

    <!-- Traffic Sources -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h4 class="text-lg font-medium text-gray-900 mb-4">Traffic Sources</h4>
        <DonutChart
          :data="trafficSources"
          :colors="['#3b82f6', '#10b981', '#f59e0b', '#ef4444']"
          center-label="Sessions"
        />
      </div>
      
      <div class="card">
        <h4 class="text-lg font-medium text-gray-900 mb-4">Top Countries</h4>
        <div class="space-y-3">
          <div
            v-for="country in topCountries"
            :key="country.name"
            class="flex items-center justify-between"
          >
            <div class="flex items-center space-x-3">
              <div class="text-lg">{{ country.flag }}</div>
              <span class="text-sm font-medium text-gray-900">{{ country.name }}</span>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">{{ country.sessions.toLocaleString() }}</div>
              <div class="text-xs text-gray-500">{{ country.percentage }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Session Trends -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">Session Trends (Last 30 Days)</h4>
      <div class="h-64">
        <LineChart
          :data="sessionTrends"
          color="#3b82f6"
          :width="800"
          :height="250"
        />
      </div>
    </div>

    <!-- Behavior Flow -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">User Behavior Flow</h4>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-sm font-medium text-gray-500 border-b pb-2">
          <span>Landing Page</span>
          <span>Sessions</span>
          <span>Next Action</span>
          <span>Drop-off</span>
        </div>
        <div
          v-for="flow in behaviorFlow"
          :key="flow.page"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <span class="text-sm font-medium text-gray-900 flex-1">{{ flow.page }}</span>
          <span class="text-sm text-gray-600 w-20 text-center">{{ flow.sessions.toLocaleString() }}</span>
          <span class="text-sm text-blue-600 w-32 text-center">{{ flow.nextAction }}</span>
          <div class="w-24 text-center">
            <div class="text-sm text-red-600">{{ flow.dropoff }}%</div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-red-500 h-2 rounded-full"
                :style="{ width: `${flow.dropoff}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goals & Conversions -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">Goals & Conversions</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="goal in goals"
          :key="goal.name"
          class="p-4 border border-gray-200 rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-900">{{ goal.name }}</span>
            <span :class="[
              'text-xs px-2 py-1 rounded-full',
              goal.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]">
              {{ goal.trend === 'up' ? '↑' : '↓' }} {{ goal.change }}%
            </span>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">{{ goal.conversions.toLocaleString() }}</div>
          <div class="text-sm text-gray-500">{{ goal.rate }}% conversion rate</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DonutChart from '~/components/charts/DonutChart.vue'
import LineChart from '~/components/charts/LineChart.vue'

const realtimeData = ref({
  activeUsers: 1247,
  pageviewsPerMinute: 34,
  topPage: '/dashboard',
  topSource: 'Google'
})

const trafficSources = ref([
  { label: 'Organic Search', value: 8420 },
  { label: 'Direct', value: 5230 },
  { label: 'Social', value: 2840 },
  { label: 'Referral', value: 1510 }
])

const topCountries = ref([
  { name: 'United States', flag: '🇺🇸', sessions: 12450, percentage: 42.3 },
  { name: 'United Kingdom', flag: '🇬🇧', sessions: 5820, percentage: 19.8 },
  { name: 'Canada', flag: '🇨🇦', sessions: 3940, percentage: 13.4 },
  { name: 'Germany', flag: '🇩🇪', sessions: 2680, percentage: 9.1 },
  { name: 'France', flag: '🇫🇷', sessions: 1890, percentage: 6.4 }
])

const sessionTrends = ref(
  Array.from({ length: 30 }, (_, i) => ({
    label: `Day ${i + 1}`,
    value: Math.floor(Math.random() * 1000) + 500
  }))
)

const behaviorFlow = ref([
  { page: '/home', sessions: 15420, nextAction: 'View Product', dropoff: 15 },
  { page: '/product', sessions: 8934, nextAction: 'Add to Cart', dropoff: 35 },
  { page: '/cart', sessions: 5821, nextAction: 'Checkout', dropoff: 28 },
  { page: '/checkout', sessions: 4193, nextAction: 'Purchase', dropoff: 12 }
])

const goals = ref([
  { name: 'Newsletter Signup', conversions: 1240, rate: 8.2, trend: 'up', change: 12.4 },
  { name: 'Product Purchase', conversions: 892, rate: 3.1, trend: 'up', change: 5.7 },
  { name: 'Demo Request', conversions: 234, rate: 1.8, trend: 'down', change: 2.1 }
])

// Simulate real-time updates
onMounted(() => {
  setInterval(() => {
    realtimeData.value.activeUsers += Math.floor(Math.random() * 20) - 10
    realtimeData.value.pageviewsPerMinute = Math.floor(Math.random() * 10) + 30
  }, 3000)
})
</script>