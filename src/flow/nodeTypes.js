// Metadatos de los tipos de nodo del constructor de flujo

export const uid = () => `id${Math.random().toString(36).slice(2, 7)}`

export const PALETTE = [
  { type: 'message', label: 'Mensaje', icon: '💬', color: '#128C7E', hint: 'Envía un texto al cliente', group: 'Básicos' },
  { type: 'ask', label: 'Pregunta', icon: '❓', color: '#075E54', hint: 'Pregunta y espera respuesta', group: 'Básicos' },
  { type: 'condition', label: 'Condición', icon: '🔀', color: '#8B5CF6', hint: 'if / else-if / case', group: 'Lógica' },
  { type: 'intent', label: 'Intención', icon: '🎯', color: '#F59E0B', hint: 'Ramifica por intención detectada', group: 'Lógica' },
  { type: 'buttons', label: 'Botones', icon: '🔘', color: '#0EA5E9', hint: 'Multi-opción (máx 3)', group: 'WhatsApp' },
  { type: 'list', label: 'Lista', icon: '📋', color: '#0EA5E9', hint: 'Menú con secciones', group: 'WhatsApp' },
  { type: 'poll', label: 'Encuesta', icon: '📊', color: '#0EA5E9', hint: 'Votación nativa', group: 'WhatsApp' },
  { type: 'carousel', label: 'Carrusel', icon: '🖼️', color: '#0EA5E9', hint: 'Galería de tarjetas', group: 'WhatsApp' },
  { type: 'action', label: 'Acción', icon: '⚙️', color: '#0284C7', hint: 'Buscar, catálogo, trabajos…', group: 'Acciones' },
  { type: 'end', label: 'Fin', icon: '🏁', color: '#6B7280', hint: 'Termina la conversación', group: 'Acciones' },
]

// Orden de los módulos de la paleta
export const PALETTE_GROUPS = ['Básicos', 'Lógica', 'WhatsApp', 'Acciones']

// Variables disponibles en los mensajes del flujo (dinámicas, se llenan en tiempo real)
export const FLOW_VARS = [
  { v: '{name}', d: 'Nombre del cliente' },
  { v: '{firstName}', d: 'Primer nombre' },
  { v: '{greeting}', d: 'Buenos días/tardes/noches (según la hora)' },
  { v: '{phone}', d: 'Teléfono del cliente' },
  { v: '{services}', d: 'Lista de TODAS las categorías activas' },
  { v: '{servicesCount}', d: 'Cuántas categorías hay' },
  { v: '{servicesAvailable}', d: 'Solo categorías que SÍ tienen proveedores' },
  { v: '{servicesAvailableCount}', d: 'Cuántas tienen proveedores' },
  { v: '{topRated}', d: 'Top 5 mejor calificados (del servicio si hay)' },
  { v: '{nearby}', d: '5 más cercanos al CP del cliente' },
  { v: '{service}', d: 'Servicio que eligió' },
  { v: '{count}', d: 'Nº de resultados encontrados' },
  { v: '{cp}', d: 'Código postal capturado' },
  { v: '{date}', d: 'Fecha actual' },
  { v: '{time}', d: 'Hora actual' },
  { v: '{open} {close}', d: 'Horario de atención' },
]

export const NODE_META = {
  start: { label: 'Inicio', icon: '▶️', color: '#25D366' },
  message: { label: 'Mensaje', icon: '💬', color: '#128C7E' },
  ask: { label: 'Pregunta', icon: '❓', color: '#075E54' },
  condition: { label: 'Condición', icon: '🔀', color: '#8B5CF6' },
  intent: { label: 'Intención', icon: '🎯', color: '#F59E0B' },
  buttons: { label: 'Botones', icon: '🔘', color: '#0EA5E9' },
  list: { label: 'Lista', icon: '📋', color: '#0EA5E9' },
  poll: { label: 'Encuesta', icon: '📊', color: '#0EA5E9' },
  carousel: { label: 'Carrusel', icon: '🖼️', color: '#0EA5E9' },
  action: { label: 'Acción', icon: '⚙️', color: '#0284C7' },
  end: { label: 'Fin', icon: '🏁', color: '#6B7280' },
}

// Datos por defecto al crear cada nodo
export const makeData = (type) => {
  switch (type) {
    case 'message': return { text: 'Escribe aquí el mensaje…' }
    case 'ask': return { text: '¿Qué necesitas?', saveAs: 'respuesta', capture: 'text' }
    case 'condition': return { cases: [{ label: 'Caso 1', logic: 'AND', rules: [{ field: 'message', op: 'contains', value: '' }] }] }
    case 'action': return { action: 'matchService', params: {} }
    case 'intent': return { intents: [] }
    case 'buttons': return { text: 'Elige una opción:', buttons: [{ id: uid(), label: 'Opción 1' }, { id: uid(), label: 'Opción 2' }] }
    case 'list': return { text: 'Selecciona una opción:', buttonText: 'Ver opciones', footer: '', sections: [{ title: 'Opciones', rows: [{ id: uid(), label: 'Fila 1', description: '' }] }] }
    case 'poll': return { question: '¿Cuál prefieres?', options: [{ id: uid(), label: 'Opción 1' }, { id: uid(), label: 'Opción 2' }], multi: false }
    case 'carousel': return { source: 'static', cards: [{ image: '', title: 'Tarjeta 1', body: '' }] }
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
  if (node.type === 'intent') {
    const ints = (d.intents || []).map((k) => ({ id: `intent:${k}`, label: k }))
    return [...ints, { id: 'else', label: OUT_LABELS.else }]
  }
  if (node.type === 'buttons') {
    const b = (d.buttons || []).map((x) => ({ id: `btn:${x.id}`, label: x.label }))
    return [...b, { id: 'else', label: OUT_LABELS.else }]
  }
  if (node.type === 'list') {
    const rows = (d.sections || []).flatMap((s) => s.rows || []).map((r) => ({ id: `row:${r.id}`, label: r.label }))
    return [...rows, { id: 'else', label: OUT_LABELS.else }]
  }
  if (node.type === 'poll') {
    const o = (d.options || []).map((x) => ({ id: `opt:${x.id}`, label: x.label }))
    return [...o, { id: 'else', label: OUT_LABELS.else }]
  }
  return [{ id: null, label: '' }] // start, message, ask, carousel
}
