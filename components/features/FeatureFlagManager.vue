<template>
  <div class="space-y-6">
    <!-- Advanced Feature Flag Toggle -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h4 class="text-lg font-medium text-gray-900">{{ flag.name }}</h4>
          <p class="text-sm text-gray-500">{{ flag.description }}</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            v-model="flag.enabled" 
            class="sr-only peer"
            @change="toggleFlag"
          >
          <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <!-- Rollout Strategy -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Rollout Strategy</label>
          <select v-model="flag.rolloutStrategy" class="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="percentage">Percentage Rollout</option>
            <option value="user-groups">User Groups</option>
            <option value="geographic">Geographic Targeting</option>
            <option value="custom">Custom Rules</option>
          </select>
        </div>

        <!-- Percentage Rollout -->
        <div v-if="flag.rolloutStrategy === 'percentage'" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rollout Percentage</label>
            <div class="flex items-center space-x-3">
              <input
                v-model="flag.rolloutPercentage"
                type="range"
                min="0"
                max="100"
                class="flex-1"
              >
              <span class="text-sm font-medium text-gray-900 w-12">{{ flag.rolloutPercentage }}%</span>
            </div>
            <div class="mt-2 bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${flag.rolloutPercentage}%` }"
              ></div>
            </div>
          </div>
          <div class="text-sm text-gray-500">
            Estimated users affected: {{ Math.floor(totalUsers * flag.rolloutPercentage / 100).toLocaleString() }}
          </div>
        </div>

        <!-- User Groups -->
        <div v-if="flag.rolloutStrategy === 'user-groups'" class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">Target User Groups</label>
          <div class="space-y-2">
            <label
              v-for="group in userGroups"
              :key="group.id"
              class="flex items-center space-x-2"
            >
              <input
                type="checkbox"
                :value="group.id"
                v-model="flag.targetGroups"
                class="rounded border-gray-300"
              >
              <span class="text-sm">{{ group.name }}</span>
              <span class="text-xs text-gray-500">({{ group.users.toLocaleString() }} users)</span>
            </label>
          </div>
        </div>

        <!-- Geographic Targeting -->
        <div v-if="flag.rolloutStrategy === 'geographic'" class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">Target Regions</label>
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="region in regions"
              :key="region.code"
              class="flex items-center space-x-2"
            >
              <input
                type="checkbox"
                :value="region.code"
                v-model="flag.targetRegions"
                class="rounded border-gray-300"
              >
              <span class="text-sm">{{ region.flag }} {{ region.name }}</span>
            </label>
          </div>
        </div>

        <!-- Custom Rules -->
        <div v-if="flag.rolloutStrategy === 'custom'" class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">Custom Targeting Rules</label>
          <div
            v-for="(rule, index) in flag.customRules"
            :key="index"
            class="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg"
          >
            <select v-model="rule.attribute" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="user_id">User ID</option>
              <option value="email">Email</option>
              <option value="plan">Plan Type</option>
              <option value="registration_date">Registration Date</option>
            </select>
            <select v-model="rule.operator" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="equals">equals</option>
              <option value="contains">contains</option>
              <option value="starts_with">starts with</option>
              <option value="greater_than">greater than</option>
            </select>
            <input
              v-model="rule.value"
              type="text"
              placeholder="Value"
              class="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
            >
            <button
              @click="removeRule(index)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
          <button
            @click="addRule"
            class="btn-secondary text-sm"
          >
            + Add Rule
          </button>
        </div>
      </div>

      <!-- Metrics -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <h5 class="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h5>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-lg font-bold text-gray-900">{{ flag.metrics.exposures.toLocaleString() }}</div>
            <div class="text-xs text-gray-500">Exposures</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-lg font-bold text-gray-900">{{ flag.metrics.conversionRate }}%</div>
            <div class="text-xs text-gray-500">Conversion Rate</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-lg font-bold text-gray-900">{{ flag.metrics.performance }}ms</div>
            <div class="text-xs text-gray-500">Avg Load Time</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  flagData: {
    id: string
    name: string
    description: string
    enabled: boolean
    rolloutStrategy: string
    rolloutPercentage: number
    targetGroups: string[]
    targetRegions: string[]
    customRules: Array<{
      attribute: string
      operator: string
      value: string
    }>
    metrics: {
      exposures: number
      conversionRate: number
      performance: number
    }
  }
}

const props = defineProps<Props>()

const flag = ref({ ...props.flagData })
const totalUsers = 15420

const userGroups = ref([
  { id: 'beta', name: 'Beta Users', users: 1200 },
  { id: 'premium', name: 'Premium Plan', users: 3400 },
  { id: 'enterprise', name: 'Enterprise', users: 890 },
  { id: 'mobile', name: 'Mobile Users', users: 8900 },
  { id: 'new', name: 'New Users (< 30 days)', users: 2100 }
])

const regions = ref([
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' }
])

const toggleFlag = () => {
  console.log(`Feature flag ${flag.value.name} ${flag.value.enabled ? 'enabled' : 'disabled'}`)
}

const addRule = () => {
  flag.value.customRules.push({
    attribute: 'user_id',
    operator: 'equals',
    value: ''
  })
}

const removeRule = (index: number) => {
  flag.value.customRules.splice(index, 1)
}

// Simulate real-time metrics updates
onMounted(() => {
  setInterval(() => {
    if (flag.value.enabled) {
      flag.value.metrics.exposures += Math.floor(Math.random() * 10) + 1
      flag.value.metrics.conversionRate = Math.max(0, flag.value.metrics.conversionRate + (Math.random() * 0.2) - 0.1)
      flag.value.metrics.performance += Math.floor(Math.random() * 20) - 10
    }
  }, 3000)
})
</script>