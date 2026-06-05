<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const showSidebar = computed(() => auth.isLoggedIn && route.path !== '/login')

// ----- Auto-logout por inactividad (5 minutos) -----
const IDLE_MS = 5 * 60 * 1000
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
    <Sidebar v-if="showSidebar" />
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>
