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
    <div v-if="adding" class="bg-white rounded-xl shadow p-4 flex gap-3 items-center">
      <input v-model="newCat.name" placeholder="Nombre de categoría" class="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
      <input v-model="newCat.icon" placeholder="Emoji" class="border rounded-lg px-3 py-2 text-sm w-24 text-center focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
      <button @click="add" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-lightGreen">Guardar</button>
      <button @click="adding = false" class="text-gray-400 text-sm hover:text-gray-600">Cancelar</button>
    </div>

    <!-- Pendientes de aprobación -->
    <div v-if="pending.length">
      <h2 class="text-base font-semibold text-amber-600 mb-3 flex items-center gap-2">
        ⏳ Pendientes de aprobación
        <span class="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{{ pending.length }}</span>
      </h2>
      <div class="bg-white rounded-xl shadow overflow-hidden">
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
      <div class="bg-white rounded-xl shadow overflow-hidden">
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
            <tr v-for="cat in active" :key="cat._id" class="border-t hover:bg-gray-50">
              <td class="px-4 py-3 text-2xl">{{ cat.icon }}</td>
              <td class="px-4 py-3 font-medium text-gray-800">{{ cat.name }}</td>
              <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ cat.slug }}</td>
              <td class="px-4 py-3">
                <span
                  :class="{
                    'bg-green-100 text-green-700': cat.isActive && cat.status === 'active',
                    'bg-gray-100 text-gray-500': !cat.isActive && cat.status !== 'rejected',
                    'bg-red-100 text-red-500': cat.status === 'rejected',
                  }"
                  class="text-xs px-2 py-1 rounded-full"
                >
                  {{ cat.status === 'rejected' ? 'Rechazada' : cat.isActive ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-4 py-3">
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
  </div>
</template>
