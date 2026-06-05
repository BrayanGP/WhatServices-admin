<script setup>
import { ref, computed, markRaw, onMounted, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import { useAdminStore } from '../stores/admin'
import FlowNode from '../flow/FlowNode.vue'
import { currentFlowTemplate } from '../flow/template'
import {
  PALETTE, makeData, ACTIONS, CAPTURE_OPTS, CONDITION_FIELDS, OPERATORS,
} from '../flow/nodeTypes'

const store = useAdminStore()

const nodeTypes = {
  start: markRaw(FlowNode), message: markRaw(FlowNode), ask: markRaw(FlowNode),
  condition: markRaw(FlowNode), action: markRaw(FlowNode), end: markRaw(FlowNode),
}

const {
  nodes, edges, setNodes, setEdges, addNodes, addEdges,
  onConnect, onNodeClick, onPaneClick, removeNodes, project, screenToFlowCoordinate, fitView,
} = useVueFlow()

const selectedId = ref(null)
const isPublished = ref(false)
const loading = ref(true)
const status = ref('')
const noValueOps = ['exists', 'isTrue', 'isFalse']

const selectedNode = computed(() => nodes.value.find((n) => n.id === selectedId.value) || null)

onConnect((params) => addEdges([{ ...params, id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]))
onNodeClick(({ node }) => { selectedId.value = node.id })
onPaneClick(() => { selectedId.value = null })

const applyGraph = (g) => {
  setNodes((g?.nodes || []).map((n) => ({ ...n })))
  setEdges((g?.edges || []).map((e) => ({ ...e })))
  nextTick(() => { try { fitView({ padding: 0.2 }) } catch (e) {} })
}

const ensureStart = () => {
  if (!nodes.value.length) applyGraph({ nodes: [{ id: 'start', type: 'start', position: { x: 320, y: 40 }, data: {} }], edges: [] })
}

onMounted(async () => {
  try {
    const r = await store.fetchFlow()
    isPublished.value = !!r.isPublished
    if (r.draft && (r.draft.nodes || []).length) applyGraph(r.draft)
    else ensureStart()
  } catch (e) { ensureStart() }
  loading.value = false
})

// ---- Paleta: drag & drop ----
const onDragStart = (ev, type) => {
  ev.dataTransfer.setData('application/vueflow', type)
  ev.dataTransfer.effectAllowed = 'move'
}
const onDrop = (ev) => {
  const type = ev.dataTransfer.getData('application/vueflow')
  if (!type) return
  const pos = (screenToFlowCoordinate || project)({ x: ev.clientX, y: ev.clientY })
  const id = `${type}-${Date.now().toString(36)}`
  addNodes([{ id, type, position: pos, data: makeData(type) }])
  selectedId.value = id
}

const deleteSelected = () => {
  if (!selectedNode.value || selectedNode.value.type === 'start') return
  removeNodes([selectedNode.value.id])
  selectedId.value = null
}

// ---- Inspector: condición ----
const fieldBase = (rule) => (String(rule.field || '').startsWith('vars.') ? 'vars' : rule.field)
const setField = (rule, v) => { rule.field = v === 'vars' ? 'vars.' : v }
const varName = (rule) => (String(rule.field || '').startsWith('vars.') ? rule.field.slice(5) : '')
const setVarName = (rule, v) => { rule.field = `vars.${v}` }
const addCase = (d) => d.cases.push({ label: `Caso ${d.cases.length + 1}`, logic: 'AND', rules: [{ field: 'message', op: 'contains', value: '' }] })
const removeCase = (d, i) => d.cases.splice(i, 1)
const addRule = (c) => c.rules.push({ field: 'message', op: 'contains', value: '' })
const removeRule = (c, i) => c.rules.splice(i, 1)

// ---- Acción seleccionada ----
const actionMeta = computed(() => ACTIONS.find((a) => a.value === selectedNode.value?.data?.action))

// ---- Persistencia ----
const serialize = () => ({
  nodes: nodes.value.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
  edges: edges.value.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? null, label: e.label ?? '' })),
})

const flash = (m) => { status.value = m; setTimeout(() => (status.value = ''), 2800) }

const save = async () => {
  try { await store.saveFlow(serialize()); flash('💾 Borrador guardado') }
  catch (e) { flash('Error al guardar') }
}
const publish = async () => {
  try { const r = await store.publishFlow(serialize()); isPublished.value = r.isPublished; flash('🚀 Publicado: el bot ya usa este flujo') }
  catch (e) { flash(e.message || 'Error al publicar') }
}
const unpublish = async () => {
  try { const r = await store.unpublishFlow(); isPublished.value = r.isPublished; flash('⏸️ Despublicado: el bot volvió al flujo por defecto') }
  catch (e) { flash('Error') }
}
const loadTemplate = () => {
  if (!confirm('Esto reemplaza el lienzo actual con la plantilla del flujo por defecto. ¿Continuar?')) return
  applyGraph(currentFlowTemplate()); selectedId.value = null
}
const clearAll = () => {
  if (!confirm('Esto borra todos los bloques (deja solo Inicio). ¿Continuar?')) return
  applyGraph({ nodes: [{ id: 'start', type: 'start', position: { x: 320, y: 40 }, data: {} }], edges: [] })
  selectedId.value = null
}
</script>

<template>
  <div class="flex flex-col" style="height: calc(100vh - 60px)">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 flex-wrap px-1 py-2 border-b border-gray-200">
      <router-link to="/bot" class="text-sm text-brand-medium hover:underline mr-1">← Bot</router-link>
      <span class="text-xs px-2 py-1 rounded-full font-medium"
        :class="isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
        {{ isPublished ? '● Publicado (en uso)' : '○ Borrador (usa flujo por defecto)' }}
      </span>
      <div class="flex-1"></div>
      <span class="text-xs text-gray-500">{{ status }}</span>
      <button @click="loadTemplate" class="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">Cargar plantilla</button>
      <button @click="clearAll" class="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">Limpiar</button>
      <button @click="save" class="text-sm px-3 py-1.5 rounded-lg bg-brand-medium text-white hover:opacity-90">Guardar borrador</button>
      <button v-if="!isPublished" @click="publish" class="text-sm px-3 py-1.5 rounded-lg bg-brand-green text-white hover:bg-brand-lightGreen">Publicar</button>
      <template v-else>
        <button @click="publish" class="text-sm px-3 py-1.5 rounded-lg bg-brand-green text-white hover:bg-brand-lightGreen">Republicar</button>
        <button @click="unpublish" class="text-sm px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">Despublicar</button>
      </template>
    </div>

    <div class="flex flex-1 min-h-0">
      <!-- Paleta -->
      <div class="w-40 shrink-0 border-r border-gray-200 p-2 space-y-2 overflow-y-auto bg-gray-50">
        <p class="text-[11px] uppercase tracking-wide text-gray-400 font-semibold px-1">Bloques</p>
        <div v-for="p in PALETTE" :key="p.type" draggable="true" @dragstart="onDragStart($event, p.type)"
          class="cursor-grab active:cursor-grabbing rounded-lg border border-gray-200 bg-white p-2 hover:border-brand-green hover:shadow-sm transition">
          <div class="flex items-center gap-2 text-sm font-medium text-brand-dark">
            <span :style="{ color: p.color }">{{ p.icon }}</span> {{ p.label }}
          </div>
          <p class="text-[10px] text-gray-500 mt-0.5 leading-tight">{{ p.hint }}</p>
        </div>
        <p class="text-[10px] text-gray-400 px-1 pt-2">Arrastra un bloque al lienzo. Conecta los puntos para enlazar.</p>
      </div>

      <!-- Lienzo -->
      <div class="flex-1 min-w-0 relative" @drop="onDrop" @dragover.prevent>
        <div v-if="loading" class="absolute inset-0 grid place-items-center text-gray-400 z-10">Cargando flujo…</div>
        <VueFlow :node-types="nodeTypes" :default-viewport="{ zoom: 0.85 }" :min-zoom="0.2" :max-zoom="1.5" fit-view-on-init class="bg-slate-50">
          <Background pattern-color="#cbd5e1" :gap="18" />
          <Controls />
        </VueFlow>
      </div>

      <!-- Inspector -->
      <div class="w-72 shrink-0 border-l border-gray-200 p-3 overflow-y-auto bg-white">
        <template v-if="!selectedNode">
          <p class="text-sm text-gray-400 mt-2">Selecciona un bloque para editarlo.</p>
        </template>
        <template v-else>
          <div class="flex items-center justify-between mb-3">
            <p class="font-semibold text-brand-dark capitalize">{{ selectedNode.type }}</p>
            <button v-if="selectedNode.type !== 'start'" @click="deleteSelected"
              class="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Eliminar</button>
          </div>

          <!-- MESSAGE -->
          <div v-if="selectedNode.type === 'message'">
            <label class="text-xs text-gray-600 block mb-1">Texto del mensaje</label>
            <textarea v-model="selectedNode.data.text" rows="5"
              class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:border-brand-green outline-none"></textarea>
          </div>

          <!-- ASK -->
          <div v-else-if="selectedNode.type === 'ask'" class="space-y-3">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Pregunta (se envía y espera respuesta)</label>
              <textarea v-model="selectedNode.data.text" rows="4"
                class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:border-brand-green outline-none"></textarea>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Guardar respuesta en (variable)</label>
              <input v-model="selectedNode.data.saveAs"
                class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:border-brand-green outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Tipo de respuesta</label>
              <select v-model="selectedNode.data.capture"
                class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:border-brand-green outline-none">
                <option v-for="c in CAPTURE_OPTS" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
          </div>

          <!-- ACTION -->
          <div v-else-if="selectedNode.type === 'action'" class="space-y-3">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Acción</label>
              <select v-model="selectedNode.data.action"
                class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:border-brand-green outline-none">
                <option v-for="a in ACTIONS" :key="a.value" :value="a.value">{{ a.label }}</option>
              </select>
            </div>
            <div v-if="actionMeta?.params?.includes('mode')">
              <label class="text-xs text-gray-600 block mb-1">Modo de búsqueda</label>
              <select v-model="selectedNode.data.params.mode"
                class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:border-brand-green outline-none">
                <option :value="undefined">Según respuesta del cliente</option>
                <option value="near">Más cercanos (por CP)</option>
                <option value="score">Mejor calificados</option>
              </select>
            </div>
            <p class="text-[11px] text-gray-500">Salidas: <b>{{ (actionMeta?.outs || []).join(', ') || 'única' }}</b> — conéctalas desde los puntos inferiores.</p>
          </div>

          <!-- CONDITION -->
          <div v-else-if="selectedNode.type === 'condition'" class="space-y-3">
            <p class="text-[11px] text-gray-500">Se evalúa de arriba a abajo; el primer caso que cumpla gana. Si ninguno, sale por <b>“Si no”</b>.</p>
            <div v-for="(c, ci) in selectedNode.data.cases" :key="ci" class="border border-gray-200 rounded-lg p-2 space-y-2">
              <div class="flex items-center gap-2">
                <input v-model="c.label" class="flex-1 border border-gray-300 rounded px-2 py-1 text-xs font-medium" placeholder="Etiqueta del caso" />
                <button @click="removeCase(selectedNode.data, ci)" class="text-red-400 text-xs">✕</button>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span class="text-gray-500">Combinar reglas:</span>
                <select v-model="c.logic" class="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white">
                  <option value="AND">Y (todas)</option>
                  <option value="OR">O (alguna)</option>
                </select>
              </div>
              <div v-for="(r, ri) in c.rules" :key="ri" class="bg-gray-50 rounded p-1.5 space-y-1">
                <div class="flex items-center gap-1">
                  <select :value="fieldBase(r)" @change="setField(r, $event.target.value)"
                    class="flex-1 border border-gray-300 rounded px-1 py-0.5 text-xs bg-white">
                    <option v-for="f in CONDITION_FIELDS" :key="f.value" :value="f.value">{{ f.label }}</option>
                  </select>
                  <button @click="removeRule(c, ri)" class="text-red-400 text-xs px-1">✕</button>
                </div>
                <input v-if="fieldBase(r) === 'vars'" :value="varName(r)" @input="setVarName(r, $event.target.value)"
                  placeholder="nombre de variable" class="w-full border border-gray-300 rounded px-1 py-0.5 text-xs font-mono" />
                <select v-model="r.op" class="w-full border border-gray-300 rounded px-1 py-0.5 text-xs bg-white">
                  <option v-for="o in OPERATORS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <input v-if="!noValueOps.includes(r.op)" v-model="r.value" placeholder="valor"
                  class="w-full border border-gray-300 rounded px-1 py-0.5 text-xs" />
              </div>
              <button @click="addRule(c)" class="text-[11px] text-brand-medium hover:underline">+ regla</button>
            </div>
            <button @click="addCase(selectedNode.data)" class="text-xs text-brand-green font-medium hover:underline">+ agregar caso</button>
          </div>

          <!-- START / END -->
          <div v-else class="text-sm text-gray-500">
            <p v-if="selectedNode.type === 'start'">Punto de entrada del flujo. Conéctalo al primer bloque.</p>
            <p v-else>Termina la conversación. La próxima vez el cliente reinicia desde Inicio.</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style>
.vue-flow__handle { width: 9px; height: 9px; background: #128C7E; border: 1px solid #fff; }
.vue-flow__edge-path { stroke: #94a3b8; stroke-width: 2; }
.vue-flow__edge-text { font-size: 9px; fill: #475569; }
</style>
