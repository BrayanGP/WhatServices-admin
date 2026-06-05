<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const PUBLIC_BACKEND = import.meta.env.VITE_PUBLIC_BACKEND_URL || ''
const instances = ref([])
const active = ref(null)
const loading = ref(false)
const newName = ref('')
const creating = ref(false)
const qr = ref(null)        // { name, base64, code }
const error = ref('')
const botEnabled = ref(true)
const togglingBot = ref(false)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [data, cfg] = await Promise.all([store.fetchInstances(), store.fetchBotConfig()])
    instances.value = Array.isArray(data.instances) ? data.instances : []
    active.value = data.active
    botEnabled.value = cfg.enabled
  } catch (e) {
    error.value = 'No se pudieron cargar las instancias.'
  } finally {
    loading.value = false
  }
}

const toggleBot = async () => {
  togglingBot.value = true
  try {
    const cfg = await store.updateBotConfig({ enabled: !botEnabled.value })
    botEnabled.value = cfg.enabled
  } finally {
    togglingBot.value = false
  }
}

const instName = (i) => i.name || i.instance?.instanceName || i.instanceName || i.id
const instStatus = (i) => i.connectionStatus || i.status || i.instance?.status || 'desconocido'

const create = async () => {
  if (!newName.value.trim()) return
  creating.value = true
  error.value = ''
  try {
    await store.createInstance(newName.value.trim())
    const name = newName.value.trim()
    newName.value = ''
    await load()
    await showQr(name)
  } catch (e) {
    error.value = 'Error al crear la instancia.'
  } finally {
    creating.value = false
  }
}

const showQr = async (name) => {
  const data = await store.connectInstance(name)
  const base64 = data.base64 || data.qrcode?.base64 || null
  const code = data.code || data.pairingCode || data.qrcode?.code || null
  qr.value = { name, base64, code }
}

const activate = async (name) => {
  const r = await store.setActiveInstance(name)
  active.value = r.active
}

const logout = async (name) => {
  if (!confirm(`¿Cerrar sesión de "${name}"?`)) return
  await store.logoutInstance(name)
  await load()
}

const remove = async (name) => {
  if (!confirm(`¿Eliminar la instancia "${name}"? Esto la borra de Evolution.`)) return
  await store.deleteInstance(name)
  await load()
}

const isConnected = (i) => ['open', 'connected'].includes(String(instStatus(i)).toLowerCase())

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">WhatsApp · Instancias</h1>
        <p class="text-sm text-gray-500">Activa: <span class="font-medium text-brand-green">{{ active || '—' }}</span></p>
      </div>
      <button @click="load" class="text-sm text-gray-500 hover:text-gray-800">↻ Refrescar</button>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-4">{{ error }}</div>

    <!-- Interruptor del bot / API -->
    <div class="bg-white rounded-xl shadow p-4 mb-4 flex items-center justify-between"
      :class="botEnabled ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
      <div>
        <p class="font-semibold text-gray-800">
          Bot de WhatsApp:
          <span :class="botEnabled ? 'text-green-600' : 'text-red-600'">{{ botEnabled ? 'Activo' : 'Pausado' }}</span>
        </p>
        <p class="text-xs text-gray-500">
          {{ botEnabled ? 'El bot responde y envía mensajes automáticamente.' : 'El bot NO envía mensajes. Las conversaciones quedan registradas pero sin respuesta.' }}
        </p>
      </div>
      <button @click="toggleBot" :disabled="togglingBot"
        class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
        :class="botEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'">
        {{ togglingBot ? '...' : (botEnabled ? '⏸ Pausar bot' : '▶ Activar bot') }}
      </button>
    </div>

    <!-- Crear -->
    <div class="bg-white rounded-xl shadow p-4 mb-4 flex gap-2 items-center">
      <input v-model="newName" placeholder="Nombre nueva instancia (ej. whatservices-bot-2)"
        class="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-lightGreen" />
      <button @click="create" :disabled="creating"
        class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-lightGreen disabled:opacity-50">
        {{ creating ? 'Creando...' : '+ Crear y conectar' }}
      </button>
    </div>

    <p class="text-xs text-gray-400 mb-4">
      💡 Si bloquean un número: crea una instancia nueva, escanea su QR, y dale <b>Activar</b>. El bot empezará a usar ese número.
    </p>

    <!-- Lista -->
    <div v-if="loading" class="text-gray-400 text-sm">Cargando...</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in instances" :key="instName(i)" class="bg-white rounded-xl shadow p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold text-gray-800">{{ instName(i) }}</span>
          <span class="text-xs px-2 py-1 rounded-full"
            :class="isConnected(i) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
            {{ instStatus(i) }}
          </span>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <span v-if="active === instName(i)" class="text-xs bg-blue-100 text-brand-medium px-2 py-1 rounded-full">● Activa</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button @click="showQr(instName(i))" class="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">QR / Conectar</button>
          <button @click="activate(instName(i))" :disabled="active === instName(i)"
            class="text-xs bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-brand-lightGreen disabled:opacity-40">Activar</button>
          <button @click="logout(instName(i))" class="text-xs text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-50">Logout</button>
          <button @click="remove(instName(i))" class="text-xs text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Códigos QR descargables -->
    <div class="mt-8">
      <h2 class="text-lg font-bold text-gray-800 mb-1">Códigos QR</h2>
      <p class="text-xs text-gray-400 mb-4">Imprímelos en pancartas. Son fijos: aunque cambies de número, siguen funcionando.</p>
      <div v-if="!PUBLIC_BACKEND" class="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-3 py-2 rounded">
        Configura la variable <code>VITE_PUBLIC_BACKEND_URL</code> en Railway para ver los QR.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white rounded-xl shadow p-5 text-center">
          <p class="font-medium text-gray-800 mb-1">Iniciar conversación (clientes)</p>
          <p class="text-xs text-gray-500 mb-3">Redirige al número activo en WhatsApp.</p>
          <img :src="`${PUBLIC_BACKEND}/wa/qr`" alt="QR conversación" class="w-44 h-44 mx-auto" />
          <a :href="`${PUBLIC_BACKEND}/wa/qr`" download="qr-conversacion.png"
            class="inline-block mt-2 text-brand-green text-sm hover:underline">Descargar</a>
        </div>
        <div class="bg-white rounded-xl shadow p-5 text-center">
          <p class="font-medium text-gray-800 mb-1">Registro de profesionales</p>
          <p class="text-xs text-gray-500 mb-3">Lleva al formulario para que se registren empleados.</p>
          <img :src="`${PUBLIC_BACKEND}/wa/qr-unete`" alt="QR registro" class="w-44 h-44 mx-auto" />
          <a :href="`${PUBLIC_BACKEND}/wa/qr-unete`" download="qr-registro-empleados.png"
            class="inline-block mt-2 text-brand-green text-sm hover:underline">Descargar</a>
        </div>
      </div>
    </div>

    <!-- Modal QR -->
    <div v-if="qr" class="fixed inset-0 bg-black/50 flex items-center justify-center z-20" @click.self="qr = null">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full text-center">
        <h3 class="font-semibold text-gray-800 mb-1">Conectar "{{ qr.name }}"</h3>
        <p class="text-xs text-gray-500 mb-4">WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
        <img v-if="qr.base64" :src="qr.base64" alt="QR" class="mx-auto w-56 h-56" />
        <p v-else class="text-sm text-gray-400">No hay QR (¿ya está conectada?). Intenta refrescar.</p>
        <p v-if="qr.code" class="text-[11px] text-gray-400 mt-3 break-all">Código: {{ qr.code }}</p>
        <div class="mt-4 flex gap-2 justify-center">
          <button @click="showQr(qr.name)" class="text-sm bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">Refrescar QR</button>
          <button @click="qr = null" class="text-sm bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-lightGreen">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>
