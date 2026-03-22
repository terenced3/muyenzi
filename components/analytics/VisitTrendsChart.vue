<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { format, parseISO } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  data: { visit_date: string; visit_count: number }[]
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => format(parseISO(d.visit_date), 'MMM d')),
  datasets: [{
    label: 'Visits',
    data: props.data.map(d => Number(d.visit_count)),
    backgroundColor: '#6366f1',
    borderRadius: 4,
    maxBarThickness: 24,
  }],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { cornerRadius: 8 } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
  },
}
</script>

<template>
  <div class="h-64">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
