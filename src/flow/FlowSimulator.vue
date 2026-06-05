<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { advance } from './simEngine'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  edges: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  intents: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'node'])

const messages = ref([])
const state = ref({ nodeId: null, vars: {} })
const awaiting = ref({ type: 'none' })
const inputText = ref('')
const bodyRef = ref(null)

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const graph = () => ({
  nodes: props.nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
  edges: props.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? null })),
})

const helpers = computed(() => ({
  servicesList: props.categories.map((c) => `• ${c.name}`).join('\n'),
  servicesCount: props.categories.length,
  // Match difuso (mismo espíritu que fuse.js del backend): substring o prefijo de 4 letras
  matchService: (lower) => {
    const nl = norm(lower)
    const words = nl.split(/\s+/).filter((w) => w.length >= 3)
    for (const c of props.categories) {
      const cn = norm(c.name)
      if (!cn) continue
      if (nl.includes(cn) || cn.includes(nl)) return c.name
      for (const w of words) {
        const k = Math.min(4, w.length, cn.length)
        if (k >= 4 && w.slice(0, k) === cn.slice(0, k)) return c.name
        if (cn.includes(w) || w.includes(cn)) return c.name
      }
    }
    return null
  },
  matchIntent: (lower) => {
    for (const it of props.intents) {
      if (!it.active && it.active !== undefined) continue
      for (const ex of (it.examples || [])) {
        if (norm(ex) && (norm(lower).includes(norm(ex)) || norm(ex).split(' ').some((w) => w.length > 3 && norm(lower).includes(w)))) return it.key
      }
    }
    return null
  },
}))

const scrollDown = () => nextTick(() => { if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight })

const pushBubbles = (arr) => { arr.forEach((b) => messages.value.push(b)); scrollDown() }

const restart = () => {
  messages.value = []
  state.value = { nodeId: null, vars: {} }
  const r = advance(graph(), state.value, '', helpers.value)
  state.value = r.state; awaiting.value = r.awaiting
  pushBubbles(r.bubbles)
  emit('node', state.value.nodeId || null)
}

const sendRaw = (display, value) => {
  if (awaiting.value.type === 'ended') return
  messages.value.push({ from: 'sim', text: display })
  const r = advance(graph(), state.value, value, helpers.value)
  state.value = r.state; awaiting.value = r.awaiting
  pushBubbles(r.bubbles)
  inputText.value = ''
  emit('node', state.value.nodeId || null)
}

const sendText = () => { const t = inputText.value.trim(); if (t) sendRaw(t, t) }

onMounted(restart)
</script>

<template>
  <div class="fixed inset-0 z-40 bg-black/40 flex justify-end" @click.self="emit('close')">
    <div class="h-full w-[380px] bg-white shadow-2xl flex flex-col">
      <!-- header panel -->
      <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <span class="font-semibold text-brand-dark">📱 Simulador</span>
        <div class="flex items-center gap-2">
          <button @click="restart" class="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">Reiniciar</button>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      </div>

      <!-- phone -->
      <div class="flex-1 min-h-0 flex flex-col" style="background:#ECE5DD">
        <div class="px-4 py-2 text-white flex items-center gap-2" style="background:#075E54">
          <div class="w-8 h-8 rounded-full bg-white/20 grid place-items-center text-sm">WS</div>
          <div>
            <p class="text-sm font-medium leading-tight">WhatServices</p>
            <p class="text-[10px] opacity-80 leading-tight">vista previa (no envía mensajes)</p>
          </div>
        </div>

        <!-- messages -->
        <div ref="bodyRef" class="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          <template v-for="(m, i) in messages" :key="i">
            <div v-if="m.from === 'note'" class="flex justify-center">
              <span class="text-[10px] text-gray-600 bg-white/70 rounded-full px-2 py-0.5 italic">{{ m.text }}</span>
            </div>
            <div v-else class="flex" :class="m.from === 'sim' ? 'justify-end' : 'justify-start'">
              <div class="max-w-[78%] rounded-lg px-3 py-1.5 text-sm whitespace-pre-wrap shadow-sm"
                :class="m.from === 'sim' ? 'bg-[#DCF8C6]' : 'bg-white'" style="word-break:break-word">
                {{ m.text }}
              </div>
            </div>
          </template>
        </div>

        <!-- quick replies -->
        <div v-if="awaiting.options && awaiting.options.length" class="px-3 pb-1 flex flex-wrap gap-1.5">
          <button v-for="o in awaiting.options" :key="o.id" @click="sendRaw(o.label, String(o.id))"
            class="text-xs bg-white border border-brand-green text-brand-medium rounded-full px-3 py-1 hover:bg-green-50">
            {{ o.label }}
          </button>
        </div>

        <!-- input -->
        <div class="p-2 bg-white border-t border-gray-200 flex items-center gap-2">
          <template v-if="awaiting.type === 'ended'">
            <button @click="restart" class="w-full text-sm bg-brand-green text-white py-2 rounded-lg hover:bg-brand-lightGreen">🔄 Reiniciar conversación</button>
          </template>
          <template v-else>
            <input v-model="inputText" @keyup.enter="sendText" placeholder="Escribe un mensaje…"
              class="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm focus:border-brand-green outline-none" />
            <button @click="sendText" class="w-9 h-9 rounded-full bg-brand-green text-white grid place-items-center hover:bg-brand-lightGreen">➤</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
