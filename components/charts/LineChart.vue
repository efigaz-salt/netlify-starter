<template>
  <div class="relative">
    <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-full">
      <!-- Grid lines -->
      <defs>
        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Data line -->
      <polyline
        :points="linePoints"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Data points -->
      <circle
        v-for="(point, index) in points"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        r="4"
        :fill="color"
        class="cursor-pointer hover:r-6 transition-all"
        @mouseenter="showTooltip(index, $event)"
        @mouseleave="hideTooltip"
      />
      
      <!-- Y-axis labels -->
      <text
        v-for="(label, index) in yLabels"
        :key="`y-${index}`"
        :x="20"
        :y="label.y + 4"
        class="text-xs fill-gray-500"
        text-anchor="end"
      >
        {{ label.value }}
      </text>
      
      <!-- X-axis labels -->
      <text
        v-for="(label, index) in xLabels"
        :key="`x-${index}`"
        :x="label.x"
        :y="height - 10"
        class="text-xs fill-gray-500"
        text-anchor="middle"
      >
        {{ label.value }}
      </text>
    </svg>
    
    <!-- Tooltip -->
    <div
      v-if="tooltip.show"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      class="absolute z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none"
    >
      {{ tooltip.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface DataPoint {
  x: number
  y: number
  label: string
  value: number
}

interface Props {
  data: Array<{ label: string; value: number }>
  color?: string
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#3b82f6',
  width: 400,
  height: 200
})

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  content: ''
})

const padding = { top: 20, right: 20, bottom: 40, left: 40 }
const chartWidth = props.width - padding.left - padding.right
const chartHeight = props.height - padding.top - padding.bottom

const maxValue = computed(() => Math.max(...props.data.map(d => d.value)))
const minValue = computed(() => Math.min(...props.data.map(d => d.value)))

const points = computed(() => {
  return props.data.map((item, index) => ({
    x: padding.left + (index * chartWidth) / (props.data.length - 1),
    y: padding.top + chartHeight - ((item.value - minValue.value) / (maxValue.value - minValue.value)) * chartHeight,
    label: item.label,
    value: item.value
  }))
})

const linePoints = computed(() => {
  return points.value.map(p => `${p.x},${p.y}`).join(' ')
})

const yLabels = computed(() => {
  const steps = 5
  return Array.from({ length: steps }, (_, i) => {
    const value = minValue.value + (i * (maxValue.value - minValue.value)) / (steps - 1)
    const y = padding.top + chartHeight - (i * chartHeight) / (steps - 1)
    return {
      value: Math.round(value).toLocaleString(),
      y
    }
  })
})

const xLabels = computed(() => {
  const step = Math.ceil(props.data.length / 6)
  return props.data
    .filter((_, index) => index % step === 0)
    .map((item, index) => ({
      value: item.label,
      x: padding.left + (index * step * chartWidth) / (props.data.length - 1)
    }))
})

const showTooltip = (index: number, event: MouseEvent) => {
  const point = points.value[index]
  tooltip.value = {
    show: true,
    x: event.offsetX + 10,
    y: event.offsetY - 30,
    content: `${point.label}: ${point.value.toLocaleString()}`
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}
</script>