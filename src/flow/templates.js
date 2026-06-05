import { currentFlowTemplate } from './template'

// Búsqueda simple: servicio → mejor calificados → catálogo
const simple = () => ({
  nodes: [
    { id: 'start', type: 'start', position: { x: 300, y: 0 }, data: {} },
    { id: 'ask_service', type: 'ask', position: { x: 270, y: 110 }, data: { text: '¡Hola {name}! 👋 ¿Qué servicio necesitas?\n\n{services}', saveAs: 'serviceText', capture: 'text' } },
    { id: 'act_match', type: 'action', position: { x: 290, y: 230 }, data: { action: 'matchService', params: {} } },
    { id: 'msg_noservice', type: 'message', position: { x: 20, y: 230 }, data: { text: 'No reconocí ese servicio 🤔. Intenta de nuevo:\n\n{services}' } },
    { id: 'act_search', type: 'action', position: { x: 330, y: 350 }, data: { action: 'search', params: { mode: 'score' } } },
    { id: 'act_catalog', type: 'action', position: { x: 330, y: 460 }, data: { action: 'sendCatalog', params: {} } },
    { id: 'msg_noresults', type: 'message', position: { x: 620, y: 400 }, data: { text: 'Sin profesionales de *{service}* por ahora 😕.' } },
    { id: 'end', type: 'end', position: { x: 360, y: 570 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'ask_service' },
    { id: 'e2', source: 'ask_service', target: 'act_match' },
    { id: 'e3', source: 'act_match', target: 'act_search', sourceHandle: 'matched', label: 'Sí reconoció' },
    { id: 'e4', source: 'act_match', target: 'msg_noservice', sourceHandle: 'notMatched', label: 'No reconoció' },
    { id: 'e5', source: 'msg_noservice', target: 'ask_service' },
    { id: 'e6', source: 'act_search', target: 'act_catalog', sourceHandle: 'found' },
    { id: 'e7', source: 'act_search', target: 'msg_noresults', sourceHandle: 'empty' },
    { id: 'e8', source: 'act_catalog', target: 'end', sourceHandle: 'found' },
    { id: 'e9', source: 'act_catalog', target: 'msg_noresults', sourceHandle: 'empty' },
    { id: 'e10', source: 'msg_noresults', target: 'end' },
  ],
})

// Con intenciones: detecta "hablar con humano" y deriva; lo demás → busca servicio
const intenciones = () => ({
  nodes: [
    { id: 'start', type: 'start', position: { x: 300, y: 0 }, data: {} },
    { id: 'ask_open', type: 'ask', position: { x: 270, y: 110 }, data: { text: '¡Hola {name}! 👋 ¿En qué te puedo ayudar?', saveAs: 'mensaje', capture: 'text' } },
    { id: 'node_intent', type: 'intent', position: { x: 290, y: 230 }, data: { intents: ['hablar-humano'] } },
    { id: 'msg_humano', type: 'message', position: { x: 30, y: 340 }, data: { text: '¡Claro! Te paso con un asesor humano. 🙋 En un momento te contactan.' } },
    { id: 'act_match', type: 'action', position: { x: 340, y: 350 }, data: { action: 'matchService', params: {} } },
    { id: 'msg_noservice', type: 'message', position: { x: 600, y: 300 }, data: { text: 'No te entendí 🤔. Dime el servicio que necesitas:\n\n{services}' } },
    { id: 'act_search', type: 'action', position: { x: 340, y: 460 }, data: { action: 'search', params: { mode: 'score' } } },
    { id: 'act_catalog', type: 'action', position: { x: 340, y: 570 }, data: { action: 'sendCatalog', params: {} } },
    { id: 'end', type: 'end', position: { x: 60, y: 450 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'ask_open' },
    { id: 'e2', source: 'ask_open', target: 'node_intent' },
    { id: 'e3', source: 'node_intent', target: 'msg_humano', sourceHandle: 'intent:hablar-humano', label: 'Hablar con humano' },
    { id: 'e4', source: 'node_intent', target: 'act_match', sourceHandle: 'else', label: 'Otro' },
    { id: 'e5', source: 'msg_humano', target: 'end' },
    { id: 'e6', source: 'act_match', target: 'act_search', sourceHandle: 'matched' },
    { id: 'e7', source: 'act_match', target: 'msg_noservice', sourceHandle: 'notMatched' },
    { id: 'e8', source: 'msg_noservice', target: 'ask_open' },
    { id: 'e9', source: 'act_search', target: 'act_catalog', sourceHandle: 'found' },
    { id: 'e10', source: 'act_search', target: 'end', sourceHandle: 'empty' },
    { id: 'e11', source: 'act_catalog', target: 'end', sourceHandle: 'found' },
    { id: 'e12', source: 'act_catalog', target: 'end', sourceHandle: 'empty' },
  ],
})

// Soporte / FAQ: menú de botones + lista de preguntas frecuentes + humano
const soporte = () => ({
  nodes: [
    { id: 'start', type: 'start', position: { x: 320, y: 0 }, data: {} },
    { id: 'menu', type: 'buttons', position: { x: 280, y: 110 }, data: { text: '¡Hola {name}! 👋 ¿Qué necesitas?', buttons: [
      { id: 'b_buscar', label: 'Buscar servicio' }, { id: 'b_faq', label: 'Preguntas frecuentes' }, { id: 'b_humano', label: 'Hablar con humano' },
    ] } },
    { id: 'ask_service', type: 'ask', position: { x: 20, y: 280 }, data: { text: '¿Qué servicio necesitas?\n\n{services}', saveAs: 'serviceText', capture: 'text' } },
    { id: 'act_match', type: 'action', position: { x: 20, y: 400 }, data: { action: 'matchService', params: {} } },
    { id: 'act_search', type: 'action', position: { x: 20, y: 500 }, data: { action: 'search', params: { mode: 'score' } } },
    { id: 'act_catalog', type: 'action', position: { x: 20, y: 600 }, data: { action: 'sendCatalog', params: {} } },
    { id: 'faq', type: 'list', position: { x: 320, y: 280 }, data: { text: 'Elige una pregunta:', buttonText: 'Ver preguntas', footer: 'WhatServices', sections: [
      { title: 'FAQ', rows: [
        { id: 'r_horario', label: '¿Cuál es el horario?', description: '' },
        { id: 'r_zona', label: '¿Qué zonas cubren?', description: '' },
        { id: 'r_precio', label: '¿Cuánto cuesta?', description: '' },
      ] },
    ] } },
    { id: 'msg_horario', type: 'message', position: { x: 300, y: 440 }, data: { text: 'Atendemos de 8:00 a 20:00, L-S. 🕗' } },
    { id: 'msg_zona', type: 'message', position: { x: 470, y: 440 }, data: { text: 'Cubrimos toda la ciudad y zona conurbada. 📍' } },
    { id: 'msg_precio', type: 'message', position: { x: 640, y: 440 }, data: { text: 'El precio depende del servicio; cada profesional te cotiza sin costo. 💰' } },
    { id: 'msg_humano', type: 'message', position: { x: 620, y: 150 }, data: { text: 'Te paso con un asesor humano. 🙋' } },
    { id: 'end', type: 'end', position: { x: 360, y: 700 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'menu' },
    { id: 'e2', source: 'menu', target: 'ask_service', sourceHandle: 'btn:b_buscar', label: 'Buscar' },
    { id: 'e3', source: 'menu', target: 'faq', sourceHandle: 'btn:b_faq', label: 'FAQ' },
    { id: 'e4', source: 'menu', target: 'msg_humano', sourceHandle: 'btn:b_humano', label: 'Humano' },
    { id: 'e5', source: 'menu', target: 'menu', sourceHandle: 'else' },
    { id: 'e6', source: 'ask_service', target: 'act_match' },
    { id: 'e7', source: 'act_match', target: 'act_search', sourceHandle: 'matched' },
    { id: 'e8', source: 'act_match', target: 'ask_service', sourceHandle: 'notMatched' },
    { id: 'e9', source: 'act_search', target: 'act_catalog', sourceHandle: 'found' },
    { id: 'e10', source: 'act_search', target: 'end', sourceHandle: 'empty' },
    { id: 'e11', source: 'act_catalog', target: 'end', sourceHandle: 'found' },
    { id: 'e12', source: 'act_catalog', target: 'end', sourceHandle: 'empty' },
    { id: 'e13', source: 'faq', target: 'msg_horario', sourceHandle: 'row:r_horario', label: 'Horario' },
    { id: 'e14', source: 'faq', target: 'msg_zona', sourceHandle: 'row:r_zona', label: 'Zonas' },
    { id: 'e15', source: 'faq', target: 'msg_precio', sourceHandle: 'row:r_precio', label: 'Precio' },
    { id: 'e16', source: 'faq', target: 'faq', sourceHandle: 'else' },
    { id: 'e17', source: 'msg_horario', target: 'end' },
    { id: 'e18', source: 'msg_zona', target: 'end' },
    { id: 'e19', source: 'msg_precio', target: 'end' },
    { id: 'e20', source: 'msg_humano', target: 'end' },
  ],
})

// Catálogo con carrusel: carrusel de los 5 → elegir número → sus trabajos → volver
const catalogo = () => ({
  nodes: [
    { id: 'start', type: 'start', position: { x: 320, y: 0 }, data: {} },
    { id: 'ask_service', type: 'ask', position: { x: 280, y: 110 }, data: { text: '¡{greeting}! 👋 ¿Qué servicio necesitas?\n\n{servicesAvailable}', saveAs: 'serviceText', capture: 'text' } },
    { id: 'act_match', type: 'action', position: { x: 300, y: 230 }, data: { action: 'matchService', params: {} } },
    { id: 'msg_noservice', type: 'message', position: { x: 30, y: 230 }, data: { text: 'No reconocí ese servicio 🤔. Intenta de nuevo:\n\n{servicesAvailable}' } },
    { id: 'cat', type: 'carousel', position: { x: 330, y: 350 }, data: { source: 'topRated', cards: [] } },
    { id: 'ask_pick', type: 'ask', position: { x: 330, y: 470 }, data: { text: 'Responde con el *número* del proveedor para ver sus trabajos 👷, o escribe *otro* para una nueva búsqueda.', saveAs: 'pick', capture: 'text' } },
    { id: 'act_works', type: 'action', position: { x: 330, y: 590 }, data: { action: 'showWorks', params: {} } },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'ask_service' },
    { id: 'e2', source: 'ask_service', target: 'act_match' },
    { id: 'e3', source: 'act_match', target: 'cat', sourceHandle: 'matched', label: 'Sí reconoció' },
    { id: 'e4', source: 'act_match', target: 'msg_noservice', sourceHandle: 'notMatched', label: 'No reconoció' },
    { id: 'e5', source: 'msg_noservice', target: 'ask_service' },
    { id: 'e6', source: 'cat', target: 'ask_pick' },
    { id: 'e7', source: 'ask_pick', target: 'act_works' },
    { id: 'e8', source: 'act_works', target: 'ask_pick', sourceHandle: 'shown', label: 'Mostró trabajos' },
    { id: 'e9', source: 'act_works', target: 'cat', sourceHandle: 'back', label: 'Volver al catálogo' },
    { id: 'e10', source: 'act_works', target: 'ask_service', sourceHandle: 'menu', label: 'Otro servicio' },
    { id: 'e11', source: 'act_works', target: 'ask_pick', sourceHandle: 'none', label: 'No entendió' },
  ],
})

// Asistente completo: saludo por hora + menú (buscar / ser proveedor / ver todos) + carrusel + ver trabajos + reinicio
const asistente = () => ({
  nodes: [
    { id: 'start', type: 'start', position: { x: 360, y: -120 }, data: {} },
    { id: 'ask_inicio', type: 'ask', position: { x: 330, y: -10 }, data: {
      text: '{greeting} 👋 Soy el asistente de *WhatServices*.\n¿Qué deseas hacer?\n\n1️⃣ Buscar un servicio\n2️⃣ Quiero ser *proveedor*\n3️⃣ Ver *todos* los profesionales\n\nTambién puedes escribir directamente el servicio que buscas.',
      saveAs: 'mensaje', capture: 'text' } },
    { id: 'cond_menu', type: 'condition', position: { x: 350, y: 110 }, data: { cases: [
      { label: 'Ser proveedor', logic: 'OR', rules: [
        { field: 'message', op: 'contains', value: '2' },
        { field: 'message', op: 'contains', value: 'proveedor' },
        { field: 'message', op: 'contains', value: 'registr' },
      ] },
      { label: 'Ver todos', logic: 'OR', rules: [
        { field: 'message', op: 'contains', value: '3' },
        { field: 'message', op: 'contains', value: 'todos' },
        { field: 'message', op: 'contains', value: 'lista' },
      ] },
      { label: 'Buscar servicio', logic: 'OR', rules: [
        { field: 'message', op: 'contains', value: '1' },
        { field: 'message', op: 'contains', value: 'buscar' },
        { field: 'message', op: 'contains', value: 'servicio' },
      ] },
    ] } },
    { id: 'msg_register', type: 'message', position: { x: 30, y: 60 }, data: {
      text: '¡Genial! 🧰 Regístrate como profesional y empieza a recibir clientes aquí:\n👉 {webRegister}' } },
    { id: 'msg_allproviders', type: 'message', position: { x: 30, y: 180 }, data: {
      text: 'Aquí puedes ver a *todos* los profesionales por categoría 👇\n👉 {webProviders}' } },
    { id: 'node_intent', type: 'intent', position: { x: 350, y: 250 }, data: { intents: ['saludo', 'ayuda', 'despedida', 'hablar-humano'] } },
    { id: 'msg_saludo', type: 'message', position: { x: 660, y: 200 }, data: { text: '{greeting}, {firstName}! 😊 Con gusto te ayudo.' } },
    { id: 'msg_ayuda', type: 'message', position: { x: 660, y: 300 }, data: { text: 'Te ayudo a encontrar profesionales cerca de ti. 🛠️\nDime el servicio que necesitas (ej. *plomero*, *electricista*).' } },
    { id: 'msg_humano', type: 'message', position: { x: 660, y: 400 }, data: { text: '¡Claro! Te paso con un asesor humano. 🙋 En un momento te contactan.' } },
    { id: 'msg_despedida', type: 'message', position: { x: 760, y: 60 }, data: { text: '¡Gracias por usar *WhatServices*! 👋 Escríbeme cuando quieras.' } },
    { id: 'ask_service', type: 'ask', position: { x: 340, y: 380 }, data: {
      text: '¿Qué servicio necesitas? 🔧\n\n{servicesAvailable}', saveAs: 'serviceText', capture: 'text' } },
    { id: 'act_match', type: 'action', position: { x: 350, y: 490 }, data: { action: 'matchService', params: {} } },
    { id: 'msg_noservice', type: 'message', position: { x: 70, y: 520 }, data: { text: 'No reconocí ese servicio 🤔. Estos son los disponibles:\n\n{servicesAvailable}' } },
    { id: 'ask_mode', type: 'ask', position: { x: 350, y: 600 }, data: {
      text: 'Perfecto, *{service}* ✅\n\n¿Cómo los prefieres?\n1️⃣ Más *cercanos* a ti\n2️⃣ Mejor *calificados*', saveAs: 'searchMode', capture: 'mode' } },
    { id: 'cond_mode', type: 'condition', position: { x: 350, y: 720 }, data: {
      cases: [{ label: 'Más cercanos', logic: 'AND', rules: [{ field: 'vars.searchMode', op: 'equals', value: 'near' }] }] } },
    { id: 'ask_zip', type: 'ask', position: { x: 110, y: 820 }, data: {
      text: 'Dame tu *código postal* (5 dígitos) para buscar cerca de ti. 📍', saveAs: 'zip', capture: 'zip' } },
    { id: 'act_search', type: 'action', position: { x: 390, y: 840 }, data: { action: 'search', params: {} } },
    { id: 'msg_noresults', type: 'message', position: { x: 720, y: 820 }, data: {
      text: 'Por ahora no tengo profesionales de *{service}* disponibles 😕.\nPuedes ver a todos aquí: {webProviders}' } },
    { id: 'act_carousel', type: 'carousel', position: { x: 390, y: 950 }, data: { source: 'results', cards: [] } },
    { id: 'msg_pick', type: 'message', position: { x: 390, y: 1060 }, data: {
      text: '👆 Estos son los *{count}* profesionales para *{service}*.\n\nResponde con el *número* (1-{count}) para ver sus *trabajos* y contacto.\n🌐 O velos todos en la web: {webService}\n\nEscribe *otro* para otra búsqueda o *salir* para terminar.' } },
    { id: 'ask_pick', type: 'ask', position: { x: 390, y: 1170 }, data: { text: '', saveAs: 'pick', capture: 'text' } },
    { id: 'node_exit', type: 'intent', position: { x: 390, y: 1280 }, data: { intents: ['despedida'] } },
    { id: 'act_works', type: 'action', position: { x: 390, y: 1390 }, data: { action: 'showWorks', params: {} } },
    { id: 'end', type: 'end', position: { x: 760, y: 480 }, data: {} },
  ],
  edges: [
    { id: 'a1', source: 'start', target: 'ask_inicio' },
    { id: 'a2', source: 'ask_inicio', target: 'cond_menu' },
    { id: 'm0', source: 'cond_menu', target: 'msg_register', sourceHandle: 'case-0', label: 'Ser proveedor' },
    { id: 'm1', source: 'cond_menu', target: 'msg_allproviders', sourceHandle: 'case-1', label: 'Ver todos' },
    { id: 'm2', source: 'cond_menu', target: 'ask_service', sourceHandle: 'case-2', label: 'Buscar' },
    { id: 'm3', source: 'cond_menu', target: 'node_intent', sourceHandle: 'else', label: 'Otro' },
    { id: 'm4', source: 'msg_register', target: 'end' },
    { id: 'm5', source: 'msg_allproviders', target: 'end' },
    { id: 'a3', source: 'node_intent', target: 'msg_saludo', sourceHandle: 'intent:saludo', label: 'Saludo' },
    { id: 'a4', source: 'node_intent', target: 'msg_ayuda', sourceHandle: 'intent:ayuda', label: 'Ayuda' },
    { id: 'a5', source: 'node_intent', target: 'msg_despedida', sourceHandle: 'intent:despedida', label: 'Despedida' },
    { id: 'a6', source: 'node_intent', target: 'msg_humano', sourceHandle: 'intent:hablar-humano', label: 'Humano' },
    { id: 'a7', source: 'node_intent', target: 'act_match', sourceHandle: 'else', label: 'Servicio' },
    { id: 'a8', source: 'msg_saludo', target: 'ask_service' },
    { id: 'a9', source: 'msg_ayuda', target: 'ask_service' },
    { id: 'a10', source: 'msg_humano', target: 'end' },
    { id: 'a12', source: 'ask_service', target: 'act_match' },
    { id: 'a13', source: 'act_match', target: 'ask_mode', sourceHandle: 'matched', label: 'Sí reconoció' },
    { id: 'a14', source: 'act_match', target: 'msg_noservice', sourceHandle: 'notMatched', label: 'No reconoció' },
    { id: 'a15', source: 'msg_noservice', target: 'ask_service' },
    { id: 'a16', source: 'ask_mode', target: 'cond_mode' },
    { id: 'a17', source: 'cond_mode', target: 'ask_zip', sourceHandle: 'case-0', label: 'Cercanos' },
    { id: 'a18', source: 'cond_mode', target: 'act_search', sourceHandle: 'else', label: 'Mejor calificados' },
    { id: 'a19', source: 'ask_zip', target: 'act_search' },
    { id: 'a20', source: 'act_search', target: 'act_carousel', sourceHandle: 'found', label: 'Hay resultados' },
    { id: 'a21', source: 'act_search', target: 'msg_noresults', sourceHandle: 'empty', label: 'Sin resultados' },
    { id: 'a22', source: 'msg_noresults', target: 'end' },
    { id: 'a23', source: 'act_carousel', target: 'msg_pick' },
    { id: 'a24', source: 'msg_pick', target: 'ask_pick' },
    { id: 'a25', source: 'ask_pick', target: 'node_exit' },
    { id: 'a26', source: 'node_exit', target: 'msg_despedida', sourceHandle: 'intent:despedida', label: 'Salir' },
    { id: 'a27', source: 'node_exit', target: 'act_works', sourceHandle: 'else', label: 'Elegir' },
    { id: 'a28', source: 'act_works', target: 'ask_pick', sourceHandle: 'shown', label: 'Mostró trabajos' },
    { id: 'a29', source: 'act_works', target: 'act_carousel', sourceHandle: 'back', label: 'Volver' },
    { id: 'a30', source: 'act_works', target: 'ask_service', sourceHandle: 'menu', label: 'Otro servicio' },
    { id: 'a31', source: 'act_works', target: 'ask_pick', sourceHandle: 'none', label: 'No entendió' },
  ],
})

export const TEMPLATES = [
  { id: 'default', name: 'Flujo completo', icon: '🤖', description: 'El bot estándar: servicio → cercanos/mejor calificados → catálogo → ver trabajos.', build: currentFlowTemplate },
  { id: 'simple', name: 'Búsqueda simple', icon: '⚡', description: 'Pide el servicio y muestra el top 5 mejor calificados.', build: simple },
  { id: 'intenciones', name: 'Con intenciones', icon: '🎯', description: 'Detecta “hablar con humano” y deriva; lo demás busca servicio.', build: intenciones },
  { id: 'soporte', name: 'Soporte / FAQ', icon: '🛟', description: 'Menú de botones + lista de preguntas frecuentes + escalar a humano.', build: soporte },
  { id: 'catalogo', name: 'Catálogo con carrusel', icon: '🖼️', description: 'Carrusel de los 5 proveedores → eliges número → ves sus trabajos → volver.', build: catalogo },
  { id: 'asistente', name: 'Asistente completo ⭐', icon: '🤝', description: 'Saluda según la hora, entiende intenciones, busca por cercanía/calificación, carrusel de fotos de perfil, ver trabajos y reinicio al despedirse.', build: asistente, ensureIntents: true },
]
