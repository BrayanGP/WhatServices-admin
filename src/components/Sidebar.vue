<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/providers', label: 'Proveedores', icon: '🔧' },
  { to: '/users', label: 'Usuarios', icon: '👥' },
  { to: '/subscriptions', label: 'Suscripciones', icon: '💳' },
  { to: '/categories', label: 'Categorías', icon: '🗂️' },
  { to: '/settings', label: 'Configuración', icon: '⚙️' },
]

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="w-56 bg-gray-900 text-white flex flex-col min-h-screen shrink-0">
    <div class="p-4 border-b border-gray-700">
      <h1 class="text-lg font-bold text-blue-400">WhatServices</h1>
      <p class="text-xs text-gray-400 mt-0.5">Panel de administración</p>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <router-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
        :class="{ 'bg-blue-600 text-white': $route.path === link.to }"
      >
        <span>{{ link.icon }}</span>
        <span>{{ link.label }}</span>
      </router-link>
    </nav>
    <div class="p-4 border-t border-gray-700">
      <p class="text-xs text-gray-400 mb-2 truncate">{{ auth.user?.name }}</p>
      <button @click="logout" class="text-xs text-red-400 hover:text-red-300">Cerrar sesión</button>
    </div>
  </aside>
</template>
