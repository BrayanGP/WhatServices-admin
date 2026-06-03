<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const submit = async () => {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4">
    <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">WhatServices</h1>
        <p class="text-sm text-gray-500 mt-1">Panel de administración</p>
      </div>
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-4">{{ error }}</div>
      <input v-model="email" type="email" placeholder="Correo electrónico" class="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
      <input v-model="password" type="password" placeholder="Contraseña" class="w-full border rounded-lg px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-300" @keyup.enter="submit" />
      <button @click="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors">
        {{ loading ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </div>
  </div>
</template>
