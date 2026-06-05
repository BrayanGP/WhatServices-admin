<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const categories = ref([])
const adding = ref(false)
const newCat = ref({ name: '', icon: '' })

onMounted(async () => { categories.value = await store.fetchCategories() })

const slugify = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const add = async () => {
  if (!newCat.value.name.trim()) return
  const data = { ...newCat.value, slug: slugify(newCat.value.name) }
  const cat = await store.createCategory(data)
  categories.value.push(cat)
  newCat.value = { name: '', icon: '' }
  adding.value = false
}

const toggle = async (cat) => {
  const updated = await store.updateCategory(cat._id, { isActive: !cat.isActive })
  Object.assign(cat, updated)
}
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Categorías</h1>
      <button @click="adding = !adding" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-lightGreen">
        + Agregar
      </button>
    </div>

    <div v-if="adding" class="bg-white rounded-xl shadow p-4 mb-4 flex gap-3 items-center">
      <input v-model="newCat.name" placeholder="Nombre de categoría" class="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
      <input v-model="newCat.icon" placeholder="Emoji" class="border rounded-lg px-3 py-2 text-sm w-24 text-center focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
      <button @click="add" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-lightGreen">Guardar</button>
      <button @click="adding = false" class="text-gray-400 text-sm hover:text-gray-600">Cancelar</button>
    </div>

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
          <tr v-for="cat in categories" :key="cat._id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 text-2xl">{{ cat.icon }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ cat.name }}</td>
            <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ cat.slug }}</td>
            <td class="px-4 py-3">
              <span :class="cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="text-xs px-2 py-1 rounded-full">
                {{ cat.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button @click="toggle(cat)" :class="cat.isActive ? 'text-red-500' : 'text-green-600'" class="text-xs hover:underline">
                {{ cat.isActive ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
