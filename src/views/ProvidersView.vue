<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const route = useRoute()
const router = useRouter()
const providers = ref([])
const total = ref(0)
const loading = ref(false)
const categories = ref([])

const q = ref('')
const loc = ref('')
const category = ref('')

const photoOf = (p) => p.profilePhoto?.url || p.photos?.[0]?.url || null

const selected = ref(null)
const resetResult = ref(null)
const resetting = ref(false)
const copied = ref(false)

const HEADER_BG = 'linear-gradient(135deg, #075E54 0%, #0B1E2E 100%)'

const load = async () => {
  loading.value = true
  try {
    const data = await store.fetchProviders({ limit: 100, q: q.value, loc: loc.value, category: category.value })
    providers.value = data.providers
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const sync = (p) => { const i = providers.value.findIndex((x) => x._id === p._id); if (i !== -1) providers.value[i] = { ...providers.value[i], ...p } }
const verify = async (p) => { const r = await store.toggleVerify(p._id); p.isVerified = r.isVerified; sync(p) }
const block = async (p) => { const r = await store.toggleBlockProvider(p._id); p.isBlocked = r.isBlocked; sync(p) }

const askReset = async (p) => {
  if (!confirm(`¿Reiniciar la contraseña de "${p.businessName}"? Se generará una nueva.`)) return
  resetting.value = true
  try {
    const r = await store.resetProviderPassword(p._id)
    if (r.password) { resetResult.value = { provider: p, password: r.password }; copied.value = false }
    else alert(r.message || 'No se pudo reiniciar')
  } finally { resetting.value = false }
}

const copyPass = () => { navigator.clipboard?.writeText(resetResult.value.password); copied.value = true }

const email = (p) => p.userId?.email || '—'
const phone = (p) => p.phone || p.userId?.phone || '—'
const since = (d) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

// ---- Categorías verificadas vs no verificadas (alerta) ----
const activeCats = computed(() => categories.value.filter((c) => c.status === 'active'))
const isVerifiedCat = (name) => categories.value.some((c) => c.name === name && c.status === 'active')
const selectedHasAlert = computed(() => (selected.value?.categories || []).some((c) => !isVerifiedCat(c)))

// ---- Editar giros/oficios del proveedor ----
const editingCats = ref(false)
const catDraft = ref([])
const savingCats = ref(false)
const startEditCats = () => { catDraft.value = [...(selected.value.categories || [])]; editingCats.value = true }
const toggleCat = (name) => {
  const i = catDraft.value.indexOf(name)
  if (i === -1) catDraft.value.push(name); else catDraft.value.splice(i, 1)
}
const saveCats = async () => {
  savingCats.value = true
  try {
    const updated = await store.updateProviderCategories(selected.value._id, catDraft.value)
    selected.value.categories = updated.categories
    sync(selected.value)
    editingCats.value = false
  } catch (e) { alert(e.message || 'No se pudo guardar') }
  finally { savingCats.value = false }
}
const openProvider = (p) => { editingCats.value = false; selected.value = p }

onMounted(async () => {
  categories.value = await store.fetchCategories()
  await load()
  // Deep-link desde el modal de conflictos de categorías: /providers?provider=<id>
  const pid = route.query.provider
  if (pid) {
    const p = providers.value.find((x) => String(x._id) === String(pid))
    if (p) openProvider(p)
    router.replace({ path: '/providers' }) // limpia el query
  }
})
</script>

<template>
  <div class="p-6">
    <!-- Encabezado con acento de marca -->
    <div class="flex items-end justify-between mb-1">
      <h1 class="text-2xl font-bold text-brand-dark">Proveedores</h1>
      <span class="text-sm text-gray-400">{{ total }} registrados</span>
    </div>
    <div class="h-1 w-16 bg-brand-base rounded-full mb-3"></div>
    <p class="text-sm text-gray-500 mb-5">Haz clic en una tarjeta para ver el detalle y gestionar al proveedor.</p>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-2 mb-5">
      <input v-model="q" @keyup.enter="load" placeholder="Nombre, negocio o teléfono..."
        class="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base" />
      <input v-model="loc" @keyup.enter="load" placeholder="Domicilio o C.P. ..."
        class="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base" />
      <select v-model="category" @change="load"
        class="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base">
        <option value="">Todos los giros/oficios</option>
        <option v-for="c in categories" :key="c._id" :value="c.name">{{ c.icon }} {{ c.name }}</option>
      </select>
      <button @click="load" class="bg-brand-green text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-lightGreen transition-colors">Buscar</button>
    </div>

    <div v-if="loading" class="text-gray-400 text-sm py-10 text-center">Cargando...</div>
    <div v-else-if="!providers.length" class="text-gray-400 text-sm py-10 text-center bg-white rounded-xl shadow-sm">Sin proveedores.</div>

    <!-- Tarjetas clicables -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div v-for="p in providers" :key="p._id" @click="openProvider(p)"
        class="group bg-white rounded-xl border-l-4 border-brand-base/30 shadow-sm hover:shadow-lg hover:border-brand-base transition-all cursor-pointer p-4 flex items-center gap-4">
        <!-- Avatar -->
        <img v-if="photoOf(p)" :src="photoOf(p)" class="w-14 h-14 rounded-full object-cover ring-2 ring-brand-base/20 shrink-0" />
        <div v-else class="w-14 h-14 rounded-full bg-brand-base/15 flex items-center justify-center text-xl font-bold text-brand-medium shrink-0">{{ p.businessName?.[0] }}</div>

        <!-- Info -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold text-brand-dark truncate group-hover:text-brand-green transition-colors">{{ p.businessName }}</p>
            <span v-if="p.isVerified" class="text-[10px] bg-brand-base/15 text-brand-medium px-2 py-0.5 rounded-full">✓ Verificado</span>
            <span v-else class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Sin verificar</span>
            <span v-if="p.isBlocked" class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Bloqueado</span>
          </div>
          <p class="text-xs text-gray-600 mt-0.5">{{ p.ownerName || p.userId?.name }}</p>
          <p class="text-xs text-gray-400 truncate">✉ {{ email(p) }} · 📞 {{ phone(p) }}</p>
          <div class="flex flex-wrap gap-1 mt-1.5">
            <span v-for="c in (p.categories || []).slice(0,4)" :key="c"
              :class="isVerifiedCat(c) ? 'bg-brand-base/10 text-brand-medium' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'"
              class="text-[10px] px-2 py-0.5 rounded-full">{{ isVerifiedCat(c) ? '' : '⚠ ' }}{{ c }}</span>
          </div>
        </div>

        <!-- Lateral: rating + ubicación -->
        <div class="text-right shrink-0">
          <p class="text-yellow-500 text-sm font-semibold">★ {{ p.rating?.average || 0 }}</p>
          <p class="text-[10px] text-gray-400">{{ p.rating?.count || 0 }} reseñas</p>
          <p class="text-[10px] text-gray-400 mt-1">📍 {{ p.city || '—' }}<span v-if="p.postalCode"> · {{ p.postalCode }}</span></p>
        </div>
      </div>
    </div>

    <!-- Modal detalle -->
    <div v-if="selected" class="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-20 p-4" @click.self="selected = null">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        <!-- Cabecera (degradado garantizado por inline style) -->
        <div class="p-6 text-white relative rounded-t-2xl" :style="{ background: HEADER_BG }">
          <button @click="selected = null" class="absolute top-3 right-4 text-white/70 hover:text-white text-xl">✕</button>
          <div class="flex items-center gap-4">
            <img v-if="photoOf(selected)" :src="photoOf(selected)" class="w-20 h-20 rounded-full object-cover border-2 border-white/40" />
            <div v-else class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">{{ selected.businessName?.[0] }}</div>
            <div>
              <h3 class="text-xl font-bold">{{ selected.businessName }}</h3>
              <p class="text-sm" style="color:#9ff5c9">{{ selected.ownerName || selected.userId?.name }}</p>
              <p class="text-sm">★ {{ selected.rating?.average || 0 }} <span class="text-white/60">({{ selected.rating?.count || 0 }} reseñas)</span></p>
            </div>
          </div>
          <div class="flex gap-2 mt-3">
            <span :class="selected.isVerified ? 'bg-white/25' : 'bg-white/10'" class="text-xs px-2 py-1 rounded-full">{{ selected.isVerified ? '✓ Verificado' : 'Sin verificar' }}</span>
            <span v-if="selected.isBlocked" class="text-xs px-2 py-1 rounded-full bg-red-500/80">Bloqueado</span>
            <span class="text-xs px-2 py-1 rounded-full bg-white/10 capitalize">{{ selected.availability }}</span>
            <span v-if="selectedHasAlert" class="text-xs px-2 py-1 rounded-full bg-amber-400 text-amber-900 font-medium">⚠ Categoría sin verificar</span>
          </div>
        </div>

        <!-- Datos -->
        <div class="p-6 space-y-3 text-sm">
          <div class="grid grid-cols-2 gap-3">
            <div><p class="text-gray-400 text-xs">Correo</p><p class="text-brand-dark break-all">{{ email(selected) }}</p></div>
            <div><p class="text-gray-400 text-xs">Teléfono</p><p class="text-brand-dark">{{ phone(selected) }}</p></div>
            <div><p class="text-gray-400 text-xs">Ciudad / C.P.</p><p class="text-brand-dark">{{ selected.city || '—' }} · {{ selected.postalCode || '—' }}</p></div>
            <div><p class="text-gray-400 text-xs">Registrado</p><p class="text-brand-dark">{{ since(selected.createdAt) }}</p></div>
          </div>
          <div><p class="text-gray-400 text-xs">Domicilio</p><p class="text-brand-dark">{{ selected.address || '—' }}</p></div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <p class="text-gray-400 text-xs">Giros / Oficios</p>
              <button v-if="!editingCats" @click="startEditCats" class="text-xs text-brand-medium hover:underline">✏️ Editar</button>
            </div>

            <!-- Vista: chips (amarillo + alerta si la categoría no está verificada) -->
            <div v-if="!editingCats" class="flex flex-wrap gap-1">
              <span v-for="c in (selected.categories || [])" :key="c"
                :class="isVerifiedCat(c) ? 'bg-brand-base/10 text-brand-medium' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'"
                class="text-xs px-2 py-1 rounded-full">{{ isVerifiedCat(c) ? '' : '⚠ ' }}{{ c }}</span>
              <span v-if="!selected.categories?.length" class="text-gray-400">—</span>
            </div>
            <p v-if="!editingCats && selectedHasAlert" class="text-[11px] text-amber-600 mt-1">
              ⚠ Tiene categoría(s) sin verificar. Haz clic en "Editar" para reasignar a una válida.
            </p>

            <!-- Edición: elegir entre categorías verificadas -->
            <div v-else-if="editingCats" class="border border-gray-200 rounded-lg p-2">
              <p class="text-[11px] text-gray-500 mb-2">Selecciona los giros/oficios (solo categorías verificadas):</p>
              <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                <button v-for="c in activeCats" :key="c._id" type="button" @click="toggleCat(c.name)"
                  :class="catDraft.includes(c.name) ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  class="text-xs px-2.5 py-1 rounded-full transition-colors">{{ c.icon }} {{ c.name }}</button>
              </div>
              <!-- Categorías actuales no verificadas (se quitarán si no se reemplazan) -->
              <div v-if="catDraft.some((c) => !isVerifiedCat(c))" class="mt-2 pt-2 border-t border-gray-100">
                <p class="text-[11px] text-amber-600 mb-1">Sin verificar (clic para quitar):</p>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="c in catDraft.filter((x) => !isVerifiedCat(x))" :key="c" type="button" @click="toggleCat(c)"
                    class="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300 hover:bg-amber-200">⚠ {{ c }} ✕</button>
                </div>
              </div>
              <div class="flex gap-2 mt-3">
                <button @click="saveCats" :disabled="savingCats"
                  class="bg-brand-green text-white px-3 py-1.5 rounded-lg text-sm hover:bg-brand-lightGreen disabled:opacity-50">
                  {{ savingCats ? 'Guardando...' : 'Guardar' }}
                </button>
                <button @click="editingCats = false" class="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          </div>
          <div><p class="text-gray-400 text-xs">Descripción</p><p class="text-brand-dark">{{ selected.description || '—' }}</p></div>
          <div v-if="selected.photos?.length">
            <p class="text-gray-400 text-xs mb-1">Trabajos</p>
            <div class="grid grid-cols-3 gap-2">
              <img v-for="ph in selected.photos" :key="ph.publicId" :src="ph.url" class="rounded-lg h-20 w-full object-cover" />
            </div>
          </div>
        </div>

        <!-- Acciones (solo aquí) -->
        <div class="p-4 border-t flex flex-wrap gap-2 justify-end bg-gray-50 rounded-b-2xl">
          <button @click="verify(selected)" class="text-sm border border-brand-green text-brand-green px-3 py-1.5 rounded-lg hover:bg-brand-green hover:text-white transition-colors">
            {{ selected.isVerified ? 'Quitar verificación' : 'Verificar' }}
          </button>
          <button @click="block(selected)" class="text-sm border px-3 py-1.5 rounded-lg transition-colors"
            :class="selected.isBlocked ? 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white' : 'border-red-400 text-red-500 hover:bg-red-500 hover:text-white'">
            {{ selected.isBlocked ? 'Desbloquear' : 'Bloquear' }}
          </button>
          <button @click="askReset(selected)" :disabled="resetting" class="text-sm border border-amber-400 text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-50">
            Reiniciar contraseña
          </button>
        </div>
      </div>
    </div>

    <!-- Modal contraseña -->
    <div v-if="resetResult" class="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-30 p-4" @click.self="resetResult = null">
      <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-base/15 flex items-center justify-center text-2xl">🔑</div>
        <h3 class="font-bold text-brand-dark mb-1">Contraseña reiniciada</h3>
        <p class="text-xs text-gray-500 mb-4">{{ resetResult.provider.businessName }} — comparte esta contraseña:</p>
        <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 font-mono text-lg mb-3 text-brand-dark">{{ resetResult.password }}</div>
        <div class="flex gap-2 justify-center">
          <button @click="copyPass" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-lightGreen transition-colors">{{ copied ? '✓ Copiado' : 'Copiar' }}</button>
          <button @click="resetResult = null" class="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>
