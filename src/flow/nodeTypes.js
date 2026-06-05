// Metadatos de los tipos de nodo del constructor de flujo

export const PALETTE = [
  { type: 'message', label: 'Mensaje', icon: '💬', color: '#128C7E', hint: 'Envía un texto al cliente' },
  { type: 'ask', label: 'Pregunta', icon: '❓', color: '#075E54', hint: 'Pregunta y espera respuesta' },
  { type: 'condition', label: 'Condición', icon: '🔀', color: '#8B5CF6', hint: 'if / else-if / case' },
  { type: 'action', label: 'Acción', icon: '⚙️', color: '#0EA5E9', hint: 'Buscar, catálogo, trabajos…' },
  { type: 'end', label: 'Fin', icon: '🏁', color: '#6B7280', hint: 'Termina la conversación' },
]

export const NODE_META = {
  start: { label: 'Inicio', icon: '▶️', color: '#25D366' },
  message: { label: 'Mensaje', icon: '💬', color: '#128C7E' },
  ask: { label: 'Pregunta', icon: '❓', color: '#075E54' },
  condition: { label: 'Condición', icon: '🔀', color: '#8B5CF6' },
  action: { label: 'Acción', icon: '⚙️', color: '#0EA5E9' },
  end: { label: 'Fin', icon: '🏁', color: '#6B7280' },
}

// Datos por defecto al crear cada nodo
export const makeData = (type) => {
  switch (type) {
    case 'message': return { text: 'Escribe aquí el mensaje…' }
    case 'ask': return { text: '¿Qué necesitas?', saveAs: 'respuesta', capture: 'text' }
    case 'condition': return { cases: [{ label: 'Caso 1', logic: 'AND', rules: [{ field: 'message', op: 'contains', value: '' }] }] }
    case 'action': return { action: 'matchService', params: {} }
    default: return {}
  }
}

// Acciones disponibles y sus salidas (handles)
export const ACTIONS = [
  { value: 'matchService', label: 'Reconocer servicio (texto → giro)', outs: ['matched', 'notMatched'] },
  { value: 'search', label: 'Buscar proveedores', outs: ['found', 'empty'], params: ['mode'] },
  { value: 'sendCatalog', label: 'Enviar catálogo (top 5)', outs: ['found', 'empty'] },
  { value: 'startRequest', label: 'Registrar solicitud', outs: [] },
  { value: 'showWorks', label: 'Mostrar trabajos / navegar', outs: ['shown', 'menu', 'back', 'none'] },
]

export const OUT_LABELS = {
  matched: 'Sí reconoció', notMatched: 'No reconoció',
  found: 'Hay resultados', empty: 'Sin resultados',
  shown: 'Mostró trabajos', menu: 'Otro servicio', back: 'Volver', none: 'No entendió',
  else: 'Si no (else)',
}

export const CAPTURE_OPTS = [
  { value: 'text', label: 'Texto libre' },
  { value: 'zip', label: 'Código postal (5 díg.)' },
  { value: 'score', label: 'Calificación (1-5)' },
  { value: 'mode', label: 'Modo (cerca/mejor)' },
]

export const CONDITION_FIELDS = [
  { value: 'message', label: 'Texto del cliente' },
  { value: 'intent', label: 'Intención detectada (clave)' },
  { value: 'service', label: 'Servicio elegido' },
  { value: 'cp', label: 'Código postal' },
  { value: 'resultsCount', label: 'Nº de resultados' },
  { value: 'hasResults', label: '¿Hay resultados?' },
  { value: 'isOpen', label: '¿En horario?' },
  { value: 'vars', label: 'Variable capturada…' },
]

export const OPERATORS = [
  { value: 'contains', label: 'contiene' },
  { value: 'matches', label: 'coincide (difuso)' },
  { value: 'equals', label: 'es igual a' },
  { value: 'exists', label: 'existe / no vacío' },
  { value: 'gt', label: 'mayor que' },
  { value: 'lt', label: 'menor que' },
  { value: 'isTrue', label: 'es verdadero' },
  { value: 'isFalse', label: 'es falso' },
]

const ACTION_OUTS = Object.fromEntries(ACTIONS.map((a) => [a.value, a.outs]))

// Salidas (handles) de un nodo, según su tipo/datos
export const outputsFor = (node) => {
  const d = node.data || {}
  if (node.type === 'end') return []
  if (node.type === 'condition') {
    const cases = (d.cases || []).map((c, i) => ({ id: `case-${i}`, label: c.label || `Caso ${i + 1}` }))
    return [...cases, { id: 'else', label: OUT_LABELS.else }]
  }
  if (node.type === 'action') {
    const outs = ACTION_OUTS[d.action] || []
    if (!outs.length) return [{ id: null, label: '' }]
    return outs.map((o) => ({ id: o, label: OUT_LABELS[o] || o }))
  }
  return [{ id: null, label: '' }] // start, message, ask
}
