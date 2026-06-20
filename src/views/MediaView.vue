<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const loading = ref(true)
const data = ref({ providers: [], reviews: [], orphans: [], orphansSupported: false })
const tab = ref('providers') // providers | reviews | orphans
const q = ref('')
const lightbox = ref(null)
const msg = ref('')

const load = async () => {
  loading.value = true
  try { data.value = await store.fetchMedia() } finally { loading.value = false }
}
onMounted(load)

const providersWithMedia = computed(() => {
  const term = q.value.trim().toLowerCase()
  return (data.value.providers || [])
    .map((p) => ({
      ...p,
      items: [
        ...(p.profilePhoto?.url ? [{ ...p.profilePhoto, tag: 'perfil' }] : []),
        ...((p.photos || []).map((ph) => ({ ...ph, tag: (ph.albums || []).join(', ') || 'default' }))),
      ],
    }))
    .filter((p) => p.items.length && (!term || (p.businessName || '').toLowerCase().includes(term)))
})

const reviewItems = computed(() =>
  (data.value.reviews || []).flatMap((r) => (r.media || []).map((m) => ({ ...m, reviewerName: r.reviewerName })))
)

const flash = (m) => { msg.value = m; setTimeout(() => (msg.value = ''), 2500) }

const remove = async (publicId) => {
  if (!publicId) return
  if (!confirm('¿Eliminar este archivo definitivamente? Se borra del almacenamiento y de donde esté referenciado.')) return
  try {
    await store.deleteMedia(publicId)
    flash('✅ Archivo eliminado')
    await load()
  } catch (e) { flash(e.message || 'Error') }
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-800">Multimedia</h1>
      <button @click="load" class="text-sm border rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">↻ Refrescar</button>
    </div>

    <p v-if="msg" class="mb-3 text-sm text-brand-green">{{ msg }}</p>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button @click="tab = 'providers'" :class="['px-3 py-1.5 rounded-full text-sm border', tab === 'providers' ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-600 border-gray-300']">Por proveedor</button>
      <button @click="tab = 'reviews'" :class="['px-3 py-1.5 rounded-full text-sm border', tab === 'reviews' ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-600 border-gray-300']">De reseñas ({{ reviewItems.length }})</button>
      <button @click="tab = 'orphans'" :class="['px-3 py-1.5 rounded-full text-sm border', tab === 'orphans' ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-600 border-gray-300']">Sin asignar ({{ (data.orphans || []).length }})</button>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400">Cargando...</div>

    <template v-else>
      <!-- Por proveedor -->
      <div v-if="tab === 'providers'">
        <input v-model="q" placeholder="Buscar proveedor..." class="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-green" />
        <div v-if="!providersWithMedia.length" class="text-gray-400 py-8 text-center">Sin multimedia.</div>
        <div v-for="p in providersWithMedia" :key="p._id" class="mb-6 bg-white rounded-xl border border-gray-100 p-4">
          <p class="font-semibold text-gray-800 mb-3">{{ p.businessName }} <span class="text-gray-400 font-normal text-sm">· {{ p.items.length }} archivos</span></p>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <div v-for="(m, i) in p.items" :key="m.publicId || i" class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <img :src="m.url" @click="lightbox = m.url" class="w-full h-full object-cover cursor-zoom-in" />
              <span class="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">{{ m.tag }}</span>
              <button @click="remove(m.publicId)" class="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white text-sm flex items-center justify-center hover:bg-red-600 shadow">✕</button>
            </div>
          </div>
        </div>
      </div>

      <!-- De reseñas -->
      <div v-else-if="tab === 'reviews'">
        <div v-if="!reviewItems.length" class="text-gray-400 py-8 text-center">Sin fotos en reseñas.</div>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <div v-for="(m, i) in reviewItems" :key="m.publicId || i" class="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img :src="m.url" @click="lightbox = m.url" class="w-full h-full object-cover cursor-zoom-in" />
            <span class="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded truncate max-w-[90%]">{{ m.reviewerName || 'Cliente' }}</span>
            <button @click="remove(m.publicId)" class="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white text-sm flex items-center justify-center hover:bg-red-600 shadow">✕</button>
          </div>
        </div>
      </div>

      <!-- Sin asignar (huérfanos) -->
      <div v-else>
        <p v-if="!data.orphansSupported" class="text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm mb-4">
          La detección de archivos sin asignar solo está disponible con almacenamiento S3.
        </p>
        <div v-if="!(data.orphans || []).length" class="text-gray-400 py-8 text-center">No hay archivos sin asignar. 🎉</div>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <div v-for="(m, i) in data.orphans" :key="m.key || i" class="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img :src="m.url" @click="lightbox = m.url" class="w-full h-full object-cover cursor-zoom-in" />
            <span class="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">{{ ((m.size || 0) / 1024).toFixed(0) }} KB</span>
            <button @click="remove(m.key)" class="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white text-sm flex items-center justify-center hover:bg-red-600 shadow">✕</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightbox" @click="lightbox = null" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out">
        <img :src="lightbox" class="max-h-[90vh] max-w-full rounded-xl object-contain" />
      </div>
    </Teleport>
  </div>
</template>
