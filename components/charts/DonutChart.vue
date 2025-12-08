<template>
  <div class="relative">
    <svg :viewBox="`0 0 ${size} ${size}`" class="w-full h-full">
      <g :transform="`translate(${size / 2}, ${size / 2})`">
        <!-- Donut segments -->
        <path
          v-for="(segment, index) in segments"
          :key="index"
          :d="segment.path"
          :fill="segment.color"
          :class="['cursor-pointer transition-opacity', hoveredIndex !== null && hoveredIndex !== index ? 'opacity-50' : '']"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
        />
        
        <!-- Center text -->
        <text
          x="0"
          y="-5"
          text-anchor="middle"
          class="text-lg font-bold fill-gray-900"
        >
          {{ totalValue.toLocaleString() }}
        </text>
        <text
          x="0"
          y="15"
          text-anchor="middle"
          class="text-sm fill-gray-500"
        >
          {{ centerLabel }}
        </text>
      </g>
    </svg>
    
    <!-- Legend -->
    <div class="mt-4 space-y-2">
      <div
        v-for="(item, index) in data"
        :key="index"
        :class="['flex items-center justify-between p-2 rounded cursor-pointer transition-colors', hoveredIndex === index ? 'bg-gray-50' : '']"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = null"
      >
        <div class="flex items-center space-x-2">
          <div
            :style="{ backgroundColor: colors[index] }"
            class="w-3 h-3 rounded-full"
          ></div>
          <span class="text-sm text-gray-900">{{ item.label }}</span>
        </div>
        <div class="text-right">
          <div class="text-sm font-medium text-gray-900">{{ item.value.toLocaleString() }}</div>
          <div class="text-xs text-gray-500">{{ ((item.value / totalValue) * 100).toFixed(1) }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: Array<{ label: string; value: number }>
  colors?: string[]
  size?: number
  centerLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  colors: () => ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  size: 200,
  centerLabel: 'Total'
})

const hoveredIndex = ref<number | null>(null)

const totalValue = computed(() => props.data.reduce((sum, item) => sum + item.value, 0))

const segments = computed(() => {
  let currentAngle = -Math.PI / 2 // Start at top
  const outerRadius = props.size * 0.4
  const innerRadius = props.size * 0.25
  
  return props.data.map((item, index) => {
    const startAngle = currentAngle
    const endAngle = currentAngle + (item.value / totalValue.value) * 2 * Math.PI
    
    const x1 = Math.cos(startAngle) * outerRadius
    const y1 = Math.sin(startAngle) * outerRadius
    const x2 = Math.cos(endAngle) * outerRadius
    const y2 = Math.sin(endAngle) * outerRadius
    const x3 = Math.cos(endAngle) * innerRadius
    const y3 = Math.sin(endAngle) * innerRadius
    const x4 = Math.cos(startAngle) * innerRadius
    const y4 = Math.sin(startAngle) * innerRadius
    
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    
    const path = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ')
    
    currentAngle = endAngle
    
    return {
      path,
      color: props.colors[index % props.colors.length]
    }
  })
})
</script>