<template>
  <div class="space-y-6">
    <!-- Container Overview -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-medium text-gray-900">Container Overview</h4>
        <div class="flex items-center space-x-3">
          <select v-model="selectedContainer" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option v-for="container in containers" :key="container.id" :value="container.id">
              {{ container.name }}
            </option>
          </select>
          <button class="btn-primary">Publish</button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ currentContainer?.tags.length || 0 }}</div>
          <div class="text-sm text-gray-500">Tags</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ currentContainer?.triggers.length || 0 }}</div>
          <div class="text-sm text-gray-500">Triggers</div>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{{ currentContainer?.variables.length || 0 }}</div>
          <div class="text-sm text-gray-500">Variables</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ currentContainer?.status === 'published' ? 'Live' : 'Draft' }}</div>
          <div class="text-sm text-gray-500">Status</div>
        </div>
      </div>
    </div>

    <!-- Tags Management -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-medium text-gray-900">Tags</h4>
        <button class="btn-primary">+ New Tag</button>
      </div>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between text-sm font-medium text-gray-500 border-b pb-2">
          <span>Tag Name</span>
          <span>Type</span>
          <span>Trigger</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div
          v-for="tag in currentContainer?.tags || []"
          :key="tag.id"
          class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div class="flex-1">
            <div class="font-medium text-gray-900">{{ tag.name }}</div>
            <div class="text-sm text-gray-500">{{ tag.description }}</div>
          </div>
          <div class="w-32 text-center">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {{ tag.type }}
            </span>
          </div>
          <div class="w-32 text-center text-sm text-gray-600">{{ tag.trigger }}</div>
          <div class="w-20 text-center">
            <span :class="[
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              tag.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            ]">
              {{ tag.status }}
            </span>
          </div>
          <div class="w-24 text-center space-x-2">
            <button class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
            <button class="text-red-600 hover:text-red-800 text-sm">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- DataLayer Activity -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">DataLayer Activity (Live)</h4>
      <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
        <div
          v-for="(event, index) in dataLayerEvents"
          :key="index"
          class="mb-2"
        >
          <span class="text-gray-500">{{ event.timestamp }}</span>
          <span class="text-blue-400 ml-2">{{ event.event }}</span>
          <span class="text-white ml-2">{{ JSON.stringify(event.data) }}</span>
        </div>
      </div>
    </div>

    <!-- Triggers -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-medium text-gray-900">Triggers</h4>
          <button class="btn-secondary">+ New Trigger</button>
        </div>
        
        <div class="space-y-3">
          <div
            v-for="trigger in currentContainer?.triggers || []"
            :key="trigger.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ trigger.name }}</div>
              <div class="text-sm text-gray-500">{{ trigger.condition }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">{{ trigger.fires }}</div>
              <div class="text-xs text-gray-500">fires today</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Variables -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-medium text-gray-900">Variables</h4>
          <button class="btn-secondary">+ New Variable</button>
        </div>
        
        <div class="space-y-3">
          <div
            v-for="variable in currentContainer?.variables || []"
            :key="variable.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ variable.name }}</div>
              <div class="text-sm text-gray-500">{{ variable.type }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">{{ variable.value }}</div>
              <div class="text-xs text-gray-500">current value</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Version History -->
    <div class="card">
      <h4 class="text-lg font-medium text-gray-900 mb-4">Version History</h4>
      <div class="space-y-3">
        <div
          v-for="version in versionHistory"
          :key="version.id"
          class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
        >
          <div class="flex items-center space-x-4">
            <div class="text-lg font-bold text-gray-900">v{{ version.number }}</div>
            <div>
              <div class="font-medium text-gray-900">{{ version.name }}</div>
              <div class="text-sm text-gray-500">{{ version.description }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-900">{{ version.publishedBy }}</div>
            <div class="text-xs text-gray-500">{{ version.publishedAt }}</div>
          </div>
          <div class="flex space-x-2">
            <button class="text-blue-600 hover:text-blue-800 text-sm">Preview</button>
            <button v-if="!version.current" class="text-green-600 hover:text-green-800 text-sm">Restore</button>
            <span v-else class="text-green-600 text-sm font-medium">Current</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const selectedContainer = ref('GTM-ABC123')

const containers = ref([
  { id: 'GTM-ABC123', name: 'Netlify Client - Production' },
  { id: 'GTM-DEF456', name: 'Netlify Client - Staging' },
  { id: 'GTM-GHI789', name: 'Netlify Client - Development' }
])

const containerData = ref({
  'GTM-ABC123': {
    tags: [
      { id: 1, name: 'GA4 Configuration', type: 'GA4', trigger: 'All Pages', status: 'active', description: 'Main Google Analytics tracking' },
      { id: 2, name: 'Purchase Event', type: 'GA4 Event', trigger: 'Purchase', status: 'active', description: 'Track purchase conversions' },
      { id: 3, name: 'Newsletter Signup', type: 'GA4 Event', trigger: 'Form Submit', status: 'active', description: 'Track newsletter subscriptions' },
      { id: 4, name: 'Button Clicks', type: 'GA4 Event', trigger: 'Click - CTA', status: 'paused', description: 'Track CTA button interactions' }
    ],
    triggers: [
      { id: 1, name: 'All Pages', condition: 'Page View', fires: 15420 },
      { id: 2, name: 'Purchase Complete', condition: 'Custom Event - purchase', fires: 234 },
      { id: 3, name: 'Newsletter Form', condition: 'Form Submission', fires: 892 },
      { id: 4, name: 'CTA Buttons', condition: 'Click - Class contains "cta"', fires: 2340 }
    ],
    variables: [
      { id: 1, name: 'GA4 Measurement ID', type: 'Constant', value: 'G-XXXXXXXXXX' },
      { id: 2, name: 'Page Title', type: 'Built-in', value: 'Dashboard - Netlify Client' },
      { id: 3, name: 'User ID', type: 'Data Layer Variable', value: 'user_12345' },
      { id: 4, name: 'Environment', type: 'Constant', value: 'production' }
    ],
    status: 'published'
  }
})

const currentContainer = computed(() => containerData.value[selectedContainer.value])

const dataLayerEvents = ref([
  { timestamp: '14:23:45', event: 'page_view', data: { page_title: 'Dashboard', page_location: '/dashboard' } },
  { timestamp: '14:23:50', event: 'click', data: { element: 'nav_analytics', text: 'Analytics' } },
  { timestamp: '14:24:12', event: 'scroll', data: { scroll_depth: 25 } },
  { timestamp: '14:24:18', event: 'user_engagement', data: { engagement_time_msec: 30000 } }
])

const versionHistory = ref([
  { id: 1, number: 12, name: 'Added Purchase Tracking', description: 'Enhanced e-commerce tracking with GA4', publishedBy: 'john.doe@example.com', publishedAt: '2 hours ago', current: true },
  { id: 2, number: 11, name: 'Newsletter Signup Events', description: 'Added form submission tracking', publishedBy: 'jane.smith@example.com', publishedAt: '1 day ago', current: false },
  { id: 3, number: 10, name: 'Button Click Optimization', description: 'Improved CTA tracking accuracy', publishedBy: 'mike.wilson@example.com', publishedAt: '3 days ago', current: false }
])

// Simulate real-time dataLayer events
onMounted(() => {
  setInterval(() => {
    const events = ['scroll', 'click', 'user_engagement', 'page_view']
    const randomEvent = events[Math.floor(Math.random() * events.length)]
    const now = new Date()
    
    dataLayerEvents.value.unshift({
      timestamp: now.toTimeString().split(' ')[0],
      event: randomEvent,
      data: { random_value: Math.floor(Math.random() * 100) }
    })
    
    // Keep only last 10 events
    if (dataLayerEvents.value.length > 10) {
      dataLayerEvents.value = dataLayerEvents.value.slice(0, 10)
    }
  }, 5000)
})
</script>