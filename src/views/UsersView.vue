<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const users = ref([])
const total = ref(0)
const roles = ref([])
const loading = ref(true)

const showCreate = ref(false)
const form = ref({ name: '', email: '', password: '', roleId: '' })
const creating = ref(false)
const error = ref('')
const resetResult = ref(null)
const copied = ref(false)

const load = async () => {
  loading.value = true
  try {
    const [u, r] = await Promise.all([store.fetchUsers({ limit: 100 }), store.fetchRoles()])
    users.value = u.users
    total.value = u.total
    roles.value = r
  } finally { loading.value = false }
}

const create = async () => {
  creating.value = true; error.value = ''
  try {
    await store.createUser({ ...form.value, roleId: form.value.roleId || undefined })
    form.value = { name: '', email: '', password: '', roleId: '' }
    showCreate.value = false
    await load()
  } catch (e) { error.value = e.message } finally { creating.value = false }
}

const changeRole = async (u, roleId) => {
  const out = await store.updateUserRole(u._id, roleId || null)
  Object.assign(u, out)
}

const block = async (u) => { const r = await store.toggleBlockUser(u._id); u.isBlocked = r.isBlocked }

const resetPass = async (u) => {
  if (!confirm(`¿Reiniciar contraseña de ${u.name}?`)) return
  const r = await store.resetUserPassword(u._id)
  if (r.password) { resetResult.value = { user: u, password: r.password }; copied.value = false }
}
const copyPass = () => { navigator.clipboard?.writeText(resetResult.value.password); copied.value = true }

const roleName = (u) => u.role === 'admin' ? 'Administrador (total)' : (u.roleId?.name || 'Sin rol')

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-1">
      <h1 class="text-2xl font-bold text-brand-dark">Usuarios del panel</h1>
      <button @click="showCreate = true" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-lightGreen transition-colors">+ Crear usuario</button>
    </div>
    <div class="h-1 w-16 bg-brand-base rounded-full mb-3"></div>
    <p class="text-sm text-gray-500 mb-5">Solo cuentas con acceso al panel ({{ total }}). Los clientes y proveedores del front no aparecen aquí.</p>

    <div v-if="loading" class="text-gray-400 text-sm py-10 text-center">Cargando...</div>
    <div v-else class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Correo</th>
            <th class="px-4 py-3 text-left">Rol</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u._id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ u.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ u.email }}</td>
            <td class="px-4 py-3">
              <span v-if="u.role === 'admin'" class="text-xs bg-brand-base/15 text-brand-medium px-2 py-1 rounded-full">{{ roleName(u) }}</span>
              <select v-else :value="u.roleId?._id || ''" @change="changeRole(u, $event.target.value)"
                class="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-base">
                <option value="">Sin rol</option>
                <option v-for="r in roles" :key="r._id" :value="r._id">{{ r.name }}</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span :class="u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'" class="text-xs px-2 py-1 rounded-full">
                {{ u.isBlocked ? 'Bloqueado' : 'Activo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-3 text-xs">
                <button @click="resetPass(u)" class="text-amber-600 hover:underline">Reiniciar contraseña</button>
                <button v-if="u.role !== 'admin'" @click="block(u)" :class="u.isBlocked ? 'text-green-600' : 'text-red-500'" class="hover:underline">{{ u.isBlocked ? 'Desbloquear' : 'Bloquear' }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal crear usuario -->
    <div v-if="showCreate" class="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-20 p-4" @click.self="showCreate = false">
      <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3 class="font-bold text-brand-dark mb-4">Crear usuario del panel</h3>
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-3">{{ error }}</div>
        <input v-model="form.name" placeholder="Nombre" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-base" />
        <input v-model="form.email" type="email" placeholder="Correo" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-base" />
        <input v-model="form.password" type="password" placeholder="Contraseña (mín. 6)" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-base" />
        <select v-model="form.roleId" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base">
          <option value="">Selecciona un rol</option>
          <option v-for="r in roles" :key="r._id" :value="r._id">{{ r.name }}</option>
        </select>
        <div class="flex gap-2 justify-end">
          <button @click="showCreate = false" class="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Cancelar</button>
          <button @click="create" :disabled="creating" class="text-sm px-4 py-2 rounded-lg bg-brand-green text-white font-semibold hover:bg-brand-lightGreen disabled:opacity-50">
            {{ creating ? 'Creando...' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal contraseña -->
    <div v-if="resetResult" class="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-30 p-4" @click.self="resetResult = null">
      <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-base/15 flex items-center justify-center text-2xl">🔑</div>
        <h3 class="font-bold text-brand-dark mb-1">Contraseña reiniciada</h3>
        <p class="text-xs text-gray-500 mb-4">{{ resetResult.user.name }} — comparte esta contraseña:</p>
        <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 font-mono text-lg mb-3 text-brand-dark">{{ resetResult.password }}</div>
        <div class="flex gap-2 justify-center">
          <button @click="copyPass" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-lightGreen">{{ copied ? '✓ Copiado' : 'Copiar' }}</button>
          <button @click="resetResult = null" class="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>
