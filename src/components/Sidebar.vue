<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import miLogo from '../assets/logoWhatServices.png'

const auth = useAuthStore()
const router = useRouter()

const allLinks = [
  { to: '/', label: 'Dashboard', icon: '📊', module: 'dashboard' },
  { to: '/providers', label: 'Proveedores', icon: '🔧', module: 'providers' },
  { to: '/users', label: 'Usuarios', icon: '👥', module: 'users' },
  { to: '/roles', label: 'Roles', icon: '🛡️', module: 'roles' },
  { to: '/conversations', label: 'Conversaciones', icon: '💬', module: 'conversations' },
  { to: '/requests', label: 'Solicitudes', icon: '📋', module: 'requests' },
  { to: '/whatsapp', label: 'WhatsApp', icon: '📱', module: 'whatsapp' },
  { to: '/bot', label: 'Bot', icon: '🤖', module: 'bot' },
  { to: '/subscriptions', label: 'Suscripciones', icon: '💳', module: 'subscriptions' },
  { to: '/categories', label: 'Categorías', icon: '🗂️', module: 'categories' },
  { to: '/settings', label: 'Configuración', icon: '⚙️', module: 'settings' },
]

// Solo los módulos a los que el usuario tiene acceso (admin = todos)
const links = computed(() => allLinks.filter((l) => auth.canAccess(l.module)))

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="w-56 bg-brand-dark text-white flex flex-col min-h-screen shrink-0">
    <div class="p-4 border-b border-white/10 flex items-center gap-3">
      <div class="h-10 w-10 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
        <img :src="miLogo" alt="WhatServices" class="h-8 w-8 object-contain" />
      </div>
      <div>
        <h1 class="text-base font-bold leading-tight">
          <span class="text-white">What</span><span class="text-brand-base">Services</span>
        </h1>
        <p class="text-[10px] text-gray-400">Panel de administración</p>
      </div>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <router-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm"
        :class="{ 'bg-brand-green text-white shadow-sm': $route.path === link.to }"
      >
        <span>{{ link.icon }}</span>
        <span>{{ link.label }}</span>
      </router-link>
    </nav>
    <div class="p-4 border-t border-white/10">
      <p class="text-xs text-gray-400 mb-2 truncate">{{ auth.user?.name }}</p>
      <button @click="logout" class="text-xs text-red-400 hover:text-red-300">Cerrar sesión</button>
    </div>
  </aside>
</template>
