<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'
import StatCard from '../components/StatCard.vue'
import { useAdminStore } from '../stores/admin'

Chart.register(...registerables)

const store = useAdminStore()
const router = useRouter()
const stats = ref(null)
const botEnabled = ref(true)
const loading = ref(true)
const updatedAt = ref(null)
const tick = ref(0)

const refs = { day: ref(null), services: ref(null) }
let charts = []

// ----- Analítica del sitio -----
const anDays = ref(7)
const overview = ref(null)
const funnels = ref(null)
const loadAnalytics = async () => {
  const [o, f] = await Promise.all([
    store.fetchAnalyticsOverview(anDays.value),
    store.fetchAnalyticsFunnel(anDays.value),
  ])
  overview.value = o
  funnels.value = f?.funnels || null
}
const setDays = async (d) => { anDays.value = d; await loadAnalytics() }
const maxOf = (arr, key) => Math.max(1, ...(arr || []).map((x) => x[key] || 0))
const pct = (v, max) => `${Math.round((v / max) * 100)}%`
let auto = null
let ticker = null

const BLUE = '#2563eb'
const SLATE = '#334155'

// ----- Bandeja -----
const tabs = [
  { label: 'Todas', value: '' },
  { label: 'Nuevas', value: 'nueva' },
  { label: 'Asignadas', value: 'asignada' },
  { label: 'Completadas', value: 'completada' },
]
const activeTab = ref('')
const inbox = ref([])
const inboxLoading = ref(false)

const loadInbox = async () => {
  inboxLoading.value = true
  try {
    const data = await store.fetchRequests({ status: activeTab.value, limit: 8 })
    inbox.value = data.requests
  } finally {
    inboxLoading.value = false
  }
}
const setTab = (v) => { activeTab.value = v; loadInbox() }

// ----- Charts -----
const lineData = (rows, label, color) => ({
  type: 'line',
  data: { labels: rows.map((r) => r._id), datasets: [{ label, data: rows.map((r) => r.count), borderColor: color, backgroundColor: color + '22', tension: 0.3, fill: true, pointRadius: 3 }] },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
})
const barData = (labels, data, color) => ({
  type: 'bar',
  data: { labels, datasets: [{ data, backgroundColor: color, borderRadius: 6 }] },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
})
const buildCharts = () => {
  charts.forEach((c) => c.destroy())
  charts = []
  const s = stats.value
  charts.push(new Chart(refs.day.value, lineData(s.requestsByDay, 'Solicitudes', BLUE)))
  charts.push(new Chart(refs.services.value, barData(s.topServices.map((x) => x._id), s.topServices.map((x) => x.count), SLATE)))
}

// ----- Carga -----
const loadData = async () => {
  const [s, cfg] = await Promise.all([store.fetchStats(), store.fetchBotConfig()])
  stats.value = s
  botEnabled.value = cfg.enabled
  updatedAt.value = Date.now()
}
const refresh = async () => {
  await loadData()
  await loadInbox()
  await loadAnalytics()
  await nextTick()
  buildCharts()
}

// ----- Helpers -----
const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}
const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
const updatedAgo = () => {
  void tick.value
  if (!updatedAt.value) return ''
  const s = Math.floor((Date.now() - updatedAt.value) / 1000)
  return s < 60 ? `actualizado hace ${s}s` : `actualizado hace ${Math.floor(s / 60)} min`
}
const statusClass = (s) => ({
  nueva: 'bg-blue-100 text-brand-medium', contactado: 'bg-amber-100 text-amber-700',
  asignada: 'bg-purple-100 text-purple-700', completada: 'bg-green-100 text-green-700',
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
  await loadData()
  await loadInbox()
  await loadAnalytics()
  loading.value = false
  await nextTick()
  buildCharts()
  auto = setInterval(refresh, 60000)
  ticker = setInterval(() => { tick.value++ }, 10000)
})
onUnmounted(() => {
  clearInterval(auto); clearInterval(ticker)
  charts.forEach((c) => c.destroy())
})
</script>

<template>
  <div class="p-8">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-sm text-gray-500">{{ greeting() }} · <span class="capitalize">{{ today }}</span></p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs px-2 py-1 rounded-full flex items-center gap-1"
          :class="botEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          <span class="w-2 h-2 rounded-full" :class="botEnabled ? 'bg-green-500' : 'bg-red-500'"></span>
          {{ botEnabled ? 'Bot activo' : 'Bot pausado' }}
        </span>
        <span class="text-xs text-gray-400">{{ updatedAgo() }}</span>
        <button @click="refresh" class="text-sm border rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">↻ Refrescar</button>
      </div>
    </div>

    <div v-if="loading" class="text-gray-400">Cargando...</div>

    <template v-else>
      <!-- Accionables -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-amber-400">
          <div class="flex items-start justify-between">
            <span class="text-4xl font-bold text-gray-800">{{ stats.ops.newRequests }}</span>
            <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">nuevas</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Solicitudes nuevas <span class="text-gray-400">· {{ stats.ops.requestsToday }} hoy</span></p>
          <router-link to="/requests" class="inline-block mt-3 text-sm text-brand-green font-medium hover:underline">Ver solicitudes →</router-link>
        </div>
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-purple-400">
          <div class="flex items-start justify-between">
            <span class="text-4xl font-bold text-gray-800">{{ stats.ops.pendingProviders }}</span>
            <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">por aprobar</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Proveedores por verificar</p>
          <router-link to="/providers" class="inline-block mt-3 text-sm text-brand-green font-medium hover:underline">Revisar perfiles →</router-link>
        </div>
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-blue-400">
          <div class="flex items-start justify-between">
            <span class="text-4xl font-bold text-gray-800">{{ stats.ops.humanConversations }}</span>
            <span class="text-xs bg-blue-100 text-brand-medium px-2 py-0.5 rounded-full">atención</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Conversaciones por atender</p>
          <router-link to="/conversations" class="inline-block mt-3 text-sm text-brand-green font-medium hover:underline">Abrir chats →</router-link>
        </div>
      </div>

      <!-- Totales -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Proveedores" :value="stats.totals.providers" icon="🔧" />
        <StatCard title="Usuarios" :value="stats.totals.users" icon="👥" />
        <StatCard title="Solicitudes" :value="stats.totals.requests" icon="📋" />
        <StatCard title="Conversaciones" :value="stats.totals.conversations" icon="💬" />
        <StatCard title="Reseñas" :value="stats.totals.reviews" icon="⭐" />
      </div>

      <!-- Bandeja + Estado/Ranking -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-700">Bandeja de solicitudes</h3>
            <div class="flex gap-1">
              <button v-for="t in tabs" :key="t.value" @click="setTab(t.value)"
                class="text-xs px-2.5 py-1 rounded-full"
                :class="activeTab === t.value ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
                {{ t.label }}
              </button>
            </div>
          </div>
          <div v-if="inboxLoading" class="text-sm text-gray-400 py-6 text-center">Cargando...</div>
          <div v-else-if="!inbox.length" class="text-sm text-gray-400 py-6 text-center">Sin solicitudes en esta vista.</div>
          <div v-else class="divide-y">
            <div v-for="r in inbox" :key="r._id" @click="router.push('/requests')"
              class="py-3 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded cursor-pointer">
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

        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-3">Estado del bot</h3>
            <div class="flex justify-between text-sm py-1"><span class="text-gray-500">Mensajes hoy</span><span class="font-semibold">{{ stats.ops.messagesToday }}</span></div>
            <div class="flex justify-between text-sm py-1"><span class="text-gray-500">Resueltos por bot</span><span class="font-semibold">{{ stats.ops.botResolvedPct }}%</span></div>
            <div class="flex justify-between text-sm py-1"><span class="text-gray-500">Escalados a humano</span><span class="font-semibold">{{ stats.ops.humanConversations }}</span></div>
          </div>

          <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-3">🏆 Ranking de proveedores</h3>
            <div v-if="!stats.topProviders.length" class="text-sm text-gray-400">Aún sin calificaciones.</div>
            <ol v-else class="space-y-2">
              <li v-for="(p, i) in stats.topProviders" :key="p._id" class="flex items-center gap-3 text-sm">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  :class="i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'">{{ i + 1 }}</span>
                <span class="flex-1 truncate font-medium text-gray-800">{{ p.businessName }}</span>
                <span class="text-yellow-500 shrink-0">★ {{ p.rating?.average }} <span class="text-gray-400">({{ p.rating?.count }})</span></span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Gráficas clave -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow p-5">
          <h3 class="font-semibold text-gray-700 mb-3">Solicitudes por día (14d)</h3>
          <div class="h-64"><canvas :ref="refs.day"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow p-5">
          <h3 class="font-semibold text-gray-700 mb-3">Servicios más pedidos</h3>
          <div class="h-64"><canvas :ref="refs.services"></canvas></div>
        </div>
      </div>

      <!-- ====== Analítica del sitio ====== -->
      <div class="mt-8" v-if="overview">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800">📈 Visitas y conversión</h2>
          <div class="flex gap-1 text-xs">
            <button v-for="d in [7, 30, 90]" :key="d" @click="setDays(d)"
              :class="anDays === d ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              class="px-3 py-1 rounded-full">{{ d }} días</button>
          </div>
        </div>

        <!-- Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl shadow p-5">
            <p class="text-3xl font-bold text-gray-800">{{ overview.pageviews }}</p>
            <p class="text-sm text-gray-500 mt-1">Visitas (páginas vistas)</p>
          </div>
          <div class="bg-white rounded-xl shadow p-5">
            <p class="text-3xl font-bold text-gray-800">{{ overview.uniques }}</p>
            <p class="text-sm text-gray-500 mt-1">Visitantes únicos</p>
          </div>
          <div class="bg-white rounded-xl shadow p-5">
            <p class="text-sm text-gray-500 mb-2">Dispositivo</p>
            <div v-for="d in overview.byDevice" :key="d.device" class="flex justify-between text-sm">
              <span class="text-gray-600">{{ d.device }}</span><span class="font-medium text-gray-800">{{ d.count }}</span>
            </div>
            <p v-if="!overview.byDevice?.length" class="text-gray-400 text-sm">Sin datos</p>
          </div>
          <div class="bg-white rounded-xl shadow p-5">
            <p class="text-sm text-gray-500 mb-2">Fuentes</p>
            <div v-for="s in overview.topSources.slice(0,4)" :key="s.source" class="flex justify-between text-sm">
              <span class="text-gray-600 truncate mr-2">{{ s.source }}</span><span class="font-medium text-gray-800">{{ s.count }}</span>
            </div>
            <p v-if="!overview.topSources?.length" class="text-gray-400 text-sm">Sin datos</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Visitas por día -->
          <div class="bg-white rounded-xl shadow p-5 lg:col-span-2">
            <h3 class="font-semibold text-gray-700 mb-4">Visitas por día</h3>
            <div v-if="overview.byDay.length" class="flex items-end gap-1 h-40">
              <div v-for="d in overview.byDay" :key="d.date" class="flex-1 flex flex-col items-center justify-end group">
                <span class="text-[10px] text-gray-500 mb-1 opacity-0 group-hover:opacity-100">{{ d.views }}</span>
                <div class="w-full bg-brand-green/80 rounded-t" :style="{ height: pct(d.views, maxOf(overview.byDay, 'views')) }"></div>
                <span class="text-[9px] text-gray-400 mt-1">{{ d.date.slice(5) }}</span>
              </div>
            </div>
            <p v-else class="text-gray-400 text-sm py-8 text-center">Aún no hay visitas registradas.</p>
          </div>

          <!-- Top páginas -->
          <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-4">Páginas más vistas</h3>
            <div v-for="p in overview.topPaths" :key="p.path" class="mb-2">
              <div class="flex justify-between text-xs mb-0.5">
                <span class="text-gray-600 truncate mr-2">{{ p.path }}</span><span class="text-gray-800 font-medium">{{ p.count }}</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full"><div class="h-1.5 bg-brand-base rounded-full" :style="{ width: pct(p.count, maxOf(overview.topPaths, 'count')) }"></div></div>
            </div>
            <p v-if="!overview.topPaths?.length" class="text-gray-400 text-sm">Sin datos</p>
          </div>
        </div>

        <!-- Embudos -->
        <div v-if="funnels" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div v-for="(f, id) in funnels" :key="id" class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-4">Embudo · {{ f.label }}</h3>
            <div v-for="(s, i) in f.steps" :key="s.key" class="mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">{{ i + 1 }}. {{ s.label }}</span>
                <span class="font-semibold text-gray-800">
                  {{ s.count }}
                  <span v-if="i > 0" :class="s.pctFromPrev >= 50 ? 'text-green-600' : 'text-amber-600'" class="text-xs ml-1">({{ s.pctFromPrev }}%)</span>
                </span>
              </div>
              <div class="h-3 bg-gray-100 rounded-full">
                <div class="h-3 rounded-full bg-brand-green" :style="{ width: pct(s.count, f.steps[0].count || 1) }"></div>
              </div>
            </div>
            <p class="text-[11px] text-gray-400 mt-2">El % indica cuántos pasan del paso anterior (dónde se caen).</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
