import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API = import.meta.env.VITE_API_URL || '/api'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('accessToken'))
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!accessToken.value && ['admin', 'staff'].includes(user.value?.role))

  // Módulos a los que tiene acceso (admin = todos)
  const modules = computed(() => user.value?.modules || [])
  const canAccess = (key) => user.value?.role === 'admin' || modules.value.includes(key)

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error((await res.json()).message)
    const data = await res.json()
    if (!['admin', 'staff'].includes(data.user.role)) throw new Error('No tienes acceso al panel')
    accessToken.value = data.accessToken
    user.value = data.user
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }

  const authFetch = async (url, options = {}) => {
    let res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${accessToken.value}` },
      credentials: 'include',
    })
    if (res.status === 401) {
      const refreshRes = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' })
      if (refreshRes.ok) {
        const { accessToken: newToken } = await refreshRes.json()
        accessToken.value = newToken
        localStorage.setItem('accessToken', newToken)
        res = await fetch(url, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
          credentials: 'include',
        })
      } else {
        await logout()
      }
    }
    return res
  }

  return { accessToken, user, isLoggedIn, modules, canAccess, login, logout, authFetch }
})
