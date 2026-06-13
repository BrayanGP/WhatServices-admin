<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const showSidebar = computed(() => auth.isLoggedIn && route.path !== '/login')

// Menú móvil (cajón lateral). En desktop el sidebar es fijo.
const sidebarOpen = ref(false)
watch(() => route.path, () => { sidebarOpen.value = false })

// ----- Auto-logout por inactividad (30 minutos) -----
const IDLE_MS = 30 * 60 * 1000
let idleTimer = null
const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

const doLogout = async () => {
  if (!auth.isLoggedIn) return
  await auth.logout()
  router.push('/login')
}

const resetIdle = () => {
  clearTimeout(idleTimer)
  if (auth.isLoggedIn) idleTimer = setTimeout(doLogout, IDLE_MS)
}

onMounted(() => {
  events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }))
  resetIdle()
})
onUnmounted(() => {
  clearTimeout(idleTimer)
  events.forEach((e) => window.removeEventListener(e, resetIdle))
})
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <Sidebar v-if="showSidebar" :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Barra superior (solo móvil): botón de menú -->
      <header v-if="showSidebar" class="md:hidden sticky top-0 z-20 bg-brand-dark text-white flex items-center gap-3 px-4 py-3 shadow">
        <button @click="sidebarOpen = true" aria-label="Abrir menú" class="p-1 -ml-1">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="font-bold text-base"><span class="text-white">What</span><span class="text-brand-base">Services</span></span>
      </header>
      <main class="flex-1 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
