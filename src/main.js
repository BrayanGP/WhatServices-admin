import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Adjunta la API key (header x-api-key) a todas las llamadas al backend.
const API_KEY = import.meta.env.VITE_API_KEY
const API_BASE = import.meta.env.VITE_API_URL || '/api'
if (API_KEY) {
  const origFetch = window.fetch.bind(window)
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    if (url.startsWith(API_BASE)) {
      const headers = new Headers(init.headers || {})
      headers.set('x-api-key', API_KEY)
      init = { ...init, headers }
    }
    return origFetch(input, init)
  }
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
