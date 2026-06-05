<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const users = ref([])
const total = ref(0)

onMounted(async () => {
  const data = await store.fetchUsers({ limit: 50 })
  users.value = data.users
  total.value = data.total
})

const block = async (u) => {
  const { isBlocked } = await store.toggleBlockUser(u._id)
  u.isBlocked = isBlocked
}
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Usuarios ({{ total }})</h1>
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Email</th>
            <th class="px-4 py-3 text-left">Rol</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u._id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ u.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ u.email }}</td>
            <td class="px-4 py-3">
              <span class="capitalize text-xs bg-brand-base/10 text-brand-medium px-2 py-1 rounded-full">{{ u.role }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'" class="text-xs px-2 py-1 rounded-full">
                {{ u.isBlocked ? 'Bloqueado' : 'Activo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button @click="block(u)" :class="u.isBlocked ? 'text-green-600' : 'text-red-500'" class="text-xs hover:underline">
                {{ u.isBlocked ? 'Desbloquear' : 'Bloquear' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
