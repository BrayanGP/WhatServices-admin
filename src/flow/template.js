// Plantilla que replica el flujo actual del bot, para arrancar y editar.
export const currentFlowTemplate = () => ({
  nodes: [
    { id: 'start', type: 'start', position: { x: 320, y: 0 }, data: {} },
    { id: 'ask_service', type: 'ask', position: { x: 280, y: 110 }, data: {
      text: '¡Hola {name}! 👋 Bienvenido a *WhatServices*.\n\n¿Qué servicio necesitas?\n\n{services}',
      saveAs: 'serviceText', capture: 'text' } },
    { id: 'act_match', type: 'action', position: { x: 300, y: 230 }, data: { action: 'matchService', params: {} } },
    { id: 'msg_noservice', type: 'message', position: { x: 20, y: 230 }, data: {
      text: 'No reconocí ese servicio 🤔. Inténtalo de nuevo:\n\n{services}' } },
    { id: 'ask_mode', type: 'ask', position: { x: 300, y: 350 }, data: {
      text: 'Perfecto, *{service}* ✅\n\n¿Cómo prefieres ver las recomendaciones?\n\n1️⃣ Los *5 más cercanos*\n2️⃣ Los *5 mejor calificados*',
      saveAs: 'searchMode', capture: 'mode' } },
    { id: 'cond_mode', type: 'condition', position: { x: 300, y: 470 }, data: {
      cases: [{ label: 'Más cercanos', logic: 'AND', rules: [{ field: 'vars.searchMode', op: 'equals', value: 'near' }] }] } },
    { id: 'ask_zip', type: 'ask', position: { x: 90, y: 590 }, data: {
      text: 'Para buscar cerca de ti, dime tu *código postal* (5 dígitos).', saveAs: 'zip', capture: 'zip' } },
    { id: 'act_search', type: 'action', position: { x: 360, y: 600 }, data: { action: 'search', params: {} } },
    { id: 'act_catalog', type: 'action', position: { x: 360, y: 710 }, data: { action: 'sendCatalog', params: {} } },
    { id: 'msg_noresults', type: 'message', position: { x: 680, y: 650 }, data: {
      text: 'Por ahora no tengo profesionales de *{service}* disponibles 😕.' } },
    { id: 'ask_results', type: 'ask', position: { x: 360, y: 820 }, data: { text: '', saveAs: 'selection', capture: 'text' } },
    { id: 'act_works', type: 'action', position: { x: 360, y: 930 }, data: { action: 'showWorks', params: {} } },
    { id: 'end', type: 'end', position: { x: 700, y: 760 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'ask_service' },
    { id: 'e2', source: 'ask_service', target: 'act_match' },
    { id: 'e3', source: 'act_match', target: 'ask_mode', sourceHandle: 'matched', label: 'Sí reconoció' },
    { id: 'e4', source: 'act_match', target: 'msg_noservice', sourceHandle: 'notMatched', label: 'No reconoció' },
    { id: 'e5', source: 'msg_noservice', target: 'ask_service' },
    { id: 'e6', source: 'ask_mode', target: 'cond_mode' },
    { id: 'e7', source: 'cond_mode', target: 'ask_zip', sourceHandle: 'case-0', label: 'Más cercanos' },
    { id: 'e8', source: 'cond_mode', target: 'act_search', sourceHandle: 'else', label: 'Mejor calificados' },
    { id: 'e9', source: 'ask_zip', target: 'act_search' },
    { id: 'e10', source: 'act_search', target: 'act_catalog', sourceHandle: 'found', label: 'Hay resultados' },
    { id: 'e11', source: 'act_search', target: 'msg_noresults', sourceHandle: 'empty', label: 'Sin resultados' },
    { id: 'e12', source: 'act_catalog', target: 'ask_results', sourceHandle: 'found' },
    { id: 'e13', source: 'act_catalog', target: 'msg_noresults', sourceHandle: 'empty' },
    { id: 'e14', source: 'ask_results', target: 'act_works' },
    { id: 'e15', source: 'act_works', target: 'ask_results', sourceHandle: 'shown', label: 'Mostró trabajos' },
    { id: 'e16', source: 'act_works', target: 'ask_results', sourceHandle: 'back', label: 'Volver' },
    { id: 'e17', source: 'act_works', target: 'ask_results', sourceHandle: 'none', label: 'No entendió' },
    { id: 'e18', source: 'act_works', target: 'ask_service', sourceHandle: 'menu', label: 'Otro servicio' },
    { id: 'e19', source: 'msg_noresults', target: 'end' },
  ],
})
