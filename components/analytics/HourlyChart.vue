<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  data: { hour: number; visit_count: number }[]
}>()

const chartData = computed(() => {
  const full = Array.from({ length: 24 }, (_, h) => {
    const found = props.data.find(d => d.hour === h)
    return found ? Number(found.visit_count) : 0
  })
  return {
    labels: Array.from({ length: 24 }, (_, h) => `${h}:00`),
    datasets: [{
      label: 'Visits',
      data: full,
      backgroundColor: '#818cf8',
      borderRadius: 4,
      maxBarThickness: 20,
    }],
  }
})

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { cornerRadius: 8 } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 8 } },
    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
  },
}
</script>

<template>
  <div class="h-64">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
