<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import StatCard from '../components/StatCard.vue'
import { useAdminStore } from '../stores/admin'

Chart.register(...registerables)

const store = useAdminStore()
const stats = ref(null)
const loading = ref(true)
const topProviders = ref([])

const refs = {
  conv: ref(null), services: ref(null), hours: ref(null), growth: ref(null),
}
const charts = []

const GREEN = '#25D366'
const DARK = '#0B1E2E'
const MED = '#075E54'

const lineData = (rows, label, color) => {
  const labels = rows.map((r) => r._id)
  const data = rows.map((r) => r.count)
  return {
    type: 'line',
    data: { labels, datasets: [{ label, data, borderColor: color, backgroundColor: color + '33', tension: 0.3, fill: true, pointRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  }
}

const barData = (labels, data, label, color) => ({
  type: 'bar',
  data: { labels, datasets: [{ label, data, backgroundColor: color, borderRadius: 6 }] },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
})

onMounted(async () => {
  stats.value = await store.fetchStats()
  topProviders.value = stats.value.topProviders || []
  loading.value = false
  await nextTick()

  // Conversaciones por dia
  charts.push(new Chart(refs.conv.value, lineData(stats.value.conversationsByDay, 'Conversaciones', GREEN)))

  // Servicios mas pedidos
  charts.push(new Chart(refs.services.value, barData(
    stats.value.topServices.map((s) => s._id),
    stats.value.topServices.map((s) => s.count),
    'Solicitudes', MED,
  )))

  // Horarios pico (0-23)
  const hoursMap = Object.fromEntries(stats.value.peakHours.map((h) => [h._id, h.count]))
  charts.push(new Chart(refs.hours.value, barData(
    Array.from({ length: 24 }, (_, h) => `${h}h`),
    Array.from({ length: 24 }, (_, h) => hoursMap[h] || 0),
    'Actividad', DARK,
  )))

  // Crecimiento de profesionales
  charts.push(new Chart(refs.growth.value, lineData(stats.value.providersByDay, 'Nuevos profesionales', MED)))
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
    <div v-if="loading" class="text-gray-400">Cargando estadísticas...</div>
    <template v-else>
      <!-- Tarjetas -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Profesionales" :value="stats.totals.providers" icon="🔧" />
        <StatCard title="Usuarios" :value="stats.totals.users" icon="👥" />
        <StatCard title="Conversaciones" :value="stats.totals.conversations" icon="💬" />
        <StatCard title="Categorías" :value="stats.totals.categories" icon="🗂️" />
        <StatCard title="Reseñas" :value="stats.totals.reviews" icon="⭐" />
      </div>

      <!-- Gráficas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow p-5">
          <h3 class="font-semibold text-gray-700 mb-3">Conversaciones por día (14d)</h3>
          <div class="h-64"><canvas :ref="refs.conv"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow p-5">
          <h3 class="font-semibold text-gray-700 mb-3">Servicios más pedidos</h3>
          <div class="h-64"><canvas :ref="refs.services"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow p-5">
          <h3 class="font-semibold text-gray-700 mb-3">Horarios con mayor actividad</h3>
          <div class="h-64"><canvas :ref="refs.hours"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow p-5">
          <h3 class="font-semibold text-gray-700 mb-3">Crecimiento de profesionales (14d)</h3>
          <div class="h-64"><canvas :ref="refs.growth"></canvas></div>
        </div>
      </div>

      <!-- Top profesionales -->
      <div class="bg-white rounded-xl shadow p-5 mt-6">
        <h3 class="font-semibold text-gray-700 mb-3">Mejores profesionales</h3>
        <div v-if="!topProviders.length" class="text-sm text-gray-400">Aún sin calificaciones.</div>
        <table v-else class="w-full text-sm">
          <thead class="text-gray-500 text-xs uppercase">
            <tr><th class="text-left py-2">Negocio</th><th class="text-left">Ciudad</th><th class="text-left">Rating</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in topProviders" :key="p._id" class="border-t">
              <td class="py-2 font-medium text-gray-800">{{ p.businessName }}</td>
              <td class="text-gray-500">{{ p.city }}</td>
              <td class="text-yellow-500">★ {{ p.rating?.average }} ({{ p.rating?.count }})</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
