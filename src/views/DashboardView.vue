<script setup>
import { ref, onMounted } from 'vue'
import StatCard from '../components/StatCard.vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const stats = ref({ providers: 0, users: 0, categories: 0 })
const loading = ref(true)

onMounted(async () => {
  const [p, u, c] = await Promise.all([
    store.fetchProviders({ limit: 1 }),
    store.fetchUsers({ limit: 1 }),
    store.fetchCategories(),
  ])
  stats.value = { providers: p.total, users: u.total, categories: c.length }
  loading.value = false
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
    <div v-if="loading" class="text-gray-400">Cargando estadísticas...</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Proveedores registrados" :value="stats.providers" icon="🔧" />
      <StatCard title="Usuarios registrados" :value="stats.users" icon="👥" />
      <StatCard title="Categorías activas" :value="stats.categories" icon="🗂️" />
    </div>
  </div>
</template>
