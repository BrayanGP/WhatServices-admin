<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'

const auth = useAuthStore()
const route = useRoute()
const showSidebar = computed(() => auth.isLoggedIn && route.path !== '/login')
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <Sidebar v-if="showSidebar" />
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>
