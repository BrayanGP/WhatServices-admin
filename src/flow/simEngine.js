// Intérprete del flujo del lado del cliente (para el simulador de teléfono).
// Replica la semántica del motor del backend (flow.runtime.js) pero "simula" las acciones
// (buscar / catálogo / trabajos) con datos de ejemplo. NO envía nada a WhatsApp.

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const MAX_STEPS = 60
const WAIT_TYPES = ['ask', 'buttons', 'list', 'poll']

const getPostalCode = (t) => { const m = String(t || '').match(/\b\d{5}\b/); return m ? m[0] : null }
const getScore = (t) => { const m = String(t || '').match(/[1-5]/); return m ? Number(m[0]) : null }

const captureValue = (capture, text, lower) => {
  switch (capture) {
    case 'zip': return getPostalCode(text)
    case 'score': return getScore(text)
    case 'mode':
      if (/\b(1|cerca|cercan|near|ubicaci)/i.test(lower)) return 'near'
      if (/\b(2|mejor|mejores|calificad|score|estrella)/i.test(lower)) return 'score'
      return null
    default: return text
  }
}

const fieldValue = (field, ctx) => {
  if (field && field.startsWith('vars.')) return ctx.vars[field.slice(5)]
  switch (field) {
    case 'message': return ctx.lower
    case 'intent': return ctx.intent || ''
    case 'service': return ctx.service || ''
    case 'cp': return ctx.cp || ''
    case 'resultsCount': return ctx.resultsCount || 0
    case 'hasResults': return (ctx.resultsCount || 0) > 0
    case 'isOpen': return !!ctx.isOpen
    default: return ''
  }
}

const evalRule = (rule, ctx) => {
  const fv = fieldValue(rule.field, ctx); const val = rule.value
  switch (rule.op) {
    case 'contains': case 'matches': return norm(fv).includes(norm(val))
    case 'equals': return norm(fv) === norm(val)
    case 'exists': return fv !== undefined && fv !== null && String(fv).trim() !== ''
    case 'gt': return Number(fv) > Number(val)
    case 'lt': return Number(fv) < Number(val)
    case 'isTrue': return fv === true || fv === 'true'
    case 'isFalse': return !fv || fv === 'false'
    default: return false
  }
}

const evalCase = (k, ctx) => {
  const rules = k.rules || []
  if (!rules.length) return true
  return k.logic === 'OR' ? rules.some((r) => evalRule(r, ctx)) : rules.every((r) => evalRule(r, ctx))
}

const resolveSelection = (items, prefix, text, lower) => {
  const list = items || []
  let hit = list.find((it) => String(it.id) === text)
  if (hit) return `${prefix}:${hit.id}`
  const num = lower.match(/^(\d{1,2})$/)
  if (num) { const it = list[Number(num[1]) - 1]; if (it) return `${prefix}:${it.id}` }
  hit = list.find((it) => norm(it.label) && norm(lower).includes(norm(it.label)))
  if (hit) return `${prefix}:${hit.id}`
  return 'else'
}

const fill = (tpl, vars) => String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''))

// Avanza el flujo. Devuelve { bubbles, state, awaiting }.
// helpers: { matchService(lower)->name|null, matchIntent(lower)->key|null, servicesList, categoriesCount }
export const advance = (graph, state, input, helpers) => {
  const nodes = graph.nodes || []
  const edges = graph.edges || []
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const getNext = (id, handle) => {
    const outs = edges.filter((e) => e.source === id)
    if (handle) { const e = outs.find((x) => x.sourceHandle === handle); return e ? nodeMap[e.target] : null }
    const e = outs.find((x) => !x.sourceHandle) || outs[0]
    return e ? nodeMap[e.target] : null
  }

  const text = input || ''
  const lower = text.toLowerCase()
  const vars = { ...(state.vars || {}) }
  const ctx = {
    message: text, lower,
    intent: helpers.matchIntent ? (helpers.matchIntent(lower) || '') : '',
    service: state.service || '',
    cp: state.cp || '',
    resultsCount: state.resultsCount || 0,
    isOpen: true, name: 'Cliente',
    vars,
  }
  // Variables dinámicas (espejo del backend)
  const now = new Date()
  const h = now.getHours()
  const greeting = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = String(ctx.name || '').trim().split(/\s+/)[0] || ''
  let dateStr = '', timeStr = ''
  try { dateStr = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(now) } catch (e) { dateStr = now.toLocaleDateString() }
  try { timeStr = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(now) } catch (e) { timeStr = now.toLocaleTimeString() }

  const fillVars = () => ({
    name: ctx.name, firstName, greeting, phone: '521555000000', intent: ctx.intent,
    service: ctx.service || '', cp: ctx.cp || '', count: ctx.resultsCount || 0,
    services: helpers.servicesList || '', servicesCount: helpers.servicesCount || 0,
    date: dateStr, time: timeStr, open: 8, close: 20, ...ctx.vars,
  })

  const bubbles = []
  const bot = (t) => { if (t) bubbles.push({ from: 'bot', text: t }) }
  const note = (t) => bubbles.push({ from: 'note', text: t })

  let current = null
  const waiting = state.nodeId ? nodeMap[state.nodeId] : null

  if (waiting && WAIT_TYPES.includes(waiting.type)) {
    const d = waiting.data || {}
    if (waiting.type === 'ask') {
      const val = captureValue(d.capture, text, lower)
      if (val == null && d.capture && d.capture !== 'text') {
        bot(fill(d.text || 'No te entendí, intenta de nuevo.', fillVars()))
        return { bubbles, state: { ...state, vars }, awaiting: { type: 'ask' } }
      }
      vars[d.saveAs || 'respuesta'] = val
      if (d.capture === 'zip') ctx.cp = val
      if (d.capture === 'mode') vars.searchMode = val
      current = getNext(waiting.id)
    } else if (waiting.type === 'buttons') {
      current = getNext(waiting.id, resolveSelection(d.buttons, 'btn', text, lower))
    } else if (waiting.type === 'list') {
      const rows = (d.sections || []).flatMap((s) => s.rows || [])
      current = getNext(waiting.id, resolveSelection(rows, 'row', text, lower))
    } else if (waiting.type === 'poll') {
      current = getNext(waiting.id, resolveSelection(d.options, 'opt', text, lower))
    }
  } else {
    const start = nodes.find((n) => n.type === 'start')
    current = start ? getNext(start.id) : null
    if (!start) note('⚠️ No hay bloque de Inicio en el flujo.')
    else if (!current) note('⚠️ El bloque Inicio no está conectado a ningún bloque.')
  }

  let steps = 0
  let last = waiting || null
  while (current && steps < MAX_STEPS) {
    steps += 1
    const node = current
    last = node
    const d = node.data || {}

    if (node.type === 'message') { bot(fill(d.text, fillVars())); current = getNext(node.id); continue }

    if (node.type === 'ask') {
      bot(fill(d.text, fillVars()))
      return { bubbles, state: { ...state, nodeId: node.id, vars, service: ctx.service, cp: ctx.cp, resultsCount: ctx.resultsCount }, awaiting: { type: 'ask' } }
    }

    if (node.type === 'condition') {
      let handle = 'else'
      const cases = d.cases || []
      for (let i = 0; i < cases.length; i++) { if (evalCase(cases[i], ctx)) { handle = `case-${i}`; break } }
      current = getNext(node.id, handle); continue
    }

    if (node.type === 'intent') {
      const sel = (d.intents || []).includes(ctx.intent) && ctx.intent ? `intent:${ctx.intent}` : 'else'
      current = getNext(node.id, sel); continue
    }

    if (node.type === 'action') {
      const a = d.action
      if (a === 'matchService') {
        const name = helpers.matchService ? helpers.matchService(lower) : null
        if (name) { ctx.service = name; vars.service = name; note(`⚙️ Reconoció el servicio: ${name}`); current = getNext(node.id, 'matched') }
        else { note('⚙️ No reconoció el servicio'); current = getNext(node.id, 'notMatched') }
        continue
      }
      if (a === 'search') {
        ctx.resultsCount = 3
        note('🔎 (simulado) Busca proveedores → 3 resultados')
        current = getNext(node.id, 'found'); continue
      }
      if (a === 'sendCatalog') {
        ctx.resultsCount = ctx.resultsCount || 3
        note('📇 (simulado) Envía catálogo: 3 proveedores con foto, rating y contacto')
        current = getNext(node.id, 'found'); continue
      }
      if (a === 'startRequest') { note('📝 (simulado) Registra la solicitud'); current = getNext(node.id); continue }
      if (a === 'showWorks') {
        const numeric = lower.match(/(\d{1,2})/)
        if (/\b(otro|otra|nuevo|menu)\b/.test(lower)) { note('🔄 Otro servicio'); current = getNext(node.id, 'menu') }
        else if (/\b(volver|regresar|atras|lista)\b/.test(lower)) { note('🔙 Volver a la lista'); current = getNext(node.id, 'back') }
        else if (numeric) { note(`👷 (simulado) Muestra trabajos del proveedor ${numeric[1]}`); current = getNext(node.id, 'shown') }
        else { note('🤔 No entendió la selección'); current = getNext(node.id, 'none') }
        continue
      }
      note(`⚙️ (acción: ${a})`); current = getNext(node.id); continue
    }

    if (node.type === 'buttons') {
      bot(fill(d.text, fillVars()))
      const opts = (d.buttons || []).map((b) => ({ id: b.id, label: b.label }))
      return { bubbles, state: { ...state, nodeId: node.id, vars, service: ctx.service, cp: ctx.cp, resultsCount: ctx.resultsCount }, awaiting: { type: 'buttons', options: opts } }
    }

    if (node.type === 'list') {
      bot(fill(d.text, fillVars()))
      const opts = (d.sections || []).flatMap((s) => s.rows || []).map((r) => ({ id: r.id, label: r.label }))
      return { bubbles, state: { ...state, nodeId: node.id, vars, service: ctx.service, cp: ctx.cp, resultsCount: ctx.resultsCount }, awaiting: { type: 'list', options: opts } }
    }

    if (node.type === 'poll') {
      bot(`📊 ${fill(d.question, fillVars())}`)
      const opts = (d.options || []).map((o) => ({ id: o.id, label: o.label }))
      return { bubbles, state: { ...state, nodeId: node.id, vars, service: ctx.service, cp: ctx.cp, resultsCount: ctx.resultsCount }, awaiting: { type: 'poll', options: opts } }
    }

    if (node.type === 'carousel') {
      (d.cards || []).forEach((c) => note(`🖼️ ${c.title || 'Tarjeta'}${c.body ? ' — ' + c.body : ''}`))
      current = getNext(node.id); continue
    }

    if (node.type === 'end') {
      return { bubbles, state: { nodeId: null, vars: {} }, awaiting: { type: 'ended' } }
    }

    current = getNext(node.id)
  }

  // sin más nodos → fin (o aviso si quedó un bloque sin salida conectada)
  if (last && last.type !== 'end' && last.type !== 'start') {
    note(`⚠️ El bloque "${last.type}" no tiene salida conectada; la conversación se detiene aquí.`)
  }
  return { bubbles, state: { nodeId: null, vars: {} }, awaiting: { type: 'ended' } }
}
