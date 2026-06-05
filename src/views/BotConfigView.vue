<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const router = useRouter()

const tab = ref('general') // general | mensajes | intenciones
const cfg = ref(null)
const loading = ref(true)
const saving = ref(false)
const msg = ref('')
const categories = ref([])

const DAYS = [
  { v: 1, l: 'Lun' }, { v: 2, l: 'Mar' }, { v: 3, l: 'Mié' }, { v: 4, l: 'Jue' },
  { v: 5, l: 'Vie' }, { v: 6, l: 'Sáb' }, { v: 0, l: 'Dom' },
]

// Orden de la conversación (flujo del bot)
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

// ---- Intenciones ----
const intents = ref([])
const intentErr = ref('')
const search = ref('')
const blank = () => ({ name: '', key: '', description: '', examplesText: '', response: '', service: '', priority: 10, active: true })
const form = ref(blank())
const editingId = ref(null)
const savingIntent = ref(false)

const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const filteredIntents = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return intents.value
  return intents.value.filter((i) =>
    [i.name, i.key, i.description, (i.examples || []).join(' ')].join(' ').toLowerCase().includes(q))
})

onMounted(async () => {
  const [c, cats, its] = await Promise.all([
    store.fetchBotConfig(),
    store.fetchCategories().catch(() => []),
    store.fetchIntents().catch((e) => { intentErr.value = 'No se pudieron cargar las intenciones del bot.'; return [] }),
  ])
  cfg.value = c
  categories.value = Array.isArray(cats) ? cats : (cats.categories || [])
  intents.value = its || []
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

// ---- CRUD intenciones ----
const onName = () => { if (!editingId.value) form.value.key = slugify(form.value.name) }

const editIntent = (it) => {
  editingId.value = it._id
  form.value = {
    name: it.name, key: it.key, description: it.description || '',
    examplesText: (it.examples || []).join('\n'), response: it.response || '',
    service: it.service || '', priority: it.priority ?? 10, active: it.active !== false,
  }
  tab.value = 'intenciones'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => { editingId.value = null; form.value = blank() }

const submitIntent = async () => {
  if (!form.value.name.trim()) { intentErr.value = 'El nombre es obligatorio'; return }
  savingIntent.value = true; intentErr.value = ''
  const payload = {
    name: form.value.name, key: form.value.key || slugify(form.value.name),
    description: form.value.description,
    examples: form.value.examplesText.split('\n').map((s) => s.trim()).filter(Boolean),
    response: form.value.response, service: form.value.service,
    priority: Number(form.value.priority) || 10, active: form.value.active,
  }
  try {
    if (editingId.value) {
      const upd = await store.updateIntent(editingId.value, payload)
      const i = intents.value.findIndex((x) => x._id === editingId.value)
      if (i !== -1) intents.value[i] = upd
    } else {
      intents.value.unshift(await store.createIntent(payload))
    }
    cancelEdit()
  } catch (e) { intentErr.value = e.message || 'Error al guardar' }
  finally { savingIntent.value = false }
}

const removeIntent = async (it) => {
  if (!confirm(`¿Eliminar la intención "${it.name}"?`)) return
  try {
    await store.deleteIntent(it._id)
    intents.value = intents.value.filter((x) => x._id !== it._id)
    if (editingId.value === it._id) cancelEdit()
  } catch (e) { intentErr.value = e.message || 'Error al eliminar' }
}

const toggleActive = async (it) => {
  try {
    const upd = await store.updateIntent(it._id, { active: !it.active })
    const i = intents.value.findIndex((x) => x._id === it._id)
    if (i !== -1) intents.value[i] = upd
  } catch (e) { intentErr.value = e.message || 'Error' }
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
          <p class="text-[11px] text-gray-500 mt-2">Cada mensaje solo aplica las variables que le corresponden (indicadas abajo).</p>
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
      <div v-show="tab === 'intenciones'" class="grid md:grid-cols-5 gap-5">
        <!-- Formulario -->
        <div class="md:col-span-2 bg-white rounded-xl shadow p-5 self-start">
          <p class="font-medium text-brand-dark mb-3">{{ editingId ? 'Editar intención' : 'Nueva intención' }}</p>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Nombre</label>
              <input v-model="form.name" @input="onName" placeholder="Buscar plomero"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Clave</label>
              <input v-model="form.key" placeholder="buscar-plomero"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-brand-green outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Descripción</label>
              <textarea v-model="form.description" rows="2"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none"></textarea>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Frases de ejemplo, una por línea</label>
              <textarea v-model="form.examplesText" rows="4" placeholder="Necesito un plomero&#10;Busco alguien para una fuga"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none"></textarea>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Respuesta del bot <span class="text-brand-green font-mono">{name} {service}</span></label>
              <textarea v-model="form.response" rows="3" placeholder="Claro {name}, te ayudo a encontrar {service}."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none"></textarea>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Servicio que dispara la búsqueda (opcional)</label>
              <select v-model="form.service"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-brand-green outline-none">
                <option value="">— Solo responder, sin buscar —</option>
                <option v-for="c in categories" :key="c._id || c.name" :value="c.name">{{ c.name }}</option>
              </select>
            </div>
            <div class="flex items-center gap-4">
              <div>
                <label class="text-xs text-gray-600 block mb-1">Prioridad</label>
                <input type="number" v-model.number="form.priority"
                  class="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none" />
              </div>
              <label class="flex items-center gap-2 text-sm mt-5">
                <input type="checkbox" v-model="form.active" class="accent-brand-green" /> Activa
              </label>
            </div>

            <p v-if="intentErr" class="text-sm text-red-600">{{ intentErr }}</p>

            <div class="flex gap-2 pt-1">
              <button @click="submitIntent" :disabled="savingIntent"
                class="flex-1 bg-brand-green text-white py-2 rounded-lg font-medium hover:bg-brand-lightGreen disabled:opacity-50">
                {{ savingIntent ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear intención') }}
              </button>
              <button v-if="editingId" @click="cancelEdit"
                class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>

        <!-- Lista -->
        <div class="md:col-span-3 bg-white rounded-xl shadow p-5">
          <div class="flex items-center justify-between gap-3 mb-1">
            <div>
              <p class="font-medium text-brand-dark">Intenciones configuradas</p>
              <p class="text-xs text-gray-500">{{ filteredIntents.length }} de {{ intents.length }} visibles</p>
            </div>
            <input v-model="search" placeholder="Buscar intención..."
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:border-brand-green outline-none" />
          </div>

          <p v-if="intentErr && !intents.length" class="text-sm text-red-600 mt-4">{{ intentErr }}</p>
          <p v-else-if="!filteredIntents.length" class="text-sm text-gray-400 mt-6">No hay intenciones para mostrar.</p>

          <div v-else class="mt-3 space-y-2">
            <div v-for="it in filteredIntents" :key="it._id"
              class="border border-gray-200 rounded-lg p-3 hover:border-brand-green/60 hover:shadow-sm transition">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-brand-dark truncate">{{ it.name }}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full"
                      :class="it.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                      {{ it.active ? 'Activa' : 'Inactiva' }}
                    </span>
                    <span class="text-[10px] text-gray-400">P{{ it.priority }}</span>
                  </div>
                  <p class="text-xs text-gray-500 font-mono">{{ it.key }}</p>
                  <p v-if="it.service" class="text-[11px] text-brand-medium mt-0.5">🛠️ Busca: {{ it.service }}</p>
                  <p v-if="(it.examples||[]).length" class="text-[11px] text-gray-500 mt-1 truncate">
                    Ej: {{ (it.examples || []).slice(0, 3).join(' · ') }}
                  </p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button @click="toggleActive(it)" :title="it.active ? 'Desactivar' : 'Activar'"
                    class="text-xs px-2 py-1 rounded hover:bg-gray-100">{{ it.active ? '⏸️' : '▶️' }}</button>
                  <button @click="editIntent(it)" title="Editar"
                    class="text-xs px-2 py-1 rounded hover:bg-gray-100">✏️</button>
                  <button @click="removeIntent(it)" title="Eliminar"
                    class="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
