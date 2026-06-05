<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NODE_META, outputsFor, ACTIONS } from './nodeTypes'

const props = defineProps({
  id: String,
  type: String,
  data: { type: Object, default: () => ({}) },
  selected: Boolean,
})

const meta = computed(() => NODE_META[props.type] || { label: props.type, icon: '◻️', color: '#94A3B8' })
const outs = computed(() => outputsFor({ type: props.type, data: props.data }))

const pct = (i) => (outs.value.length === 1 ? '50%' : `${((i + 0.5) / outs.value.length) * 100}%`)

const summary = computed(() => {
  const d = props.data || {}
  if (props.type === 'message' || props.type === 'ask') return (d.text || '').slice(0, 70) || '(sin texto)'
  if (props.type === 'action') {
    const a = ACTIONS.find((x) => x.value === d.action)
    return a ? a.label : d.action
  }
  if (props.type === 'condition') return `${(d.cases || []).length} caso(s) + si no`
  if (props.type === 'start') return 'Punto de entrada'
  if (props.type === 'end') return 'Fin de la conversación'
  return ''
})
</script>

<template>
  <div class="flow-node" :style="{ borderColor: selected ? meta.color : '#E2E8F0', boxShadow: selected ? `0 0 0 2px ${meta.color}55` : '' }">
    <!-- entrada -->
    <Handle v-if="type !== 'start'" type="target" :position="Position.Top" />

    <div class="fn-header" :style="{ background: meta.color }">
      <span>{{ meta.icon }}</span><span class="fn-title">{{ meta.label }}</span>
    </div>
    <div class="fn-body">
      <p class="fn-summary">{{ summary }}</p>
      <p v-if="type === 'ask' && data.saveAs" class="fn-tag">→ guarda en <b>{{ data.saveAs }}</b></p>
    </div>

    <!-- salidas -->
    <div class="fn-outs">
      <template v-for="(o, i) in outs" :key="o.id || 'default'">
        <span v-if="o.label" class="fn-out-label" :style="{ left: pct(i) }">{{ o.label }}</span>
        <Handle type="source" :position="Position.Bottom" :id="o.id || undefined" :style="{ left: pct(i) }" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.flow-node {
  width: 190px; background: #fff; border: 2px solid #E2E8F0; border-radius: 12px;
  font-family: inherit; position: relative; padding-bottom: 14px;
}
.fn-header {
  display: flex; align-items: center; gap: 6px; color: #fff; font-weight: 600; font-size: 13px;
  padding: 6px 10px; border-radius: 9px 9px 0 0;
}
.fn-title { line-height: 1; }
.fn-body { padding: 8px 10px; }
.fn-summary { font-size: 12px; color: #334155; white-space: pre-wrap; word-break: break-word; margin: 0; }
.fn-tag { font-size: 10px; color: #64748B; margin: 4px 0 0; }
.fn-outs { position: absolute; bottom: 0; left: 0; right: 0; height: 0; }
.fn-out-label {
  position: absolute; bottom: 6px; transform: translateX(-50%);
  font-size: 9px; color: #475569; background: #F1F5F9; padding: 0 4px; border-radius: 4px; white-space: nowrap; pointer-events: none;
}
</style>
