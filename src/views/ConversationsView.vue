<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const conversations = ref([])
const total = ref(0)
const selected = ref(null)
const replyText = ref('')
const loading = ref(false)
const sending = ref(false)

const loadList = async () => {
  loading.value = true
  const data = await store.fetchConversations({ limit: 50 })
  conversations.value = data.conversations
  total.value = data.total
  loading.value = false
}

const open = async (c) => {
  selected.value = await store.fetchConversation(c._id)
}

const send = async () => {
  if (!replyText.value.trim() || !selected.value) return
  sending.value = true
  try {
    const r = await store.replyConversation(selected.value._id, replyText.value)
    if (r.ok) {
      selected.value.messages.push(r.message)
      selected.value.humanTakeover = true
      replyText.value = ''
    }
  } finally {
    sending.value = false
  }
}

const takeover = async () => {
  const r = await store.toggleTakeover(selected.value._id)
  selected.value.humanTakeover = r.humanTakeover
}

const stepLabel = (s) => ({
  IDLE: 'Nuevo', AWAITING_SERVICE: 'Eligiendo servicio', AWAITING_ZIP: 'Dando CP',
  SHOWING_RESULTS: 'Con sugerencias', HUMAN: 'Atendido por humano', END: 'Cerrado',
}[s] || s)

onMounted(loadList)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Conversaciones ({{ total }})</h1>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-140px)]">
      <!-- Lista -->
      <div class="bg-white rounded-xl shadow overflow-y-auto">
        <div v-if="loading" class="p-4 text-gray-400 text-sm">Cargando...</div>
        <div v-else-if="!conversations.length" class="p-4 text-gray-400 text-sm">Sin conversaciones aún.</div>
        <button
          v-for="c in conversations"
          :key="c._id"
          @click="open(c)"
          class="w-full text-left px-4 py-3 border-b hover:bg-gray-50"
          :class="{ 'bg-blue-50': selected && selected._id === c._id }"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-gray-800 text-sm">{{ c.name || c.phone }}</span>
            <span class="text-[10px] text-gray-400">{{ new Date(c.lastActivity).toLocaleDateString('es-MX') }}</span>
          </div>
          <div class="text-xs text-gray-500">{{ c.phone }}</div>
          <div class="flex gap-2 mt-1">
            <span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ stepLabel(c.step) }}</span>
            <span v-if="c.selectedService" class="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{{ c.selectedService }}</span>
            <span v-if="c.humanTakeover" class="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Humano</span>
          </div>
        </button>
      </div>

      <!-- Detalle -->
      <div class="bg-white rounded-xl shadow lg:col-span-2 flex flex-col">
        <div v-if="!selected" class="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Selecciona una conversación
        </div>
        <template v-else>
          <div class="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <p class="font-semibold text-gray-800">{{ selected.name || selected.phone }}</p>
              <p class="text-xs text-gray-500">
                {{ selected.phone }}
                <span v-if="selected.postalCode"> · CP {{ selected.postalCode }}</span>
                <span v-if="selected.instance"> · {{ selected.instance }}</span>
              </p>
            </div>
            <button
              @click="takeover"
              class="text-xs px-3 py-1.5 rounded-lg"
              :class="selected.humanTakeover ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
            >
              {{ selected.humanTakeover ? 'Devolver al bot' : 'Tomar control' }}
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            <div
              v-for="(m, i) in selected.messages"
              :key="i"
              class="flex"
              :class="m.from === 'client' ? 'justify-start' : 'justify-end'"
            >
              <div
                class="max-w-[75%] px-3 py-2 rounded-2xl text-sm"
                :class="{
                  'bg-white border text-gray-800': m.from === 'client',
                  'bg-blue-600 text-white': m.from === 'bot',
                  'bg-green-600 text-white': m.from === 'agent',
                }"
              >
                <div class="whitespace-pre-wrap">{{ m.text }}</div>
                <div class="text-[10px] opacity-70 mt-1 text-right">
                  {{ m.from }} · {{ new Date(m.at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>
            </div>
          </div>

          <div class="p-3 border-t flex gap-2">
            <input
              v-model="replyText"
              @keyup.enter="send"
              placeholder="Escribe un mensaje..."
              class="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              @click="send"
              :disabled="sending"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {{ sending ? '...' : 'Enviar' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
