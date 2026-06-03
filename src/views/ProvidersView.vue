<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const providers = ref([])
const total = ref(0)

onMounted(async () => {
  const data = await store.fetchProviders({ limit: 50 })
  providers.value = data.providers
  total.value = data.total
})

const verify = async (p) => {
  const { isVerified } = await store.toggleVerify(p._id)
  p.isVerified = isVerified
}

const block = async (p) => {
  const { isBlocked } = await store.toggleBlockProvider(p._id)
  p.isBlocked = isBlocked
}
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Proveedores ({{ total }})</h1>
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Negocio</th>
            <th class="px-4 py-3 text-left">Ciudad</th>
            <th class="px-4 py-3 text-left">Verificado</th>
            <th class="px-4 py-3 text-left">Suscripción</th>
            <th class="px-4 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in providers" :key="p._id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ p.businessName }}</td>
            <td class="px-4 py-3 text-gray-500">{{ p.city }}</td>
            <td class="px-4 py-3">
              <span :class="p.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-1 rounded-full text-xs">
                {{ p.isVerified ? '✓ Verificado' : 'Sin verificar' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs capitalize text-gray-500">{{ p.subscription?.status || '—' }}</span>
            </td>
            <td class="px-4 py-3 space-x-3">
              <button @click="verify(p)" class="text-xs text-blue-600 hover:underline">
                {{ p.isVerified ? 'Quitar verificación' : 'Verificar' }}
              </button>
              <button @click="block(p)" :class="p.isBlocked ? 'text-green-600' : 'text-red-500'" class="text-xs hover:underline">
                {{ p.isBlocked ? 'Desbloquear' : 'Bloquear' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
