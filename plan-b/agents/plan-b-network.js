/* Producto: 4 decisiones x 2 alternativas. Prototipo: catálogo 10 x 3. */
export const PLAN_B_LIMITS = Object.freeze({ branches: 4, questionsPerBranch: 1, choicesPerQuestion: 2, responses: 4 });
export const PLAN_B_PROFILES = Object.freeze({ initial: PLAN_B_LIMITS, production: PLAN_B_LIMITS, prototype: Object.freeze({ branches: 10, questionsPerBranch: 1, choicesPerQuestion: 3, responses: 10 }) });
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const sentence = value => { const text = clean(value); return text ? `${text[0].toUpperCase()}${text.slice(1).replace(/[.!?]+$/, '')}.` : ''; };
const choiceTemplates = Object.freeze([
  { id: 'a', label: 'Conservar el límite', action: 'decide proteger lo que ya existe y guardar silencio por ahora', bridge: 'La decisión conserva el vínculo conocido, pero deja una posibilidad suspendida.' },
  { id: 'b', label: 'Decir lo necesario', action: 'decide hablar con honestidad antes de que el momento desaparezca', bridge: 'La decisión abre una conversación que modifica la forma en que ambos se miran.' },
  { id: 'c', label: 'Dar un paso', action: 'decide arriesgarse y actuar aunque todavía no tenga garantías', bridge: 'La decisión mueve la historia: algo cambia porque alguien acepta el riesgo.' }
]);
function makeChoices(branchId, protagonist, count = PLAN_B_LIMITS.choicesPerQuestion) { return choiceTemplates.slice(0, count).map(template => ({ id: `${branchId}-${template.id}`, text: `${template.label}: ${protagonist} ${template.action}.`, action: template.action, bridge: template.bridge })); }
export function buildPlanBBlueprint({ title, sections, protagonist = 'el protagonista' }) {
  const source = (sections ?? []).map(clean).filter(Boolean); const count = Math.min(PLAN_B_LIMITS.branches, source.length);
  const indexes = Array.from({ length: count }, (_, index) => Math.min(source.length - 1, Math.round(index * (source.length - 1) / Math.max(1, count - 1))));
  const branches = indexes.map((sourceIndex, index) => { const id = `branch-${index + 1}`; return { id, position: index + 1, sourceIndex, context: source[sourceIndex], question: { id: `${id}-q`, text: `En este momento, ¿qué decide hacer ${protagonist}?`, choices: makeChoices(id, protagonist) } }; });
  return { title: clean(title), branches, limits: PLAN_B_LIMITS, interaction: 'one-question-two-choices' };
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
  const response = { branchId, questionId, choiceId, choice: choice.text }; return { ...session, current: next, responses: [...session.responses, response], actions: [...session.actions, { branchId, choiceId, action, bridge }], continuity: { ...session.continuity, lastAction: action, thread: [...session.continuity.thread, response] }, status: completed ? 'completed' : 'active' };
}
export function buildPlanBOutcome(session) {
  if (!session.responses.length) throw new Error('El Plan B necesita al menos una decisión.');
  return { title: session.blueprint.title, responseCount: session.responses.length, sections: session.actions.map((item, index) => ({ position: index + 1, title: `Decisión ${index + 1}`, text: `${item.bridge} ${item.action}` })), epilogue: `Estas ${session.responses.length} decisiones construyeron una trayectoria alternativa sin modificar el canon.` };
}
