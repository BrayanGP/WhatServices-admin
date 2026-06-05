<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin'
import IntentsManager from '../components/IntentsManager.vue'

const store = useAdminStore()
const router = useRouter()

const tab = ref('general') // general | mensajes | intenciones
const cfg = ref(null)
const loading = ref(true)
const saving = ref(false)
const msg = ref('')

const DAYS = [
  { v: 1, l: 'Lun' }, { v: 2, l: 'Mar' }, { v: 3, l: 'Mié' }, { v: 4, l: 'Jue' },
  { v: 5, l: 'Vie' }, { v: 6, l: 'Sáb' }, { v: 0, l: 'Dom' },
]

// Orden de la conversación (flujo del bot por defecto)
const FLOW = [
  { icon: '👋', title: 'Bienvenida', desc: 'Saluda y lista los servicios disponibles.', key: 'welcome' },
  { icon: '🛠️', title: 'Elegir servicio', desc: 'El cliente escribe lo que necesita (fuzzy match).', key: 'noService' },
  { icon: '🔀', title: 'Modo de búsqueda', desc: '1) Más cercanos por CP · 2) Mejor calificados.', key: 'askMode' },
  { icon: '📍', title: 'Código postal', desc: 'Solo si eligió "más cercanos".', key: 'askZip' },
  { icon: '⭐', title: 'Resultados', desc: 'Top 5 con foto, rating y contacto.', key: 'resultsHint' },
  { icon: '👷', title: 'Ver trabajos', desc: 'Fotos de trabajos del proveedor elegido.', key: 'worksIntro' },
  { icon: '🔙', title: 'Volver / Otro', desc: 'Regresar a la lista o nueva búsqueda.', key: 'worksNav' },
]

const labels = {
  welcome: 'Bienvenida',
  noService: 'Servicio no reconocido',
  askMode: 'Preguntar modo (cerca / mejor)',
  askZip: 'Pedir código postal',
  noResults: 'Sin resultados',
  outOfHours: 'Fuera de horario',
  resultsHint: 'Pie de resultados (cómo ver trabajos)',
  worksIntro: 'Intro de trabajos del proveedor',
  noWorks: 'Proveedor sin trabajos',
  worksNav: 'Navegación tras ver trabajos',
}
const varsByMsg = {
  welcome: '{name} {services}',
  noService: '{services}',
  askMode: '{service}',
  askZip: '—',
  noResults: '{service}',
  outOfHours: '{open} {close}',
  resultsHint: '{count} {link}',
  worksIntro: '{business}',
  noWorks: '{business} {contact}',
  worksNav: '—',
}

onMounted(async () => {
  cfg.value = await store.fetchBotConfig()
  loading.value = false
})

const toggleDay = (d) => {
  const arr = cfg.value.hours.days
  const i = arr.indexOf(d)
  if (i === -1) arr.push(d); else arr.splice(i, 1)
}

const save = async () => {
  saving.value = true; msg.value = ''
  try {
    cfg.value = await store.updateBotConfig({
      enabled: cfg.value.enabled,
      useButtons: cfg.value.useButtons,
      messages: cfg.value.messages,
      hours: cfg.value.hours,
    })
    msg.value = '✅ Guardado'
    setTimeout(() => (msg.value = ''), 2500)
  } catch { msg.value = 'Error al guardar' }
  finally { saving.value = false }
}
</script>

<template>
  <div class="p-6 max-w-5xl">
    <h1 class="text-2xl font-bold text-brand-dark mb-1">Administración del bot</h1>
    <p class="text-sm text-gray-500 mb-5">Controla qué reconoce el bot y cómo responde en WhatsApp.</p>

    <div v-if="loading" class="text-gray-400">Cargando...</div>
    <template v-else>
      <!-- Tabs -->
      <div class="flex gap-1 mb-5 border-b border-gray-200">
        <button v-for="t in [['general','General'],['mensajes','Mensajes y flujo'],['intenciones','Intenciones']]" :key="t[0]"
          @click="tab = t[0]"
          :class="tab === t[0] ? 'border-brand-green text-brand-medium' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors">
          {{ t[1] }}
        </button>
        <button @click="router.push('/bot/flow')"
          class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors ml-auto">
          🧩 Flujo visual <span class="text-[10px] bg-brand-green text-white px-1.5 py-0.5 rounded-full align-middle">beta</span>
        </button>
      </div>

      <!-- ============ GENERAL ============ -->
      <div v-show="tab === 'general'" class="space-y-4">
        <!-- On/Off -->
        <div class="bg-white rounded-xl shadow p-5 flex items-center justify-between">
          <div>
            <p class="font-medium text-brand-dark">Bot activo</p>
            <p class="text-xs text-gray-500">Si lo apagas, el bot no responde mensajes.</p>
          </div>
          <button @click="cfg.enabled = !cfg.enabled"
            :class="cfg.enabled ? 'bg-brand-green' : 'bg-gray-300'"
            class="relative w-12 h-6 rounded-full transition-colors">
            <span :class="cfg.enabled ? 'translate-x-6' : 'translate-x-1'"
              class="absolute top-1 left-0 w-4 h-4 bg-white rounded-full transition-transform"></span>
          </button>
        </div>

        <!-- Botones interactivos -->
        <div class="bg-white rounded-xl shadow p-5 flex items-center justify-between">
          <div>
            <p class="font-medium text-brand-dark">Botones interactivos</p>
            <p class="text-xs text-gray-500">Envía listas y botones en WhatsApp (ver trabajos, volver, otro servicio).
              Si tu dispositivo no los muestra, desactívalo: el bot funciona igual respondiendo con números.</p>
          </div>
          <button @click="cfg.useButtons = !cfg.useButtons"
            :class="cfg.useButtons ? 'bg-brand-green' : 'bg-gray-300'"
            class="relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4">
            <span :class="cfg.useButtons ? 'translate-x-6' : 'translate-x-1'"
              class="absolute top-1 left-0 w-4 h-4 bg-white rounded-full transition-transform"></span>
          </button>
        </div>

        <!-- Horario -->
        <div class="bg-white rounded-xl shadow p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="font-medium text-brand-dark">Horario de atención</p>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="cfg.hours.enabled" class="accent-brand-green" /> Activar
            </label>
          </div>
          <div v-if="cfg.hours.enabled" class="space-y-3">
            <div class="flex flex-wrap gap-2">
              <button v-for="d in DAYS" :key="d.v" @click="toggleDay(d.v)"
                class="text-xs px-3 py-1.5 rounded-full border transition-colors"
                :class="cfg.hours.days.includes(d.v) ? 'bg-brand-green text-white border-brand-green' : 'bg-white text-gray-600 border-gray-300'">
                {{ d.l }}
              </button>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <label>Abre: <input type="number" min="0" max="23" v-model.number="cfg.hours.openHour" class="border rounded px-2 py-1 w-16" />:00</label>
              <label>Cierra: <input type="number" min="0" max="23" v-model.number="cfg.hours.closeHour" class="border rounded px-2 py-1 w-16" />:00</label>
              <span class="text-gray-400 text-xs">({{ cfg.hours.tz }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ MENSAJES Y FLUJO ============ -->
      <div v-show="tab === 'mensajes'" class="space-y-4">
        <!-- Flujo de conversación -->
        <div class="bg-white rounded-xl shadow p-5">
          <p class="font-medium text-brand-dark mb-3">Orden de la conversación</p>
          <div class="flex flex-wrap items-stretch gap-2">
            <template v-for="(s, i) in FLOW" :key="s.key">
              <div class="flex-1 min-w-[130px] rounded-lg border border-gray-200 bg-brand-light/40 p-3">
                <div class="text-lg">{{ s.icon }}</div>
                <p class="text-sm font-semibold text-brand-dark leading-tight">{{ i + 1 }}. {{ s.title }}</p>
                <p class="text-[11px] text-gray-500 mt-1 leading-snug">{{ s.desc }}</p>
              </div>
              <div v-if="i < FLOW.length - 1" class="hidden md:flex items-center text-gray-300">➜</div>
            </template>
          </div>
          <p class="text-[11px] text-gray-500 mt-3">¿Quieres cambiar el orden o agregar lógica? Usa el <button class="text-brand-medium underline" @click="router.push('/bot/flow')">constructor de flujo visual</button>.</p>
        </div>

        <!-- Variables disponibles -->
        <div class="bg-brand-light/50 border border-brand-green/30 rounded-xl p-4 text-sm">
          <p class="font-medium text-brand-dark mb-2">🔤 Variables disponibles</p>
          <ul class="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-700">
            <li><code class="text-brand-medium">{name}</code> Nombre del cliente</li>
            <li><code class="text-brand-medium">{services}</code> Lista de servicios</li>
            <li><code class="text-brand-medium">{service}</code> Servicio elegido</li>
            <li><code class="text-brand-medium">{count}</code> Nº de resultados</li>
            <li><code class="text-brand-medium">{link}</code> Link a la web</li>
            <li><code class="text-brand-medium">{business}</code> Nombre del proveedor</li>
            <li><code class="text-brand-medium">{contact}</code> Link de contacto</li>
            <li><code class="text-brand-medium">{open}</code> / <code class="text-brand-medium">{close}</code> Horario</li>
            <li><code class="text-brand-medium">{phone}</code> Teléfono del cliente</li>
          </ul>
          <p class="text-[11px] text-gray-500 mt-2">En el constructor de flujo hay más (saludo, fecha, top calificados, cercanos) y puedes crear las tuyas.</p>
        </div>

        <!-- Mensajes -->
        <div class="bg-white rounded-xl shadow p-5 space-y-4">
          <p class="font-medium text-brand-dark">Mensajes del bot</p>
          <div v-for="(_, key) in cfg.messages" :key="key">
            <label class="text-xs text-gray-600 block mb-1">
              {{ labels[key] || key }}
              <span class="text-brand-green font-mono ml-1">{{ varsByMsg[key] || '' }}</span>
            </label>
            <textarea v-model="cfg.messages[key]" rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none"></textarea>
          </div>
        </div>
      </div>

      <!-- ============ INTENCIONES ============ -->
      <div v-show="tab === 'intenciones'">
        <IntentsManager />
      </div>

      <!-- Guardar (general / mensajes) -->
      <div v-if="tab !== 'intenciones'" class="flex items-center gap-3 mt-5">
        <button @click="save" :disabled="saving"
          class="bg-brand-green text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-lightGreen disabled:opacity-50">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
        <span class="text-sm text-gray-500">{{ msg }}</span>
      </div>
    </template>
  </div>
</template>
