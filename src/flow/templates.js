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

export const TEMPLATES = [
  { id: 'default', name: 'Flujo completo', icon: '🤖', description: 'El bot estándar: servicio → cercanos/mejor calificados → catálogo → ver trabajos.', build: currentFlowTemplate },
  { id: 'simple', name: 'Búsqueda simple', icon: '⚡', description: 'Pide el servicio y muestra el top 5 mejor calificados.', build: simple },
  { id: 'intenciones', name: 'Con intenciones', icon: '🎯', description: 'Detecta “hablar con humano” y deriva; lo demás busca servicio.', build: intenciones },
  { id: 'soporte', name: 'Soporte / FAQ', icon: '🛟', description: 'Menú de botones + lista de preguntas frecuentes + escalar a humano.', build: soporte },
]
