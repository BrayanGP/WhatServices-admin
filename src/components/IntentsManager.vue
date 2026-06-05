<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const emit = defineEmits(['changed'])
const store = useAdminStore()

const intents = ref([])
const categories = ref([])
const err = ref('')
const search = ref('')
const loading = ref(true)

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const blank = () => ({ name: '', key: '', description: '', examplesText: '', response: '', service: '', priority: 10, active: true })
const form = ref(blank())
const editingId = ref(null)
const saving = ref(false)

// Plantillas rápidas de intenciones comunes
const QUICK = [
  { name: 'Saludo', key: 'saludo', examples: ['hola', 'buenas', 'buenos dias', 'que tal'], response: '¡{greeting}! 👋 ¿En qué te puedo ayudar?' },
  { name: 'Despedida', key: 'despedida', examples: ['adios', 'hasta luego', 'bye', 'nos vemos'], response: '¡Gracias por escribir! 🙌 Aquí estamos cuando nos necesites.' },
  { name: 'Agradecimiento', key: 'agradecimiento', examples: ['gracias', 'muchas gracias', 'te lo agradezco'], response: '¡Con gusto! 😊' },
  { name: 'Hablar con humano', key: 'hablar-humano', examples: ['quiero hablar con una persona', 'asesor', 'humano', 'agente'], response: '¡Claro! Te paso con un asesor. 🙋' },
  { name: 'Precios', key: 'precios', examples: ['cuanto cuesta', 'precio', 'tarifa', 'costo'], response: 'El precio depende del servicio; cada profesional te cotiza sin costo. 💰' },
  { name: 'Horario', key: 'horario', examples: ['horario', 'a que hora', 'cuando abren'], response: 'Atendemos de {open}:00 a {close}:00 hrs. 🕗' },
]
const existsKey = (k) => intents.value.some((i) => i.key === k)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return intents.value
  return intents.value.filter((i) => [i.name, i.key, i.description, (i.examples || []).join(' ')].join(' ').toLowerCase().includes(q))
})

onMounted(async () => {
  const [its, cats] = await Promise.all([
    store.fetchIntents().catch(() => { err.value = 'No se pudieron cargar las intenciones.'; return [] }),
    store.fetchCategories().catch(() => []),
  ])
  intents.value = its || []
  categories.value = Array.isArray(cats) ? cats : (cats.categories || [])
  loading.value = false
})

const onName = () => { if (!editingId.value) form.value.key = slugify(form.value.name) }

const editIntent = (it) => {
  editingId.value = it._id
  form.value = {
    name: it.name, key: it.key, description: it.description || '',
    examplesText: (it.examples || []).join('\n'), response: it.response || '',
    service: it.service || '', priority: it.priority ?? 10, active: it.active !== false,
  }
}
const cancelEdit = () => { editingId.value = null; form.value = blank() }

const submit = async () => {
  if (!form.value.name.trim()) { err.value = 'El nombre es obligatorio'; return }
  saving.value = true; err.value = ''
  const payload = {
    name: form.value.name, key: form.value.key || slugify(form.value.name), description: form.value.description,
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
    cancelEdit(); emit('changed')
  } catch (e) { err.value = e.message || 'Error al guardar' }
  finally { saving.value = false }
}

const remove = async (it) => {
  if (!confirm(`¿Eliminar la intención "${it.name}"?`)) return
  try { await store.deleteIntent(it._id); intents.value = intents.value.filter((x) => x._id !== it._id); emit('changed') }
  catch (e) { err.value = e.message || 'Error' }
}

const toggleActive = async (it) => {
  try {
    const upd = await store.updateIntent(it._id, { active: !it.active })
    const i = intents.value.findIndex((x) => x._id === it._id)
    if (i !== -1) intents.value[i] = upd; emit('changed')
  } catch (e) { err.value = e.message || 'Error' }
}

const addQuick = async (q) => {
  if (existsKey(q.key)) { err.value = `Ya existe la intención "${q.name}"`; return }
  try { intents.value.unshift(await store.createIntent({ ...q, priority: 10, active: true })); emit('changed') }
  catch (e) { err.value = e.message || 'Error' }
}

// ---- Probar una frase ----
const testText = ref('')
const testResult = ref(undefined)
const runTest = () => {
  const nl = norm(testText.value)
  if (!nl) { testResult.value = undefined; return }
  const sorted = [...intents.value].filter((i) => i.active !== false).sort((a, b) => (b.priority || 0) - (a.priority || 0))
  for (const it of sorted) {
    for (const ex of (it.examples || [])) {
      const ne = norm(ex)
      if (ne && (nl.includes(ne) || ne.split(' ').some((w) => w.length > 3 && nl.includes(w)))) { testResult.value = it; return }
    }
  }
  testResult.value = null
}
</script>

<template>
  <div>
    <div v-if="loading" class="text-gray-400 text-sm">Cargando intenciones…</div>
    <template v-else>
      <!-- Probar + plantillas rápidas -->
      <div class="grid md:grid-cols-2 gap-3 mb-4">
        <div class="bg-brand-light/40 border border-brand-green/30 rounded-xl p-3">
          <p class="text-sm font-medium text-brand-dark mb-2">🧪 Probar una frase</p>
          <div class="flex gap-2">
            <input v-model="testText" @keyup.enter="runTest" placeholder="Ej: necesito un plomero"
              class="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-brand-green outline-none" />
            <button @click="runTest" class="text-sm px-3 py-1.5 rounded-lg bg-brand-green text-white hover:bg-brand-lightGreen">Probar</button>
          </div>
          <p v-if="testResult" class="text-xs mt-2 text-green-700">✅ Coincide con <b>{{ testResult.name }}</b><span v-if="testResult.service"> · busca {{ testResult.service }}</span></p>
          <p v-else-if="testResult === null" class="text-xs mt-2 text-gray-500">❌ Ninguna intención coincide.</p>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p class="text-sm font-medium text-brand-dark mb-2">⚡ Agregar rápido</p>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="q in QUICK" :key="q.key" @click="addQuick(q)" :disabled="existsKey(q.key)"
              class="text-xs px-2.5 py-1 rounded-full border transition"
              :class="existsKey(q.key) ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-brand-green text-brand-medium hover:bg-green-50'">
              + {{ q.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-5 gap-4">
        <!-- Form -->
        <div class="md:col-span-2 bg-white rounded-xl border border-gray-200 p-4 self-start">
          <p class="font-medium text-brand-dark mb-3">{{ editingId ? 'Editar intención' : 'Nueva intención' }}</p>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Nombre</label>
              <input v-model="form.name" @input="onName" placeholder="Buscar plomero" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Clave</label>
              <input v-model="form.key" placeholder="buscar-plomero" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-brand-green outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Frases de ejemplo, una por línea</label>
              <textarea v-model="form.examplesText" rows="4" placeholder="Necesito un plomero&#10;Se rompió un tubo" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none"></textarea>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Respuesta del bot <span class="text-brand-green font-mono">{name} {service} {greeting}</span></label>
              <textarea v-model="form.response" rows="2" placeholder="Claro {name}, te ayudo a encontrar {service}." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none"></textarea>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Servicio que dispara la búsqueda (opcional)</label>
              <select v-model="form.service" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-brand-green outline-none">
                <option value="">— Solo responder —</option>
                <option v-for="c in categories" :key="c._id || c.name" :value="c.name">{{ c.name }}</option>
              </select>
            </div>
            <div class="flex items-center gap-4">
              <div>
                <label class="text-xs text-gray-600 block mb-1">Prioridad</label>
                <input type="number" v-model.number="form.priority" class="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none" />
              </div>
              <label class="flex items-center gap-2 text-sm mt-5"><input type="checkbox" v-model="form.active" class="accent-brand-green" /> Activa</label>
            </div>
            <p v-if="err" class="text-sm text-red-600">{{ err }}</p>
            <div class="flex gap-2 pt-1">
              <button @click="submit" :disabled="saving" class="flex-1 bg-brand-green text-white py-2 rounded-lg font-medium hover:bg-brand-lightGreen disabled:opacity-50">
                {{ saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear intención') }}
              </button>
              <button v-if="editingId" @click="cancelEdit" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>

        <!-- List -->
        <div class="md:col-span-3 bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between gap-3 mb-1">
            <div>
              <p class="font-medium text-brand-dark">Intenciones configuradas</p>
              <p class="text-xs text-gray-500">{{ filtered.length }} de {{ intents.length }} visibles</p>
            </div>
            <input v-model="search" placeholder="Buscar..." class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-44 focus:border-brand-green outline-none" />
          </div>
          <p v-if="!filtered.length" class="text-sm text-gray-400 mt-6">No hay intenciones para mostrar.</p>
          <div v-else class="mt-3 space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            <div v-for="it in filtered" :key="it._id" class="border border-gray-200 rounded-lg p-3 hover:border-brand-green/60 hover:shadow-sm transition">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-brand-dark truncate">{{ it.name }}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full" :class="it.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">{{ it.active ? 'Activa' : 'Inactiva' }}</span>
                    <span class="text-[10px] text-gray-400">P{{ it.priority }}</span>
                  </div>
                  <p class="text-xs text-gray-500 font-mono">{{ it.key }}</p>
                  <p v-if="it.service" class="text-[11px] text-brand-medium mt-0.5">🛠️ Busca: {{ it.service }}</p>
                  <p v-if="(it.examples||[]).length" class="text-[11px] text-gray-500 mt-1 truncate">Ej: {{ (it.examples || []).slice(0, 3).join(' · ') }}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button @click="toggleActive(it)" class="text-xs px-2 py-1 rounded hover:bg-gray-100">{{ it.active ? '⏸️' : '▶️' }}</button>
                  <button @click="editIntent(it)" class="text-xs px-2 py-1 rounded hover:bg-gray-100">✏️</button>
                  <button @click="remove(it)" class="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
