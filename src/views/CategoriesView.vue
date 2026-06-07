<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const allCategories = ref([])
const adding = ref(false)
const newCat = ref({ name: '', icon: '' })

onMounted(async () => { allCategories.value = await store.fetchCategories() })

const pending = computed(() => allCategories.value.filter(c => c.status === 'pending'))
const active  = computed(() => allCategories.value.filter(c => c.status !== 'pending'))

const slugify = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const add = async () => {
  if (!newCat.value.name.trim()) return
  const data = { ...newCat.value, slug: slugify(newCat.value.name) }
  const cat = await store.createCategory(data)
  allCategories.value.push(cat)
  newCat.value = { name: '', icon: '' }
  adding.value = false
}

const toggle = async (cat) => {
  const updated = await store.updateCategory(cat._id, { isActive: !cat.isActive })
  Object.assign(cat, updated)
}

// ---- Editar categoría ----
const editing = ref(null)
const savingEdit = ref(false)
const editErr = ref('')
const showIcons = ref(false)

// Íconos sugeridos para categorías de servicios
const ICONS = [
  '🔧', '🔨', '🪚', '⚡', '🚰', '🚿', '💧', '🧹', '🧼', '🛠️', '🪛', '🪠', '🧰', '🪜', '🏠', '🚪',
  '🪟', '🛏️', '🚗', '🛞', '🎨', '🧱', '🌿', '🌳', '✂️', '💈', '🍫', '🍭', '🧊', '📦', '🐾', '🔥',
  '❄️', '💡', '🔌', '🏗️', '👷', '⚖️', '📚', '💻', '📱', '🦷', '💄', '💅', '📸', '🎂', '🍳', '🪴',
  '🧯', '🔑', '🚧', '🧽', '🪣', '🧴',
]
const pickIcon = (e) => { if (editing.value) editing.value.icon = e; showIcons.value = false }
const showIconsAdd = ref(false)
const pickIconAdd = (e) => { newCat.value.icon = e; showIconsAdd.value = false }

const openEdit = (cat) => {
  editErr.value = ''; showIcons.value = false
  editing.value = { _id: cat._id, name: cat.name, icon: cat.icon || '', slug: cat.slug || '', isActive: cat.isActive !== false }
}
const regenSlug = () => { if (editing.value) editing.value.slug = slugify(editing.value.name) }

const saveEdit = async () => {
  if (!editing.value.name.trim()) { editErr.value = 'El nombre es obligatorio'; return }
  savingEdit.value = true; editErr.value = ''
  try {
    const updated = await store.updateCategory(editing.value._id, {
      name: editing.value.name.trim(),
      icon: editing.value.icon,
      slug: (editing.value.slug || slugify(editing.value.name)).trim(),
      isActive: editing.value.isActive,
    })
    const orig = allCategories.value.find((c) => c._id === editing.value._id)
    if (orig) Object.assign(orig, updated)
    editing.value = null
  } catch (e) { editErr.value = e.message || 'No se pudo guardar' }
  finally { savingEdit.value = false }
}

const review = async (cat, action) => {
  const updated = await store.reviewCategory(cat._id, action)
  Object.assign(cat, updated)
}
</script>

<template>
  <div class="p-8 space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Categorías</h1>
      <button @click="adding = !adding" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-lightGreen">
        + Agregar
      </button>
    </div>

    <!-- Formulario nueva categoría -->
    <div v-if="adding" class="bg-white rounded-xl shadow p-4 space-y-3">
      <div class="flex gap-3 items-center">
        <input v-model="newCat.name" placeholder="Nombre de categoría" class="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
        <input v-model="newCat.icon" placeholder="Emoji" class="border rounded-lg px-3 py-2 text-lg w-16 text-center focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
        <button type="button" @click="showIconsAdd = !showIconsAdd" class="px-2 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs">{{ showIconsAdd ? '▴' : '▾' }}</button>
        <button @click="add" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-lightGreen">Guardar</button>
        <button @click="adding = false" class="text-gray-400 text-sm hover:text-gray-600">Cancelar</button>
      </div>
      <div v-if="showIconsAdd" class="border border-gray-200 rounded-lg p-2 grid grid-cols-9 sm:grid-cols-12 gap-1 max-h-40 overflow-y-auto">
        <button v-for="e in ICONS" :key="e" type="button" @click="pickIconAdd(e)"
          class="text-xl leading-none rounded p-1 hover:bg-brand-light/70 transition"
          :class="newCat.icon === e ? 'bg-brand-green/15 ring-1 ring-brand-green' : ''">{{ e }}</button>
      </div>
    </div>

    <!-- Pendientes de aprobación -->
    <div v-if="pending.length">
      <h2 class="text-base font-semibold text-amber-600 mb-3 flex items-center gap-2">
        ⏳ Pendientes de aprobación
        <span class="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{{ pending.length }}</span>
      </h2>
      <div class="bg-white rounded-xl shadow overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-amber-700 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Icono</th>
              <th class="px-4 py-3 text-left">Nombre</th>
              <th class="px-4 py-3 text-left">Sugerida por</th>
              <th class="px-4 py-3 text-left">Fecha</th>
              <th class="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in pending" :key="cat._id" class="border-t hover:bg-amber-50/40">
              <td class="px-4 py-3 text-2xl">{{ cat.icon || '🔧' }}</td>
              <td class="px-4 py-3 font-medium text-gray-800">{{ cat.name }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">
                {{ cat.suggestedBy?.name || cat.suggestedBy?.email || '—' }}
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs">
                {{ new Date(cat.createdAt).toLocaleDateString('es-MX') }}
              </td>
              <td class="px-4 py-3 flex gap-2">
                <button
                  @click="review(cat, 'approve')"
                  class="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 font-medium"
                >✓ Aprobar</button>
                <button
                  @click="review(cat, 'reject')"
                  class="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 font-medium"
                >✗ Rechazar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Categorías activas / inactivas -->
    <div>
      <h2 class="text-base font-semibold text-gray-700 mb-3">Todas las categorías</h2>
      <div class="bg-white rounded-xl shadow overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Icono</th>
              <th class="px-4 py-3 text-left">Nombre</th>
              <th class="px-4 py-3 text-left">Slug</th>
              <th class="px-4 py-3 text-left">Estado</th>
              <th class="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in active" :key="cat._id" class="border-t hover:bg-brand-light/40 cursor-pointer transition" @click="openEdit(cat)">
              <td class="px-4 py-3 text-2xl">{{ cat.icon }}</td>
              <td class="px-4 py-3 font-medium text-gray-800">{{ cat.name }}</td>
              <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ cat.slug }}</td>
              <td class="px-4 py-3">
                <span
                  :class="cat.status === 'rejected' ? 'bg-red-100 text-red-500' : (cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')"
                  class="text-xs px-2 py-1 rounded-full"
                >
                  {{ cat.status === 'rejected' ? 'Rechazada' : cat.isActive ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-4 py-3" @click.stop>
                <button @click="openEdit(cat)" class="text-xs text-brand-medium hover:underline mr-3">Editar</button>
                <button
                  v-if="cat.status !== 'rejected'"
                  @click="toggle(cat)"
                  :class="cat.isActive ? 'text-red-500' : 'text-green-600'"
                  class="text-xs hover:underline"
                >
                  {{ cat.isActive ? 'Desactivar' : 'Activar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: editar categoría -->
    <div v-if="editing" class="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" @click.self="editing = null">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-brand-dark text-lg">Editar categoría</h3>
          <button @click="editing = null" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div class="space-y-3">
          <div class="flex items-end gap-3">
            <div class="flex-1">
              <label class="text-xs text-gray-600 block mb-1">Nombre</label>
              <input v-model="editing.name" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-green outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Emoji</label>
              <div class="flex items-center gap-1">
                <input v-model="editing.icon" maxlength="4" class="w-14 border border-gray-300 rounded-lg px-2 py-2 text-lg text-center focus:border-brand-green outline-none" />
                <button type="button" @click="showIcons = !showIcons" class="px-2 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs">{{ showIcons ? '▴' : '▾' }}</button>
              </div>
            </div>
          </div>

          <!-- Selector de íconos -->
          <div v-if="showIcons" class="border border-gray-200 rounded-lg p-2 grid grid-cols-9 gap-1 max-h-40 overflow-y-auto">
            <button v-for="e in ICONS" :key="e" type="button" @click="pickIcon(e)"
              class="text-xl leading-none rounded p-1 hover:bg-brand-light/70 transition"
              :class="editing.icon === e ? 'bg-brand-green/15 ring-1 ring-brand-green' : ''">{{ e }}</button>
          </div>
          <div>
            <label class="text-xs text-gray-600 block mb-1">Slug</label>
            <div class="flex items-center gap-2">
              <input v-model="editing.slug" class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-brand-green outline-none" />
              <button @click="regenSlug" class="text-xs px-2 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 whitespace-nowrap">Regenerar</button>
            </div>
            <p class="text-[11px] text-amber-600 mt-1">⚠️ Cambiar el nombre afecta el reconocimiento del bot y los proveedores ya asignados a esta categoría.</p>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="editing.isActive" class="accent-brand-green" /> Activa
          </label>
          <p v-if="editErr" class="text-sm text-red-600">{{ editErr }}</p>
          <div class="flex gap-2 pt-1">
            <button @click="saveEdit" :disabled="savingEdit"
              class="flex-1 bg-brand-green text-white py-2 rounded-lg font-medium hover:bg-brand-lightGreen disabled:opacity-50">
              {{ savingEdit ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <button @click="editing = null" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
