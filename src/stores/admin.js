import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

const API = import.meta.env.VITE_API_URL || '/api'

export const useAdminStore = defineStore('admin', () => {
  const auth = useAuthStore()

  const fetchProviders = async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const res = await auth.authFetch(`${API}/admin/providers?${q}`)
    return res.json()
  }

  const toggleVerify = async (id) => {
    const res = await auth.authFetch(`${API}/admin/providers/${id}/verify`, { method: 'PATCH' })
    return res.json()
  }

  const toggleBlockProvider = async (id) => {
    const res = await auth.authFetch(`${API}/admin/providers/${id}/block`, { method: 'PATCH' })
    return res.json()
  }

  const resetProviderPassword = async (id) => {
    const res = await auth.authFetch(`${API}/admin/providers/${id}/reset-password`, { method: 'PATCH' })
    return res.json()
  }

  const fetchUsers = async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const res = await auth.authFetch(`${API}/admin/users?${q}`)
    return res.json()
  }

  const toggleBlockUser = async (id) => {
    const res = await auth.authFetch(`${API}/admin/users/${id}/block`, { method: 'PATCH' })
    return res.json()
  }

  const createUser = async (data) => {
    const res = await auth.authFetch(`${API}/admin/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  const updateUserRole = async (id, roleId) => {
    const res = await auth.authFetch(`${API}/admin/users/${id}/role`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roleId }),
    })
    return res.json()
  }

  const resetUserPassword = async (id) => {
    const res = await auth.authFetch(`${API}/admin/users/${id}/reset-password`, { method: 'PATCH' })
    return res.json()
  }

  // ----- Roles y módulos -----
  const fetchModules = async () => (await auth.authFetch(`${API}/admin/modules`)).json()
  const fetchRoles = async () => (await auth.authFetch(`${API}/admin/roles`)).json()
  const createRole = async (data) => {
    const res = await auth.authFetch(`${API}/admin/roles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }
  const updateRole = async (id, data) => {
    const res = await auth.authFetch(`${API}/admin/roles/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    return res.json()
  }
  const deleteRole = async (id) => {
    const res = await auth.authFetch(`${API}/admin/roles/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  const fetchCategories = async () => {
    const res = await auth.authFetch(`${API}/admin/categories`)
    return res.json()
  }

  const createCategory = async (data) => {
    const res = await auth.authFetch(`${API}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  const updateCategory = async (id, data) => {
    const res = await auth.authFetch(`${API}/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  const reviewCategory = async (id, action) => {
    const res = await auth.authFetch(`${API}/admin/categories/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    return res.json()
  }

  // ----- Conversaciones / Leads -----
  const fetchConversations = async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const res = await auth.authFetch(`${API}/admin/conversations?${q}`)
    return res.json()
  }

  const fetchConversation = async (id) => {
    const res = await auth.authFetch(`${API}/admin/conversations/${id}`)
    return res.json()
  }

  const toggleTakeover = async (id) => {
    const res = await auth.authFetch(`${API}/admin/conversations/${id}/takeover`, { method: 'PATCH' })
    return res.json()
  }

  const replyConversation = async (id, text) => {
    const res = await auth.authFetch(`${API}/admin/conversations/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    return res.json()
  }

  // ----- WhatsApp / Instancias -----
  const fetchInstances = async () => {
    const res = await auth.authFetch(`${API}/admin/wa/instances`)
    return res.json()
  }

  const createInstance = async (instanceName) => {
    const res = await auth.authFetch(`${API}/admin/wa/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    })
    return res.json()
  }

  const connectInstance = async (name) => {
    const res = await auth.authFetch(`${API}/admin/wa/instances/${name}/connect`)
    return res.json()
  }

  const instanceState = async (name) => {
    const res = await auth.authFetch(`${API}/admin/wa/instances/${name}/state`)
    return res.json()
  }

  const logoutInstance = async (name) => {
    const res = await auth.authFetch(`${API}/admin/wa/instances/${name}/logout`, { method: 'DELETE' })
    return res.json()
  }

  const deleteInstance = async (name) => {
    const res = await auth.authFetch(`${API}/admin/wa/instances/${name}`, { method: 'DELETE' })
    return res.json()
  }

  const setActiveInstance = async (instanceName) => {
    const res = await auth.authFetch(`${API}/admin/wa/active`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    })
    return res.json()
  }

  // ----- Solicitudes -----
  const fetchRequests = async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const res = await auth.authFetch(`${API}/admin/requests?${q}`)
    return res.json()
  }

  const fetchRequest = async (id) => {
    const res = await auth.authFetch(`${API}/admin/requests/${id}`)
    return res.json()
  }

  const updateRequest = async (id, data) => {
    const res = await auth.authFetch(`${API}/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  // ----- Dashboard -----
  const fetchStats = async () => {
    const res = await auth.authFetch(`${API}/admin/stats`)
    return res.json()
  }

  // ----- Config del bot -----
  const fetchBotConfig = async () => {
    const res = await auth.authFetch(`${API}/admin/bot-config`)
    return res.json()
  }

  const updateBotConfig = async (data) => {
    const res = await auth.authFetch(`${API}/admin/bot-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  return {
    fetchProviders, toggleVerify, toggleBlockProvider, resetProviderPassword,
    fetchUsers, toggleBlockUser, createUser, updateUserRole, resetUserPassword,
    fetchModules, fetchRoles, createRole, updateRole, deleteRole,
    fetchCategories, createCategory, updateCategory, reviewCategory,
    fetchConversations, fetchConversation, toggleTakeover, replyConversation,
    fetchInstances, createInstance, connectInstance, instanceState,
    logoutInstance, deleteInstance, setActiveInstance,
    fetchBotConfig, updateBotConfig,
    fetchStats,
    fetchRequests, fetchRequest, updateRequest,
  }
})
