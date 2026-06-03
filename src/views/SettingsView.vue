<script setup>
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Configuración</h1>
    <div class="bg-white rounded-xl shadow p-6 max-w-sm">
      <h2 class="font-semibold text-gray-700 mb-4">Mi cuenta</h2>
      <p class="text-sm text-gray-600">Nombre: <span class="font-medium">{{ auth.user?.name }}</span></p>
      <p class="text-sm text-gray-600 mt-2">Rol: <span class="capitalize font-medium">{{ auth.user?.role }}</span></p>
    </div>
  </div>
</template>
