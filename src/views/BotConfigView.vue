<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const cfg = ref(null)
const loading = ref(true)
const saving = ref(false)
const msg = ref('')

const DAYS = [
  { v: 1, l: 'Lun' }, { v: 2, l: 'Mar' }, { v: 3, l: 'Mié' }, { v: 4, l: 'Jue' },
  { v: 5, l: 'Vie' }, { v: 6, l: 'Sáb' }, { v: 0, l: 'Dom' },
]

const labels = {
  welcome: 'Bienvenida  ·  variables: {name} {services}',
  noService: 'Servicio no reconocido  ·  {services}',
  askMode: 'Preguntar modo (cerca/mejor)  ·  {service}',
  askZip: 'Pedir código postal',
  noResults: 'Sin resultados  ·  {service}',
  outOfHours: 'Fuera de horario  ·  {open} {close}',
}

onMounted(async () => {
  cfg.value = await store.fetchBotConfig()
  loading.value = false
})

const toggleDay = (d) => {
  const arr = cfg.value.hours.days
  const i = arr.indexOf(d)
  if (i === -1) arr.push(d); else arr.splice(i, 1)
}

const save = async () => {
  saving.value = true; msg.value = ''
  try {
    const r = await store.updateBotConfig({
      enabled: cfg.value.enabled,
      messages: cfg.value.messages,
      hours: cfg.value.hours,
    })
    cfg.value = r
    msg.value = '✅ Guardado'
  } catch { msg.value = 'Error al guardar' }
  finally { saving.value = false }
}
</script>

<template>
  <div class="p-6 max-w-3xl">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Administración del bot</h1>
    <div v-if="loading" class="text-gray-400">Cargando...</div>
    <template v-else>
      <!-- On/Off -->
      <div class="bg-white rounded-xl shadow p-5 mb-4 flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-800">Bot activo</p>
          <p class="text-xs text-gray-500">Si lo apagas, el bot no responde mensajes.</p>
        </div>
        <button @click="cfg.enabled = !cfg.enabled"
          :class="cfg.enabled ? 'bg-green-500' : 'bg-gray-300'"
          class="relative w-12 h-6 rounded-full transition-colors">
          <span :class="cfg.enabled ? 'translate-x-6' : 'translate-x-1'"
            class="absolute top-1 left-0 w-4 h-4 bg-white rounded-full transition-transform"></span>
        </button>
      </div>

      <!-- Horario -->
      <div class="bg-white rounded-xl shadow p-5 mb-4">
        <div class="flex items-center justify-between mb-3">
          <p class="font-medium text-gray-800">Horario de atención</p>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="cfg.hours.enabled" /> Activar
          </label>
        </div>
        <div v-if="cfg.hours.enabled" class="space-y-3">
          <div class="flex flex-wrap gap-2">
            <button v-for="d in DAYS" :key="d.v" @click="toggleDay(d.v)"
              class="text-xs px-3 py-1.5 rounded-full border"
              :class="cfg.hours.days.includes(d.v) ? 'bg-brand-green text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'">
              {{ d.l }}
            </button>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <label>Abre: <input type="number" min="0" max="23" v-model.number="cfg.hours.openHour" class="border rounded px-2 py-1 w-16" />:00</label>
            <label>Cierra: <input type="number" min="0" max="23" v-model.number="cfg.hours.closeHour" class="border rounded px-2 py-1 w-16" />:00</label>
            <span class="text-gray-400 text-xs">({{ cfg.hours.tz }})</span>
          </div>
        </div>
      </div>

      <!-- Mensajes -->
      <div class="bg-white rounded-xl shadow p-5 mb-4 space-y-4">
        <p class="font-medium text-gray-800">Mensajes del bot</p>
        <div v-for="(_, key) in cfg.messages" :key="key">
          <label class="text-xs text-gray-500 block mb-1">{{ labels[key] || key }}</label>
          <textarea v-model="cfg.messages[key]" rows="3"
            class="w-full border rounded-lg px-3 py-2 text-sm font-mono"></textarea>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="save" :disabled="saving"
          class="bg-brand-green text-white px-5 py-2 rounded-lg hover:bg-brand-lightGreen disabled:opacity-50">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
        <span class="text-sm text-gray-500">{{ msg }}</span>
      </div>
    </template>
  </div>
</template>
