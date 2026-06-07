<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const providers = ref([])

onMounted(async () => {
  const data = await store.fetchProviders({ limit: 100 })
  providers.value = data.providers
})

const statusClass = (s) => ({
  trial: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}[s] || 'bg-gray-100 text-gray-500')
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Suscripciones</h1>
    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Proveedor</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">Período hasta</th>
            <th class="px-4 py-3 text-left">Stripe ID</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in providers" :key="p._id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ p.businessName }}</td>
            <td class="px-4 py-3">
              <span :class="statusClass(p.subscription?.status)" class="text-xs px-2 py-1 rounded-full capitalize">
                {{ p.subscription?.status || '—' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs">
              {{ p.subscription?.currentPeriodEnd ? new Date(p.subscription.currentPeriodEnd).toLocaleDateString('es-MX') : '—' }}
            </td>
            <td class="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[180px]">
              {{ p.subscription?.stripeSubscriptionId || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
