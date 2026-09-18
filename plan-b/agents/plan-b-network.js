/* Producto: 4 decisiones x 2 alternativas. Prototipo: catálogo 10 x 3. */
export const PLAN_B_LIMITS = Object.freeze({ branches: 4, questionsPerBranch: 1, choicesPerQuestion: 2, responses: 4 });
export const PLAN_B_PROFILES = Object.freeze({ initial: PLAN_B_LIMITS, production: PLAN_B_LIMITS, prototype: Object.freeze({ branches: 10, questionsPerBranch: 1, choicesPerQuestion: 3, responses: 10 }) });
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const sentence = value => { const text = clean(value); return text ? `${text[0].toUpperCase()}${text.slice(1).replace(/[.!?]+$/, '')}.` : ''; };
const decisionSets = Object.freeze([
  { question: name => `¿${name} mantiene lo acordado o dice lo que realmente quiere?`, choices: [{ text: 'Mantener lo acordado', action: 'mantiene lo acordado aunque todavía tenga dudas', bridge: 'La decisión conserva el rumbo conocido, pero deja una posibilidad suspendida.' }, { text: 'Decir lo que realmente quiere', action: 'dice con honestidad lo que realmente quiere', bridge: 'La verdad modifica el vínculo y obliga a mirar el momento de otra manera.' }] },
  { question: name => `¿${name} protege el vínculo o se arriesga a cambiarlo?`, choices: [{ text: 'Proteger el vínculo', action: 'protege el vínculo y evita forzar una respuesta', bridge: 'El vínculo permanece, aunque la tensión todavía no desaparece.' }, { text: 'Arriesgarse a cambiarlo', action: 'se arriesga a cambiar el vínculo con una acción concreta', bridge: 'La acción abre un camino que antes no existía.' }] },
  { question: name => `¿${name} espera o actúa antes de que sea demasiado tarde?`, choices: [{ text: 'Esperar', action: 'espera hasta comprender mejor lo que está ocurriendo', bridge: 'La pausa permite observar, pero el tiempo también empieza a decidir.' }, { text: 'Actuar ahora', action: 'actúa antes de que el momento desaparezca', bridge: 'La iniciativa altera el equilibrio y empuja la historia hacia adelante.' }] },
  { question: name => `¿${name} acepta lo ocurrido o intenta transformar el desenlace?`, choices: [{ text: 'Aceptar lo ocurrido', action: 'acepta lo ocurrido y deja de luchar contra el pasado', bridge: 'La aceptación cierra una herida y cambia el sentido de la memoria.' }, { text: 'Transformar el desenlace', action: 'intenta transformar el desenlace con una última decisión', bridge: 'La decisión abre una posibilidad nueva sin borrar lo vivido.' }] }
]);
function makeChoices(branchId, protagonist, count = PLAN_B_LIMITS.choicesPerQuestion, position = 0) { const set=decisionSets[position%decisionSets.length]; return set.choices.slice(0,count).map((choice,index)=>({id:`${branchId}-${String.fromCharCode(97+index)}`,text:choice.text,action:`${protagonist} ${choice.action}`,bridge:choice.bridge})); }
export function buildPlanBBlueprint({ title, sections, protagonist = 'el protagonista' }) {
  const source = (sections ?? []).map(clean).filter(Boolean); const count = Math.min(PLAN_B_LIMITS.branches, source.length);
  const indexes = Array.from({ length: count }, (_, index) => Math.min(source.length - 1, Math.round(index * (source.length - 1) / Math.max(1, count - 1))));
  const branches = indexes.map((sourceIndex, index) => { const id = `branch-${index + 1}`,set=decisionSets[index%decisionSets.length]; return { id, position: index + 1, sourceIndex, context: source[sourceIndex], question: { id: `${id}-q`, text: set.question(protagonist), choices: makeChoices(id, protagonist, PLAN_B_LIMITS.choicesPerQuestion, index) } }; });
  return { title: clean(title), sourceSections: source, branches, limits: PLAN_B_LIMITS, interaction: 'one-question-two-choices' };
}
function normalizeBranch(branch, index, choiceCount) {
  const id = branch.id ?? `branch-${index + 1}`; const available = branch.question?.choices?.length ? branch.question.choices.slice(0, choiceCount) : makeChoices(id, 'El personaje', choiceCount); while (available.length < choiceCount) available.push(makeChoices(id, 'El personaje', choiceCount)[available.length]);
  const old = branch.questions?.[0]; return { ...branch, id, question: { ...(branch.question ?? {}), id: branch.question?.id ?? `${id}-q`, text: branch.question?.text ?? old?.text ?? '¿Qué decide hacer el personaje en este momento?', choices: available } };
}
export function createPlanBReaderSession(blueprint) {
  const limits = { ...PLAN_B_LIMITS, ...(blueprint?.limits ?? {}), questionsPerBranch: 1 }; const branches = (blueprint?.branches ?? []).slice(0, limits.branches).map((branch,index)=>normalizeBranch(branch,index,limits.choicesPerQuestion));
  if (branches.some(branch => branch.question.choices.length !== limits.choicesPerQuestion)) throw new Error(`Cada rama necesita una pregunta con ${limits.choicesPerQuestion} alternativas.`);
  return { id: globalThis.crypto?.randomUUID?.() ?? `plan-b-${Date.now()}`, blueprint: { ...blueprint, limits, branches }, current: 0, responses: [], actions: [], continuity: { facts: [], lastAction: '', thread: [] }, status: 'active' };
}
export function directorPlanB(session, { branchId, questionId, choiceId }) {
  const limits = session.blueprint.limits ?? PLAN_B_LIMITS; if (session.status !== 'active') throw new Error('Este Plan B ya fue cerrado.'); if (session.responses.length >= limits.responses) throw new Error(`Se alcanzó el límite de ${limits.responses} decisiones.`);
  const branch = session.blueprint.branches[session.current]; if (!branch || branch.id !== branchId) throw new Error('La decisión no pertenece a la rama activa.'); if (branch.question.id !== questionId) throw new Error('La pregunta no pertenece a la rama activa.');
  const choice = branch.question.choices.find(item => item.id === choiceId); if (!choice) throw new Error(`Elige una de las ${limits.choicesPerQuestion} alternativas.`);
  const action = sentence(choice.action); const previous = session.continuity.lastAction; const bridge = previous ? `La historia conserva la decisión anterior: ${previous} ${choice.bridge}` : choice.bridge; const next = session.current + 1; const completed = next >= session.blueprint.branches.length || session.responses.length + 1 >= limits.responses;
  const response = { branchId, questionId, choiceId, choice: choice.text }; return { ...session, current: next, responses: [...session.responses, response], actions: [...session.actions, { branchId, choiceId, context: branch.context, action, bridge }], continuity: { ...session.continuity, lastAction: action, thread: [...session.continuity.thread, response] }, status: completed ? 'completed' : 'active' };
}
export function buildPlanBOutcome(session) {
  if (!session.responses.length) throw new Error('El Plan B necesita al menos una decisión.');
  return { title: session.blueprint.title, responseCount: session.responses.length, sections: session.actions.map((item, index) => ({ position: index + 1, title: `Parte ${index + 1}`, text: `${item.context ? `${item.context}\n\n` : ''}${item.bridge} ${item.action}` })), epilogue: `Estas ${session.responses.length} decisiones construyeron una historia alternativa sin modificar el canon.` };
}
