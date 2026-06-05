<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const providers = ref([])
const total = ref(0)
const loading = ref(false)
const categories = ref([])

// filtros
const q = ref('')
const category = ref('')

// modal detalle
const selected = ref(null)
// modal contraseña
const resetResult = ref(null) // { provider, password }
const resetting = ref(false)

const load = async () => {
  loading.value = true
  try {
    const data = await store.fetchProviders({ limit: 100, q: q.value, category: category.value })
    providers.value = data.providers
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const verify = async (p) => { const r = await store.toggleVerify(p._id); p.isVerified = r.isVerified }
const block = async (p) => { const r = await store.toggleBlockProvider(p._id); p.isBlocked = r.isBlocked }

const askReset = async (p) => {
  if (!confirm(`¿Reiniciar la contraseña de "${p.businessName}"? Se generará una nueva.`)) return
  resetting.value = true
  try {
    const r = await store.resetProviderPassword(p._id)
    if (r.password) resetResult.value = { provider: p, password: r.password }
    else alert(r.message || 'No se pudo reiniciar')
  } finally { resetting.value = false }
}

const copyPass = () => { navigator.clipboard?.writeText(resetResult.value.password) }

const email = (p) => p.userId?.email || '—'
const phone = (p) => p.phone || p.userId?.phone || '—'

onMounted(async () => {
  categories.value = await store.fetchCategories()
  await load()
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Proveedores ({{ total }})</h1>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-2 mb-4">
      <input v-model="q" @keyup.enter="load" placeholder="Buscar por nombre, negocio o teléfono..."
        class="flex-1 min-w-[220px] border rounded-lg px-3 py-2 text-sm" />
      <select v-model="category" @change="load" class="border rounded-lg px-3 py-2 text-sm">
        <option value="">Todos los giros</option>
        <option v-for="c in categories" :key="c._id" :value="c.name">{{ c.icon }} {{ c.name }}</option>
      </select>
      <button @click="load" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Buscar</button>
    </div>

    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <div v-if="loading" class="p-4 text-gray-400 text-sm">Cargando...</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Negocio / Nombre</th>
            <th class="px-4 py-3 text-left">Correo</th>
            <th class="px-4 py-3 text-left">Teléfono</th>
            <th class="px-4 py-3 text-left">Giros</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in providers" :key="p._id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-800">{{ p.businessName }}</p>
              <p class="text-xs text-gray-500">{{ p.ownerName || p.userId?.name }}</p>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ email(p) }}</td>
            <td class="px-4 py-3 text-gray-600">{{ phone(p) }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span v-for="c in (p.categories || []).slice(0,3)" :key="c" class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ c }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span :class="p.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="text-xs px-2 py-1 rounded-full">
                {{ p.isVerified ? '✓ Verificado' : 'Sin verificar' }}
              </span>
              <span v-if="p.isBlocked" class="ml-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Bloqueado</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2 text-xs">
                <button @click="selected = p" class="text-blue-600 hover:underline">Ver</button>
                <button @click="verify(p)" class="text-blue-600 hover:underline">{{ p.isVerified ? 'Quitar verif.' : 'Verificar' }}</button>
                <button @click="block(p)" :class="p.isBlocked ? 'text-green-600' : 'text-red-500'" class="hover:underline">{{ p.isBlocked ? 'Desbloquear' : 'Bloquear' }}</button>
                <button @click="askReset(p)" :disabled="resetting" class="text-amber-600 hover:underline disabled:opacity-50">Reiniciar contraseña</button>
              </div>
            </td>
          </tr>
          <tr v-if="!providers.length"><td colspan="6" class="px-4 py-8 text-center text-gray-400">Sin proveedores.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal detalle -->
    <div v-if="selected" class="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4" @click.self="selected = null">
      <div class="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="p-5 border-b flex items-center gap-4">
          <img v-if="selected.profilePhoto?.url" :src="selected.profilePhoto.url" class="w-16 h-16 rounded-full object-cover" />
          <div v-else class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">{{ selected.businessName?.[0] }}</div>
          <div>
            <h3 class="text-lg font-bold text-gray-800">{{ selected.businessName }}</h3>
            <p class="text-sm text-gray-500">{{ selected.ownerName || selected.userId?.name }}</p>
            <p class="text-yellow-500 text-sm">★ {{ selected.rating?.average || 0 }} ({{ selected.rating?.count || 0 }})</p>
          </div>
        </div>
        <div class="p-5 space-y-2 text-sm">
          <p><span class="text-gray-500">Correo:</span> {{ email(selected) }}</p>
          <p><span class="text-gray-500">Teléfono:</span> {{ phone(selected) }}</p>
          <p><span class="text-gray-500">Ciudad / CP:</span> {{ selected.city || '—' }} · {{ selected.postalCode || '—' }}</p>
          <p><span class="text-gray-500">Dirección:</span> {{ selected.address || '—' }}</p>
          <p><span class="text-gray-500">Disponibilidad:</span> {{ selected.availability }}</p>
          <p><span class="text-gray-500">Giros:</span> {{ (selected.categories || []).join(', ') || '—' }}</p>
          <p><span class="text-gray-500">Especialidades:</span> {{ (selected.specialties || []).join(', ') || '—' }}</p>
          <p><span class="text-gray-500">Descripción:</span> {{ selected.description || '—' }}</p>
          <p><span class="text-gray-500">Suscripción:</span> {{ selected.subscription?.status || '—' }}</p>
          <p><span class="text-gray-500">Registrado:</span> {{ new Date(selected.createdAt).toLocaleDateString('es-MX') }}</p>
          <div v-if="selected.photos?.length">
            <p class="text-gray-500 mb-1">Trabajos:</p>
            <div class="grid grid-cols-3 gap-2">
              <img v-for="ph in selected.photos" :key="ph.publicId" :src="ph.url" class="rounded-lg h-20 w-full object-cover" />
            </div>
          </div>
        </div>
        <div class="p-4 border-t text-right">
          <button @click="selected = null" class="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal contraseña reiniciada -->
    <div v-if="resetResult" class="fixed inset-0 bg-black/50 flex items-center justify-center z-30 p-4" @click.self="resetResult = null">
      <div class="bg-white rounded-xl max-w-sm w-full p-6 text-center">
        <h3 class="font-bold text-gray-800 mb-1">Contraseña reiniciada</h3>
        <p class="text-xs text-gray-500 mb-4">{{ resetResult.provider.businessName }} — comparte esta contraseña con el proveedor:</p>
        <div class="bg-gray-100 rounded-lg px-3 py-3 font-mono text-lg mb-3">{{ resetResult.password }}</div>
        <div class="flex gap-2 justify-center">
          <button @click="copyPass" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Copiar</button>
          <button @click="resetResult = null" class="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>
