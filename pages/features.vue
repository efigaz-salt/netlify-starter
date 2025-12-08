<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Feature Flags</h1>
      <p class="text-gray-600">Manage feature flags and experiments</p>
    </div>

    <!-- LaunchDarkly Mock Interface -->
    <div class="space-y-6">
      <!-- Environment Selector -->
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700">Environment:</label>
        <select v-model="selectedEnvironment" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
          <option value="development">Development</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </div>

      <!-- Feature Flags List -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">Feature Flags</h3>
          <button class="btn-primary">Create Flag</button>
        </div>
        
        <div class="space-y-4">
          <div 
            v-for="flag in featureFlags" 
            :key="flag.id"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <h4 class="text-sm font-medium text-gray-900">{{ flag.name }}</h4>
                <span :class="[
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  flag.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                ]">
                  {{ flag.enabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ flag.description }}</p>
              <div class="flex items-center space-x-4 mt-2">
                <span class="text-xs text-gray-500">Rollout: {{ flag.rollout }}%</span>
                <span class="text-xs text-gray-500">Targeting: {{ flag.targeting }}</span>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  v-model="flag.enabled" 
                  class="sr-only peer"
                  @change="toggleFlag(flag)"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <button class="text-blue-600 hover:text-blue-800 text-sm">Configure</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Experiments Section -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">A/B Experiments</h3>
        <div class="space-y-4">
          <div 
            v-for="experiment in experiments" 
            :key="experiment.id"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">{{ experiment.name }}</h4>
              <p class="text-sm text-gray-500 mt-1">{{ experiment.description }}</p>
              <div class="flex items-center space-x-4 mt-2">
                <span class="text-xs text-gray-500">Status: {{ experiment.status }}</span>
                <span class="text-xs text-gray-500">Traffic: {{ experiment.traffic }}%</span>
                <span class="text-xs text-gray-500">Conversion: {{ experiment.conversion }}%</span>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <span :class="[
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                experiment.status === 'Running' 
                  ? 'bg-blue-100 text-blue-800' 
                  : experiment.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              ]">
                {{ experiment.status }}
              </span>
              <button class="text-blue-600 hover:text-blue-800 text-sm">View Results</button>
            </div>
          </div>
        </div>
      </div>

      <!-- User Targeting -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">User Targeting</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">{{ targeting.totalUsers.toLocaleString() }}</div>
            <div class="text-sm text-gray-500">Total Users</div>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ targeting.flaggedUsers.toLocaleString() }}</div>
            <div class="text-sm text-gray-500">Users with Flags</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ targeting.activeExperiments }}</div>
            <div class="text-sm text-gray-500">Active Experiments</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const selectedEnvironment = ref('development')

// Fetch real data from API
const { flags: rawFlags, loading: flagsLoading, refresh: refreshFlags } = useFeatureFlags(selectedEnvironment)
const { experiments: rawExperiments, loading: experimentsLoading, refresh: refreshExperiments } = useExperiments()
const { stats: targeting, loading: targetingLoading } = useTargetingStats()

// Transform API flags to template format
const featureFlags = computed(() => {
  return rawFlags.value.map(flag => ({
    id: flag.id,
    key: flag.key,
    name: flag.name,
    description: flag.description,
    enabled: flag.enabled,
    rollout: flag.rolloutPercentage,
    targeting: flag.targeting
  }))
})

// Transform API experiments to template format
const experiments = computed(() => {
  return rawExperiments.value.map(exp => ({
    id: exp.id,
    key: exp.key,
    name: exp.name,
    description: exp.description,
    status: exp.status.charAt(0).toUpperCase() + exp.status.slice(1),
    traffic: exp.trafficPercentage,
    conversion: exp.conversionRate
  }))
})

const toggleFlag = async (flag: { key: string; name: string; enabled: boolean }) => {
  try {
    await toggleFeatureFlag(flag.key, flag.enabled, selectedEnvironment.value)
    console.log(`Toggled flag ${flag.key} (${flag.name}) to ${flag.enabled}`)
  } catch (error) {
    console.error('Failed to toggle flag:', error)
    // Revert on error - refresh flags from API
    refreshFlags()
  }
}

useHead({
  title: 'Feature Flags - Netlify Client'
})
</script>