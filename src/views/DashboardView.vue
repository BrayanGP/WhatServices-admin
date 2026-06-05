<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import StatCard from '../components/StatCard.vue'
import { useAdminStore } from '../stores/admin'

Chart.register(...registerables)

const store = useAdminStore()
const stats = ref(null)
const loading = ref(true)

const refs = { conv: ref(null), services: ref(null), hours: ref(null), growth: ref(null) }
const charts = []

const BLUE = '#2563eb'
const SLATE = '#334155'
const INDIGO = '#6366f1'

const lineData = (rows, label, color) => ({
  type: 'line',
  data: {
    labels: rows.map((r) => r._id),
    datasets: [{ label, data: rows.map((r) => r.count), borderColor: color, backgroundColor: color + '22', tension: 0.3, fill: true, pointRadius: 3 }],
  },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
})

const barData = (labels, data, color) => ({
  type: 'bar',
  data: { labels, datasets: [{ data, backgroundColor: color, borderRadius: 6 }] },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
})

const statusClass = (s) => ({
  nueva: 'bg-blue-100 text-blue-700',
  contactado: 'bg-amber-100 text-amber-700',
  asignada: 'bg-purple-100 text-purple-700',
  completada: 'bg-green-100 text-green-700',
  cancelada: 'bg-gray-200 text-gray-500',
}[s] || 'bg-gray-100 text-gray-600')

const elapsed = (date) => {
  const ms = Date.now() - new Date(date).getTime()
  const h = Math.floor(ms / 3.6e6)
  if (h < 1) return `hace ${Math.max(1, Math.floor(ms / 60000))} min`
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

onMounted(async () => {
  stats.value = await store.fetchStats()
  loading.value = false
  await nextTick()
  charts.push(new Chart(refs.conv.value, lineData(stats.value.requestsByDay, 'Solicitudes', BLUE)))
  charts.push(new Chart(refs.services.value, barData(stats.value.topServices.map((s) => s._id), stats.value.topServices.map((s) => s.count), SLATE)))
  const hoursMap = Object.fromEntries(stats.value.peakHours.map((h) => [h._id, h.count]))
  charts.push(new Chart(refs.hours.value, barData(Array.from({ length: 24 }, (_, h) => `${h}h`), Array.from({ length: 24 }, (_, h) => hoursMap[h] || 0), INDIGO)))
  charts.push(new Chart(refs.growth.value, lineData(stats.value.providersByDay, 'Profesionales', SLATE)))
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
    <p class="text-sm text-gray-500 mb-6">Centro de operación — lo que necesita tu atención ahora.</p>
    <div v-if="loading" class="text-gray-400">Cargando estadísticas...</div>

    <template v-else>
      <!-- Tarjetas accionables -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-amber-400">
          <div class="flex items-start justify-between">
            <span class="text-4xl font-bold text-gray-800">{{ stats.ops.newRequests }}</span>
            <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">nuevas</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Solicitudes nuevas</p>
          <router-link to="/requests" class="inline-block mt-3 text-sm text-blue-600 font-medium hover:underline">Ver solicitudes →</router-link>
        </div>
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-purple-400">
          <div class="flex items-start justify-between">
            <span class="text-4xl font-bold text-gray-800">{{ stats.ops.pendingProviders }}</span>
            <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">por aprobar</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Profesionales por verificar</p>
          <router-link to="/providers" class="inline-block mt-3 text-sm text-blue-600 font-medium hover:underline">Revisar perfiles →</router-link>
        </div>
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-blue-400">
          <div class="flex items-start justify-between">
            <span class="text-4xl font-bold text-gray-800">{{ stats.ops.humanConversations }}</span>
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">atención</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Conversaciones por atender</p>
          <router-link to="/conversations" class="inline-block mt-3 text-sm text-blue-600 font-medium hover:underline">Abrir chats →</router-link>
        </div>
      </div>

      <!-- Totales -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Profesionales" :value="stats.totals.providers" icon="🔧" />
        <StatCard title="Usuarios" :value="stats.totals.users" icon="👥" />
        <StatCard title="Solicitudes" :value="stats.totals.requests" icon="📋" />
        <StatCard title="Conversaciones" :value="stats.totals.conversations" icon="💬" />
        <StatCard title="Reseñas" :value="stats.totals.reviews" icon="⭐" />
      </div>

      <!-- Bandeja + Estado/Ranking -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Bandeja de solicitudes -->
        <div class="bg-white rounded-xl shadow p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-700">Bandeja de solicitudes</h3>
            <router-link to="/requests" class="text-sm text-blue-600 hover:underline">Ver todas →</router-link>
          </div>
          <div v-if="!stats.ops.recentRequests.length" class="text-sm text-gray-400 py-6 text-center">Aún no hay solicitudes.</div>
          <div v-else class="divide-y">
            <div v-for="r in stats.ops.recentRequests" :key="r._id" class="py-3 flex items-center justify-between">
              <div class="min-w-0">
                <p class="font-medium text-gray-800 truncate">{{ r.service || 'Servicio' }}</p>
                <p class="text-xs text-gray-500">{{ r.name || r.phone }} · {{ elapsed(r.createdAt) }}
                  <span v-if="r.assignedProvider"> · eligió a <b>{{ r.assignedProvider.businessName }}</b></span>
                </p>
              </div>
              <span :class="statusClass(r.status)" class="text-xs px-2 py-1 rounded-full capitalize shrink-0">{{ r.status }}</span>
            </div>
          </div>
        </div>

        <!-- Estado del bot + Ranking -->
        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-3">Estado del bot</h3>
            <div class="flex justify-between text-sm py-1"><span class="text-gray-500">Mensajes hoy</span><span class="font-semibold">{{ stats.ops.messagesToday }}</span></div>
            <div class="flex justify-between text-sm py-1"><span class="text-gray-500">Resueltos por bot</span><span class="font-semibold">{{ stats.ops.botResolvedPct }}%</span></div>
            <div class="flex justify-between text-sm py-1"><span class="text-gray-500">Escalados a humano</span><span class="font-semibold">{{ stats.ops.humanConversations }}</span></div>
          </div>

          <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-3">🏆 Ranking de profesionales</h3>
            <div v-if="!stats.topProviders.length" class="text-sm text-gray-400">Aún sin calificaciones.</div>
            <ol v-else class="space-y-2">
              <li v-for="(p, i) in stats.topProviders" :key="p._id" class="flex items-center gap-3 text-sm">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  :class="i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'">
                  {{ i + 1 }}
                </span>
                <span class="flex-1 truncate font-medium text-gray-800">{{ p.businessName }}</span>
                <span class="text-yellow-500 shrink-0">★ {{ p.rating?.average }} <span class="text-gray-400">({{ p.rating?.count }})</span></span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Gráficas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow p-5">
          <h3 class="font-semibold text-gray-700 mb-3">Solicitudes por día (14d)</h3>
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
    </template>
  </div>
</template>
