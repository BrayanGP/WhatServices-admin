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

  const deleteProvider = async (id) => {
    const res = await auth.authFetch(`${API}/admin/providers/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).message || 'Error al eliminar')
    return res.json()
  }

  // ----- Multimedia -----
  const fetchMedia = async () => {
    const res = await auth.authFetch(`${API}/admin/media`)
    return res.json()
  }
  const deleteMedia = async (publicId) => {
    const res = await auth.authFetch(`${API}/admin/media`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicId }),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error al eliminar')
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
    return res.json() // 409 → { conflict:'providers', providers, category }
  }

  const deleteCategory = async (id) => {
    const res = await auth.authFetch(`${API}/admin/categories/${id}`, { method: 'DELETE' })
    return res.json() // 409 → { conflict:'providers', providers, category }
  }

  const updateProviderCategories = async (id, categories) => {
    const res = await auth.authFetch(`${API}/admin/providers/${id}/categories`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
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

  // ----- Analítica del sitio -----
  const fetchAnalyticsOverview = async (days = 7) => {
    const res = await auth.authFetch(`${API}/admin/analytics/overview?days=${days}`)
    return res.json()
  }
  const fetchAnalyticsFunnel = async (days = 7) => {
    const res = await auth.authFetch(`${API}/admin/analytics/funnel?days=${days}`)
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

  // ----- Intenciones del bot -----
  const fetchIntents = async () => (await auth.authFetch(`${API}/admin/bot/intents`)).json()

  const createIntent = async (data) => {
    const res = await auth.authFetch(`${API}/admin/bot/intents`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  const updateIntent = async (id, data) => {
    const res = await auth.authFetch(`${API}/admin/bot/intents/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  const deleteIntent = async (id) => {
    const res = await auth.authFetch(`${API}/admin/bot/intents/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  const ensureDefaultIntents = async () => {
    const res = await auth.authFetch(`${API}/admin/bot/intents/ensure-defaults`, { method: 'POST' })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  // ----- Flujo visual del bot -----
  const fetchFlow = async () => (await auth.authFetch(`${API}/admin/bot/flow`)).json()

  const saveFlow = async (graph) => {
    const res = await auth.authFetch(`${API}/admin/bot/flow`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(graph),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  const publishFlow = async (graph) => {
    const res = await auth.authFetch(`${API}/admin/bot/flow/publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(graph || {}),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  const unpublishFlow = async () => {
    const res = await auth.authFetch(`${API}/admin/bot/flow/unpublish`, { method: 'POST' })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  // ----- Plantillas de flujo propias -----
  const fetchFlowTemplates = async () => (await auth.authFetch(`${API}/admin/bot/flow-templates`)).json()

  const createFlowTemplate = async (data) => {
    const res = await auth.authFetch(`${API}/admin/bot/flow-templates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  const deleteFlowTemplate = async (id) => {
    const res = await auth.authFetch(`${API}/admin/bot/flow-templates/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).message || 'Error')
    return res.json()
  }

  return {
    fetchProviders, toggleVerify, toggleBlockProvider, resetProviderPassword, updateProviderCategories, deleteProvider,
    fetchMedia, deleteMedia,
    fetchUsers, toggleBlockUser, createUser, updateUserRole, resetUserPassword,
    fetchModules, fetchRoles, createRole, updateRole, deleteRole,
    fetchCategories, createCategory, updateCategory, reviewCategory, deleteCategory,
    fetchConversations, fetchConversation, toggleTakeover, replyConversation,
    fetchInstances, createInstance, connectInstance, instanceState,
    logoutInstance, deleteInstance, setActiveInstance,
    fetchBotConfig, updateBotConfig,
    fetchIntents, createIntent, updateIntent, deleteIntent, ensureDefaultIntents,
    fetchFlow, saveFlow, publishFlow, unpublishFlow,
    fetchFlowTemplates, createFlowTemplate, deleteFlowTemplate,
    fetchStats, fetchAnalyticsOverview, fetchAnalyticsFunnel,
    fetchRequests, fetchRequest, updateRequest,
  }
})
