<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600">Overview of your Netlify environment</p>
    </div>

    <!-- Loading State -->
    <div v-if="statsLoading" class="mb-8 text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      <p class="text-gray-500 mt-2">Loading dashboard data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="statsError" class="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600">Failed to load dashboard data: {{ statsError }}</p>
      <button @click="refreshStats" class="mt-2 text-blue-600 hover:underline">Try again</button>
    </div>

    <!-- Stats Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Page Views</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats?.pageViews?.toLocaleString() || '0' }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Users</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats?.users?.toLocaleString() || '0' }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 rounded-lg">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Edge Functions</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats?.edgeFunctions || '0' }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">API Calls</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats?.apiCalls?.toLocaleString() || '0' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Traffic Chart -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Traffic Overview</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">Chart.js visualization will go here</p>
        </div>
      </div>
      
      <!-- Performance Chart -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">Performance chart will go here</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      <div class="space-y-4">
        <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start space-x-3">
          <div class="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
          <div class="flex-1">
            <p class="text-sm text-gray-900">{{ activity.message }}</p>
            <p class="text-xs text-gray-500">{{ activity.timestamp }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Fetch real data from API
const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useDashboardStats()
const { activity: recentActivity, loading: activityLoading, refresh: refreshActivity } = useRecentActivity()

// Auto-refresh every 30 seconds
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

onMounted(() => {
  refreshInterval.value = setInterval(() => {
    refreshStats()
    refreshActivity()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

useHead({
  title: 'Dashboard - Netlify Client'
})
</script>