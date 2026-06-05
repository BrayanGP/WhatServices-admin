<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const requests = ref([])
const total = ref(0)
const loading = ref(true)
const filter = ref('')
const selected = ref(null)
const saving = ref(false)

const STATUSES = ['nueva', 'contactado', 'asignada', 'completada', 'cancelada']
const statusClass = (s) => ({
  nueva: 'bg-blue-100 text-brand-medium',
  contactado: 'bg-amber-100 text-amber-700',
  asignada: 'bg-purple-100 text-purple-700',
  completada: 'bg-green-100 text-green-700',
  cancelada: 'bg-gray-200 text-gray-500',
}[s] || 'bg-gray-100 text-gray-600')

const elapsed = (date) => {
  const ms = Date.now() - new Date(date).getTime()
  const h = Math.floor(ms / 3.6e6)
  if (h < 1) return `${Math.floor(ms / 60000)} min`
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} d`
}

const load = async () => {
  loading.value = true
  const data = await store.fetchRequests({ limit: 50, status: filter.value })
  requests.value = data.requests
  total.value = data.total
  loading.value = false
}

const open = async (r) => { selected.value = await store.fetchRequest(r._id) }

const changeStatus = async (status) => {
  saving.value = true
  try {
    await store.updateRequest(selected.value._id, { status })
    selected.value = await store.fetchRequest(selected.value._id)
    await load()
  } finally { saving.value = false }
}

const assign = async (providerId) => {
  saving.value = true
  try {
    await store.updateRequest(selected.value._id, { assignedProvider: providerId, status: 'asignada' })
    selected.value = await store.fetchRequest(selected.value._id)
    await load()
  } finally { saving.value = false }
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-800">Solicitudes ({{ total }})</h1>
      <select v-model="filter" @change="load" class="border rounded-lg px-3 py-1.5 text-sm">
        <option value="">Todas</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Lista -->
      <div class="bg-white rounded-xl shadow overflow-hidden lg:col-span-2">
        <div v-if="loading" class="p-4 text-gray-400 text-sm">Cargando...</div>
        <div v-else-if="!requests.length" class="p-4 text-gray-400 text-sm">Sin solicitudes aún.</div>
        <table v-else class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Cliente</th>
              <th class="px-4 py-3 text-left">Servicio</th>
              <th class="px-4 py-3 text-left">CP</th>
              <th class="px-4 py-3 text-left">Hace</th>
              <th class="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requests" :key="r._id" @click="open(r)"
              class="border-t hover:bg-gray-50 cursor-pointer"
              :class="{ 'bg-brand-base/10': selected && selected._id === r._id }">
              <td class="px-4 py-3 font-medium text-gray-800">{{ r.name || r.phone }}</td>
              <td class="px-4 py-3">{{ r.service }}</td>
              <td class="px-4 py-3 text-gray-500">{{ r.postalCode || '—' }}</td>
              <td class="px-4 py-3 text-gray-500">{{ elapsed(r.createdAt) }}</td>
              <td class="px-4 py-3"><span :class="statusClass(r.status)" class="text-xs px-2 py-1 rounded-full capitalize">{{ r.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detalle -->
      <div class="bg-white rounded-xl shadow p-5">
        <div v-if="!selected" class="text-gray-400 text-sm text-center py-10">Selecciona una solicitud</div>
        <template v-else>
          <p class="font-semibold text-gray-800">{{ selected.name || selected.phone }}</p>
          <p class="text-xs text-gray-500 mb-3">{{ selected.phone }} · {{ selected.service }} · CP {{ selected.postalCode || '—' }}</p>

          <p class="text-xs font-medium text-gray-600 mb-1">Estado</p>
          <div class="flex flex-wrap gap-1 mb-4">
            <button v-for="s in STATUSES" :key="s" @click="changeStatus(s)" :disabled="saving"
              class="text-xs px-2 py-1 rounded-full capitalize"
              :class="selected.status === s ? statusClass(s) + ' ring-2 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-500'">
              {{ s }}
            </button>
          </div>

          <p class="text-xs font-medium text-gray-600 mb-1">Proveedor asignado</p>
          <p class="text-sm mb-2">{{ selected.assignedProvider?.businessName || 'Ninguno' }}</p>

          <p class="text-xs font-medium text-gray-600 mb-1">Sugeridos (asignar)</p>
          <div class="space-y-1 mb-4">
            <button v-for="p in selected.suggestedProviders" :key="p._id" @click="assign(p._id)" :disabled="saving"
              class="block w-full text-left text-xs border rounded-lg px-2 py-1.5 hover:bg-gray-50"
              :class="{ 'border-purple-400 bg-purple-50': selected.assignedProvider?._id === p._id }">
              {{ p.businessName }} · ⭐ {{ p.rating?.average || 0 }} · {{ p.phone }}
            </button>
          </div>

          <p class="text-xs font-medium text-gray-600 mb-1">Historial</p>
          <ul class="space-y-1">
            <li v-for="(h, i) in selected.statusHistory" :key="i" class="text-xs text-gray-500">
              <span class="capitalize font-medium text-gray-700">{{ h.status }}</span>
              · {{ new Date(h.at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) }}
              <span v-if="h.note"> — {{ h.note }}</span>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>
