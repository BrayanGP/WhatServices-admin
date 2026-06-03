import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

const API = import.meta.env.VITE_API_URL

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

  const fetchUsers = async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const res = await auth.authFetch(`${API}/admin/users?${q}`)
    return res.json()
  }

  const toggleBlockUser = async (id) => {
    const res = await auth.authFetch(`${API}/admin/users/${id}/block`, { method: 'PATCH' })
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

  return {
    fetchProviders, toggleVerify, toggleBlockProvider,
    fetchUsers, toggleBlockUser,
    fetchCategories, createCategory, updateCategory,
  }
})
