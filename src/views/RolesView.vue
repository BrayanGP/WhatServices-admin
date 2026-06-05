<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const roles = ref([])
const modules = ref([])
const loading = ref(true)

const editing = ref(null) // role en edición o { name:'', modules:[] } para nuevo
const isNew = ref(false)
const error = ref('')
const saving = ref(false)

const load = async () => {
  loading.value = true
  try {
    const [r, m] = await Promise.all([store.fetchRoles(), store.fetchModules()])
    roles.value = r
    modules.value = m
  } finally { loading.value = false }
}

const openNew = () => { editing.value = { name: '', modules: [] }; isNew.value = true; error.value = '' }
const openEdit = (r) => { editing.value = { ...r, modules: [...(r.modules || [])] }; isNew.value = false; error.value = '' }

const toggleModule = (key) => {
  const arr = editing.value.modules
  const i = arr.indexOf(key)
  if (i === -1) arr.push(key); else arr.splice(i, 1)
}

const save = async () => {
  if (!editing.value.name.trim()) { error.value = 'Nombre requerido'; return }
  saving.value = true; error.value = ''
  try {
    if (isNew.value) await store.createRole({ name: editing.value.name, modules: editing.value.modules })
    else await store.updateRole(editing.value._id, { name: editing.value.name, modules: editing.value.modules })
    editing.value = null
    await load()
  } catch (e) { error.value = e.message } finally { saving.value = false }
}

const remove = async (r) => {
  if (!confirm(`¿Eliminar el rol "${r.name}"?`)) return
  try { await store.deleteRole(r._id); await load() }
  catch (e) { alert(e.message) }
}

const moduleLabel = (key) => modules.value.find((m) => m.key === key)?.label || key

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-1">
      <h1 class="text-2xl font-bold text-brand-dark">Roles y permisos</h1>
      <button @click="openNew" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-lightGreen transition-colors">+ Crear rol</button>
    </div>
    <div class="h-1 w-16 bg-brand-base rounded-full mb-3"></div>
    <p class="text-sm text-gray-500 mb-5">Define qué módulos del panel puede ver cada rol. El rol <b>Administrador</b> siempre tiene acceso total.</p>

    <div v-if="loading" class="text-gray-400 text-sm py-10 text-center">Cargando...</div>
    <div v-else-if="!roles.length" class="text-gray-400 text-sm py-10 text-center bg-white rounded-xl shadow-sm">Aún no hay roles. Crea el primero.</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="r in roles" :key="r._id" class="bg-white rounded-xl shadow-sm border-l-4 border-brand-base/40 p-5">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-brand-dark">{{ r.name }}</h3>
          <div class="flex gap-3 text-xs">
            <button @click="openEdit(r)" class="text-brand-green hover:underline">Editar</button>
            <button @click="remove(r)" class="text-red-500 hover:underline">Eliminar</button>
          </div>
        </div>
        <div class="flex flex-wrap gap-1">
          <span v-for="k in r.modules" :key="k" class="text-[10px] bg-brand-base/10 text-brand-medium px-2 py-0.5 rounded-full">{{ moduleLabel(k) }}</span>
          <span v-if="!r.modules?.length" class="text-xs text-gray-400">Sin módulos asignados</span>
        </div>
      </div>
    </div>

    <!-- Modal crear/editar rol -->
    <div v-if="editing" class="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-20 p-4" @click.self="editing = null">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 class="font-bold text-brand-dark mb-4">{{ isNew ? 'Crear rol' : 'Editar rol' }}</h3>
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-3">{{ error }}</div>
        <input v-model="editing.name" placeholder="Nombre del rol (ej. Soporte, Ventas)"
          class="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-base" />
        <p class="text-sm font-medium text-gray-700 mb-2">Módulos permitidos</p>
        <div class="grid grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto">
          <label v-for="m in modules" :key="m.key"
            class="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer"
            :class="editing.modules.includes(m.key) ? 'border-brand-base bg-brand-base/5' : 'border-gray-200'">
            <input type="checkbox" :checked="editing.modules.includes(m.key)" @change="toggleModule(m.key)" class="accent-brand-green" />
            {{ m.label }}
          </label>
        </div>
        <div class="flex gap-2 justify-end">
          <button @click="editing = null" class="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Cancelar</button>
          <button @click="save" :disabled="saving" class="text-sm px-4 py-2 rounded-lg bg-brand-green text-white font-semibold hover:bg-brand-lightGreen disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
