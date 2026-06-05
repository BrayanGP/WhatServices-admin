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
import FlowSimulator from '../flow/FlowSimulator.vue'
import IntentsManager from '../components/IntentsManager.vue'
import { TEMPLATES } from '../flow/templates'
import {
  PALETTE, PALETTE_GROUPS, FLOW_VARS, makeData, ACTIONS, CAPTURE_OPTS, CONDITION_FIELDS, OPERATORS, uid,
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
const galleryOpen = ref(false)
const simOpen = ref(false)
const showVars = ref(false)
const intentsList = ref([])
const categoriesList = ref([])
const availableCats = ref([])
const customTemplates = ref([])
const customVars = ref([])
const savingVars = ref(false)
const TEMPLATES_ = TEMPLATES
const customVarsObj = computed(() => Object.fromEntries(customVars.value.filter((v) => v.key && v.key.trim()).map((v) => [v.key.trim(), v.value])))
const FLOW_VARS_ = FLOW_VARS
const groupedPalette = PALETTE_GROUPS.map((g) => ({ g, items: PALETTE.filter((p) => p.group === g) }))

// Resaltado del nodo activo durante la simulación
const highlightNode = (id) => {
  nodes.value.forEach((n) => { n.class = n.id === id ? 'sim-active' : '' })
}
const closeSim = () => { simOpen.value = false; highlightNode(null) }
const fitAll = () => { try { fitView({ padding: 0.2 }) } catch (e) {} }

// Gestor de intenciones (modal accesible desde el editor)
const intentsOpen = ref(false)
const openIntents = () => { intentsOpen.value = true }
const onIntentsChanged = async () => { intentsList.value = await store.fetchIntents().catch(() => intentsList.value) }

// Variables propias
const addVar = () => customVars.value.push({ key: '', value: '' })
const removeVar = (i) => customVars.value.splice(i, 1)
const saveVars = async () => {
  savingVars.value = true
  try {
    await store.updateBotConfig({ variables: customVars.value.filter((v) => v.key && v.key.trim()) })
    flash('💾 Variables guardadas')
  } catch (e) { flash('No se pudieron guardar las variables') }
  finally { savingVars.value = false }
}

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
    const [r, ints, cats, provs, tpls, cfg] = await Promise.all([
      store.fetchFlow(),
      store.fetchIntents().catch(() => []),
      store.fetchCategories().catch(() => []),
      store.fetchProviders({ limit: 1000 }).catch(() => ({ providers: [] })),
      store.fetchFlowTemplates().catch(() => []),
      store.fetchBotConfig().catch(() => ({})),
    ])
    isPublished.value = !!r.isPublished
    intentsList.value = ints || []
    customTemplates.value = tpls || []
    customVars.value = (cfg.variables || []).map((v) => ({ key: v.key, value: v.value }))
    categoriesList.value = Array.isArray(cats) ? cats : (cats.categories || [])
    const provList = (provs.providers || []).filter((p) => p.availability === 'available' && !p.isBlocked)
    availableCats.value = [...new Set(provList.flatMap((p) => p.categories || []))]
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
const pickTemplate = (t) => {
  if (!confirm(`Cargar la plantilla “${t.name}”. Esto reemplaza el lienzo actual. ¿Continuar?`)) return
  applyGraph(t.build()); selectedId.value = null; galleryOpen.value = false
}
const pickCustom = (t) => {
  if (!confirm(`Cargar la plantilla “${t.name}”. Esto reemplaza el lienzo actual. ¿Continuar?`)) return
  applyGraph(t.graph || { nodes: [], edges: [] }); selectedId.value = null; galleryOpen.value = false
}
const removeCustom = async (t) => {
  if (!confirm(`¿Eliminar la plantilla “${t.name}”?`)) return
  try { await store.deleteFlowTemplate(t._id); customTemplates.value = customTemplates.value.filter((x) => x._id !== t._id) }
  catch (e) { flash('No se pudo eliminar') }
}
const saveAsTemplate = async () => {
  const name = prompt('Nombre de la plantilla:')
  if (!name || !name.trim()) return
  const description = prompt('Descripción (opcional):') || ''
  try {
    const g = serialize()
    const tpl = await store.createFlowTemplate({ name: name.trim(), description, icon: '⭐', nodes: g.nodes, edges: g.edges })
    customTemplates.value.unshift(tpl)
    flash('⭐ Plantilla guardada')
  } catch (e) { flash(e.message || 'No se pudo guardar la plantilla') }
}

// ---- Inspector: helpers para listas de los componentes ----
const addButton = (d) => d.buttons.push({ id: uid(), label: `Opción ${d.buttons.length + 1}` })
const removeButton = (d, i) => d.buttons.splice(i, 1)
const addRow = (sec) => sec.rows.push({ id: uid(), label: 'Nueva fila', description: '' })
const removeRow = (sec, i) => sec.rows.splice(i, 1)
const addOption = (d) => d.options.push({ id: uid(), label: `Opción ${d.options.length + 1}` })
const removeOption = (d, i) => d.options.splice(i, 1)
const addCard = (d) => d.cards.push({ image: '', title: `Tarjeta ${d.cards.length + 1}`, body: '' })
const removeCard = (d, i) => d.cards.splice(i, 1)
const toggleIntent = (d, key) => {
  if (!Array.isArray(d.intents)) d.intents = []
  const i = d.intents.indexOf(key)
  if (i === -1) d.intents.push(key); else d.intents.splice(i, 1)
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
    <div class="flex items-center gap-x-2 gap-y-1 flex-wrap px-2 py-2 border-b border-gray-200">
      <router-link to="/bot" class="text-sm text-brand-medium hover:underline">← Bot</router-link>
      <span class="text-xs px-2 py-1 rounded-full font-medium"
        :class="isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
        {{ isPublished ? '● Publicado' : '○ Borrador' }}
      </span>
      <span class="text-xs text-gray-500">{{ status }}</span>

      <div class="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
        <button @click="fitAll" class="text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">🔍 Ver todo</button>
        <button @click="openIntents" class="text-sm px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50">🎯 Intenciones</button>
        <button @click="simOpen = true" class="text-sm px-2.5 py-1.5 rounded-lg border border-brand-green text-brand-medium hover:bg-green-50">📱 Probar</button>
        <button @click="galleryOpen = true" class="text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">Plantillas</button>
        <button @click="clearAll" class="text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">Limpiar</button>
        <button @click="save" class="text-sm px-2.5 py-1.5 rounded-lg bg-brand-medium text-white hover:opacity-90">Guardar</button>
        <button v-if="!isPublished" @click="publish" class="text-sm px-2.5 py-1.5 rounded-lg bg-brand-green text-white hover:bg-brand-lightGreen">Publicar</button>
        <template v-else>
          <button @click="publish" class="text-sm px-2.5 py-1.5 rounded-lg bg-brand-green text-white hover:bg-brand-lightGreen">Republicar</button>
          <button @click="unpublish" class="text-sm px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">Despublicar</button>
        </template>
      </div>
    </div>

    <div class="flex flex-1 min-h-0">
      <!-- Paleta (por módulos) -->
      <div class="w-44 shrink-0 border-r border-gray-200 p-2 space-y-3 overflow-y-auto bg-gray-50">
        <div v-for="grp in groupedPalette" :key="grp.g">
          <p class="text-[11px] uppercase tracking-wide text-gray-400 font-semibold px-1 mb-1">{{ grp.g }}</p>
          <div class="space-y-1.5">
            <div v-for="p in grp.items" :key="p.type" draggable="true" @dragstart="onDragStart($event, p.type)"
              class="cursor-grab active:cursor-grabbing rounded-lg border border-gray-200 bg-white p-2 hover:border-brand-green hover:shadow-sm transition">
              <div class="flex items-center gap-2 text-sm font-medium text-brand-dark">
                <span :style="{ color: p.color }">{{ p.icon }}</span> {{ p.label }}
              </div>
              <p class="text-[10px] text-gray-500 mt-0.5 leading-tight">{{ p.hint }}</p>
            </div>
          </div>
        </div>
        <p class="text-[10px] text-gray-400 px-1 pt-1 border-t border-gray-200">Arrastra un bloque al lienzo. Conecta los puntos para enlazar.</p>
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
        <!-- Variables disponibles -->
        <div class="mb-3 border border-brand-green/30 rounded-lg bg-brand-light/40">
          <button @click="showVars = !showVars" class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-brand-dark">
            <span>🔤 Variables disponibles</span>
            <span class="text-gray-400">{{ showVars ? '▲' : '▼' }}</span>
          </button>
          <div v-if="showVars" class="px-3 pb-3 space-y-1">
            <p class="text-[11px] text-gray-500 mb-1">Escríbelas en cualquier mensaje o pregunta; se reemplazan solas con datos reales.</p>
            <div v-for="x in FLOW_VARS_" :key="x.v" class="flex gap-2 text-[11px]">
              <code class="text-brand-medium font-mono shrink-0">{{ x.v }}</code>
              <span class="text-gray-600">{{ x.d }}</span>
            </div>
            <p class="text-[11px] text-gray-500 pt-1 border-t border-brand-green/20 mt-1">
              También puedes usar lo que guardes en una <b>Pregunta</b>: <code class="text-brand-medium">{tu_variable}</code>.
            </p>

            <!-- Mis variables -->
            <div class="pt-2 border-t border-brand-green/20 mt-1">
              <p class="text-[11px] font-medium text-brand-dark mb-1">⭐ Mis variables</p>
              <p class="text-[11px] text-gray-500 mb-2">Crea constantes (ej. <code class="text-brand-medium">empresa</code> = WhatServices) y úsalas como <code class="text-brand-medium">{empresa}</code>.</p>
              <div v-for="(v, i) in customVars" :key="i" class="flex items-center gap-1 mb-1">
                <input v-model="v.key" placeholder="clave" class="w-24 border border-gray-300 rounded px-1.5 py-1 text-xs font-mono" />
                <span class="text-gray-400 text-xs">=</span>
                <input v-model="v.value" placeholder="valor" class="flex-1 border border-gray-300 rounded px-1.5 py-1 text-xs" />
                <button @click="removeVar(i)" class="text-red-400 text-xs px-1">✕</button>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <button @click="addVar" class="text-xs text-brand-green font-medium hover:underline">+ variable</button>
                <button @click="saveVars" :disabled="savingVars" class="text-xs px-2 py-1 rounded bg-brand-green text-white hover:bg-brand-lightGreen disabled:opacity-50">
                  {{ savingVars ? 'Guardando…' : 'Guardar variables' }}
                </button>
              </div>
            </div>
          </div>
        </div>

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

          <!-- INTENT -->
          <div v-else-if="selectedNode.type === 'intent'" class="space-y-2">
            <p class="text-[11px] text-gray-500">Ramifica según la intención detectada en el mensaje del cliente. Marca las intenciones que quieras enrutar; el resto sale por <b>“Si no”</b>.</p>
            <p v-if="!intentsList.length" class="text-xs text-amber-600">No hay intenciones aún. Créalas en Bot → Intenciones.</p>
            <label v-for="it in intentsList" :key="it._id" class="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-2 py-1.5">
              <input type="checkbox" class="accent-brand-green" :checked="(selectedNode.data.intents || []).includes(it.key)" @change="toggleIntent(selectedNode.data, it.key)" />
              <span class="truncate">{{ it.name }} <span class="text-gray-400 font-mono text-xs">{{ it.key }}</span></span>
            </label>
          </div>

          <!-- BUTTONS -->
          <div v-else-if="selectedNode.type === 'buttons'" class="space-y-3">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Texto</label>
              <textarea v-model="selectedNode.data.text" rows="3" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-brand-green outline-none"></textarea>
            </div>
            <p class="text-[11px] text-gray-500">Botones (máx. 3). Cada uno es una salida.</p>
            <div v-for="(b, i) in selectedNode.data.buttons" :key="b.id" class="flex items-center gap-1">
              <input v-model="b.label" class="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" />
              <button @click="removeButton(selectedNode.data, i)" class="text-red-400 text-xs px-1">✕</button>
            </div>
            <button v-if="selectedNode.data.buttons.length < 3" @click="addButton(selectedNode.data)" class="text-xs text-brand-green font-medium hover:underline">+ botón</button>
          </div>

          <!-- LIST -->
          <div v-else-if="selectedNode.type === 'list'" class="space-y-3">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Texto</label>
              <textarea v-model="selectedNode.data.text" rows="2" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-brand-green outline-none"></textarea>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Texto del botón</label>
              <input v-model="selectedNode.data.buttonText" class="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" />
            </div>
            <div v-for="(sec, si) in selectedNode.data.sections" :key="si" class="border border-gray-200 rounded-lg p-2 space-y-2">
              <input v-model="sec.title" placeholder="Título de la sección" class="w-full border border-gray-300 rounded px-2 py-1 text-xs font-medium" />
              <div v-for="(r, ri) in sec.rows" :key="r.id" class="bg-gray-50 rounded p-1.5 space-y-1">
                <div class="flex items-center gap-1">
                  <input v-model="r.label" placeholder="Fila" class="flex-1 border border-gray-300 rounded px-1 py-0.5 text-xs" />
                  <button @click="removeRow(sec, ri)" class="text-red-400 text-xs px-1">✕</button>
                </div>
                <input v-model="r.description" placeholder="Descripción (opcional)" class="w-full border border-gray-300 rounded px-1 py-0.5 text-xs" />
              </div>
              <button @click="addRow(sec)" class="text-[11px] text-brand-medium hover:underline">+ fila</button>
            </div>
          </div>

          <!-- POLL -->
          <div v-else-if="selectedNode.type === 'poll'" class="space-y-3">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Pregunta</label>
              <input v-model="selectedNode.data.question" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-brand-green outline-none" />
            </div>
            <label class="flex items-center gap-2 text-xs"><input type="checkbox" v-model="selectedNode.data.multi" class="accent-brand-green" /> Permitir varias respuestas</label>
            <p class="text-[11px] text-gray-500">Opciones (cada una es una salida).</p>
            <div v-for="(o, i) in selectedNode.data.options" :key="o.id" class="flex items-center gap-1">
              <input v-model="o.label" class="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" />
              <button @click="removeOption(selectedNode.data, i)" class="text-red-400 text-xs px-1">✕</button>
            </div>
            <button @click="addOption(selectedNode.data)" class="text-xs text-brand-green font-medium hover:underline">+ opción</button>
            <p class="text-[10px] text-amber-600">Nota: el voto de la encuesta puede no ramificar en todos los dispositivos; el bot también acepta la respuesta por número/texto.</p>
          </div>

          <!-- CAROUSEL -->
          <div v-else-if="selectedNode.type === 'carousel'" class="space-y-3">
            <p class="text-[11px] text-gray-500">Galería de tarjetas (se envían como secuencia de imágenes con texto).</p>
            <div v-for="(c, i) in selectedNode.data.cards" :key="i" class="border border-gray-200 rounded-lg p-2 space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-gray-600">Tarjeta {{ i + 1 }}</span>
                <button @click="removeCard(selectedNode.data, i)" class="text-red-400 text-xs">✕</button>
              </div>
              <input v-model="c.image" placeholder="URL de la imagen" class="w-full border border-gray-300 rounded px-1 py-0.5 text-xs font-mono" />
              <input v-model="c.title" placeholder="Título" class="w-full border border-gray-300 rounded px-1 py-0.5 text-xs" />
              <textarea v-model="c.body" rows="2" placeholder="Texto" class="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"></textarea>
            </div>
            <button @click="addCard(selectedNode.data)" class="text-xs text-brand-green font-medium hover:underline">+ tarjeta</button>
          </div>

          <!-- START / END -->
          <div v-else class="text-sm text-gray-500">
            <p v-if="selectedNode.type === 'start'">Punto de entrada del flujo. Conéctalo al primer bloque.</p>
            <p v-else>Termina la conversación. La próxima vez el cliente reinicia desde Inicio.</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal: galería de plantillas -->
    <div v-if="galleryOpen" class="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" @click.self="galleryOpen = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-brand-dark text-lg">Plantillas de flujo</h3>
          <div class="flex items-center gap-2">
            <button @click="saveAsTemplate" class="text-sm px-3 py-1.5 rounded-lg bg-brand-green text-white hover:bg-brand-lightGreen">⭐ Guardar lienzo como plantilla</button>
            <button @click="galleryOpen = false" class="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <p class="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">Integradas</p>
        <div class="grid sm:grid-cols-2 gap-3">
          <button v-for="t in TEMPLATES_" :key="t.id" @click="pickTemplate(t)"
            class="text-left border border-gray-200 rounded-xl p-4 hover:border-brand-green hover:shadow-sm transition">
            <div class="text-2xl mb-1">{{ t.icon }}</div>
            <p class="font-semibold text-brand-dark">{{ t.name }}</p>
            <p class="text-xs text-gray-500 mt-1 leading-snug">{{ t.description }}</p>
          </button>
        </div>

        <template v-if="customTemplates.length">
          <p class="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mt-5 mb-2">Mis plantillas</p>
          <div class="grid sm:grid-cols-2 gap-3">
            <div v-for="t in customTemplates" :key="t._id"
              class="relative text-left border border-gray-200 rounded-xl p-4 hover:border-brand-green hover:shadow-sm transition">
              <button @click="removeCustom(t)" class="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs">🗑️</button>
              <button @click="pickCustom(t)" class="block w-full text-left">
                <div class="text-2xl mb-1">{{ t.icon || '⭐' }}</div>
                <p class="font-semibold text-brand-dark pr-5">{{ t.name }}</p>
                <p class="text-xs text-gray-500 mt-1 leading-snug">{{ t.description }}</p>
              </button>
            </div>
          </div>
        </template>

        <p class="text-[11px] text-gray-400 mt-4">Al elegir una plantilla se reemplaza el lienzo. Guarda el lienzo actual como plantilla para reutilizarlo después.</p>
      </div>
    </div>

    <!-- Modal: gestor de intenciones -->
    <div v-if="intentsOpen" class="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" @click.self="intentsOpen = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-bold text-brand-dark text-lg">🎯 Intenciones</h3>
            <p class="text-xs text-gray-500">Crea y prueba intenciones; úsalas en el nodo “Intención” o en condiciones.</p>
          </div>
          <button @click="intentsOpen = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <IntentsManager @changed="onIntentsChanged" />
      </div>
    </div>

    <!-- Panel: simulador de teléfono -->
    <FlowSimulator v-if="simOpen" :nodes="nodes" :edges="edges" :categories="categoriesList"
      :available-categories="availableCats" :intents="intentsList" :custom-vars="customVarsObj"
      @node="highlightNode" @close="closeSim" />
  </div>
</template>

<style>
.vue-flow__handle { width: 9px; height: 9px; background: #128C7E; border: 1px solid #fff; }
.vue-flow__edge-path { stroke: #94a3b8; stroke-width: 2; }
.vue-flow__edge-text { font-size: 9px; fill: #475569; }
/* nodo activo durante la simulación */
.vue-flow__node.sim-active { outline: 3px solid #25D366; outline-offset: 2px; border-radius: 14px; }
</style>
