<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import miLogo from '../assets/logoWhatServices.png'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Captcha simple (operación aleatoria) + honeypot anti-bots
const cA = ref(0)
const cB = ref(0)
const cOp = ref('+')
const cExpected = ref(0)
const cAns = ref('')
const hp = ref('')
const genCaptcha = () => {
  cA.value = Math.floor(Math.random() * 8) + 2
  cB.value = Math.floor(Math.random() * 8) + 2
  cOp.value = Math.random() < 0.5 ? '+' : '×'
  cExpected.value = cOp.value === '+' ? cA.value + cB.value : cA.value * cB.value
  cAns.value = ''
}
genCaptcha()

const submit = async () => {
  error.value = ''
  if (hp.value) return // bot detectado (honeypot)
  if (Number(cAns.value) !== cExpected.value) { error.value = 'Captcha incorrecto'; genCaptcha(); return }
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message
    genCaptcha()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-dark px-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
      <div class="flex flex-col items-center mb-6">
        <div class="h-20 w-20 rounded-full bg-brand-base/10 flex items-center justify-center mb-3 overflow-hidden">
          <img :src="miLogo" alt="WhatServices" class="h-16 w-16 object-contain" />
        </div>
        <h1 class="text-2xl font-bold text-brand-dark">WhatServices</h1>
        <p class="text-sm text-gray-500">Panel de administración</p>
      </div>
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-4">{{ error }}</div>
      <input v-model="email" type="email" placeholder="Correo electrónico"
        class="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
      <input v-model="password" type="password" placeholder="Contraseña" @keyup.enter="submit"
        class="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
      <!-- Honeypot anti-bots (oculto) -->
      <input v-model="hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true"
        class="absolute opacity-0 h-0 w-0 -left-[9999px]" />
      <!-- Captcha -->
      <div class="flex items-center gap-2 mb-5">
        <span class="text-sm text-gray-600 shrink-0">¿Cuánto es <b>{{ cA }} {{ cOp }} {{ cB }}</b>?</span>
        <input v-model="cAns" inputmode="numeric" placeholder="Resultado" @keyup.enter="submit"
          class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
        <button type="button" @click="genCaptcha" title="Otro reto" class="text-gray-400 hover:text-gray-600">🔄</button>
      </div>
      <button @click="submit" :disabled="loading"
        class="w-full bg-brand-green text-white py-2.5 rounded-lg hover:bg-brand-lightGreen disabled:opacity-50 font-semibold transition-colors">
        {{ loading ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </div>
  </div>
</template>
