export const PLAN_B_LIMITS = Object.freeze({ branches: 5, questionsPerBranch: 2, responses: 5 });

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const sentence = value => { const text = clean(value); return text ? `${text[0].toUpperCase()}${text.slice(1).replace(/[.!?]+$/, '')}.` : ''; };

export function buildPlanBBlueprint({ title, sections, protagonist = 'el protagonista' }) {
  const source = (sections ?? []).map(clean).filter(Boolean);
  if (!source.length) return { title: clean(title), branches: [], limits: PLAN_B_LIMITS };
  const count = Math.min(PLAN_B_LIMITS.branches, source.length);
  const indexes = Array.from({ length: count }, (_, index) => Math.min(source.length - 1, Math.round(index * (source.length - 1) / Math.max(1, count - 1))));
  const branches = indexes.map((sourceIndex, index) => ({
    id: `branch-${index + 1}`,
    position: index + 1,
    sourceIndex,
    context: source[sourceIndex],
    questions: [
      { id: `branch-${index + 1}-a`, text: `¿Qué decide hacer ${protagonist} en este momento?` },
      { id: `branch-${index + 1}-b`, text: `¿Qué decide decir, revelar u ocultar ${protagonist}?` }
    ]
  }));
  return { title: clean(title), branches, limits: PLAN_B_LIMITS };
}

export function createPlanBReaderSession(blueprint) {
  const branches = (blueprint?.branches ?? []).slice(0, PLAN_B_LIMITS.branches).map(branch => ({ ...branch, questions: (branch.questions ?? []).slice(0, PLAN_B_LIMITS.questionsPerBranch) }));
  if (branches.some(branch => branch.questions.length !== PLAN_B_LIMITS.questionsPerBranch)) throw new Error('Cada rama necesita exactamente dos preguntas alternativas.');
  return { id: globalThis.crypto?.randomUUID?.() ?? `plan-b-${Date.now()}`, blueprint: { ...blueprint, branches }, current: 0, responses: [], actions: [], continuity: { facts: [], lastAction: '', thread: [] }, status: 'active' };
}

export function actionAgent(response) {
  const raw = clean(response);
  if (raw.length < 8) throw new Error('Escribe una respuesta un poco más completa para que la historia pueda recordarla.');
  if (raw.length > 500) throw new Error('La respuesta no puede superar 500 caracteres.');
  return { intent: raw, action: sentence(raw), tokens: raw.toLocaleLowerCase('es').split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 3).slice(0, 8) };
}

export function continuityAgent(session, branch, question, action) {
  const previous = session.continuity.lastAction;
  const bridge = previous
    ? `La historia conserva lo anterior: ${previous} Ahora, ${action.action[0].toLocaleLowerCase('es')}${action.action.slice(1)}`
    : `Desde este momento, ${action.action[0].toLocaleLowerCase('es')}${action.action.slice(1)}`;
  return {
    bridge,
    continuity: {
      facts: [...session.continuity.facts, ...action.tokens].slice(-24),
      lastAction: action.action,
      thread: [...session.continuity.thread, { branchId: branch.id, questionId: question.id, action: action.action }]
    }
  };
}

export function directorPlanB(session, { branchId, questionId, response }) {
  if (session.status !== 'active') throw new Error('Este Plan B ya fue cerrado.');
  if (session.responses.length >= PLAN_B_LIMITS.responses) throw new Error('Se alcanzó el límite de cinco respuestas.');
  const branch = session.blueprint.branches[session.current];
  if (!branch || branch.id !== branchId) throw new Error('La respuesta no pertenece a la rama activa.');
  const question = branch.questions.find(item => item.id === questionId);
  if (!question) throw new Error('Elige una de las dos preguntas de esta rama.');
  if (session.responses.some(item => item.branchId === branchId)) throw new Error('Esta rama ya tiene una respuesta.');
  const action = actionAgent(response);
  const continuity = continuityAgent(session, branch, question, action);
  const next = session.current + 1;
  const completed = next >= session.blueprint.branches.length || session.responses.length + 1 >= PLAN_B_LIMITS.responses;
  return {
    ...session,
    current: next,
    responses: [...session.responses, { branchId, questionId, question: question.text, response: clean(response) }],
    actions: [...session.actions, { branchId, action: action.action, bridge: continuity.bridge }],
    continuity: continuity.continuity,
    status: completed ? 'completed' : 'active'
  };
}

export function buildPlanBOutcome(session) {
  if (!session.responses.length) throw new Error('El Plan B necesita al menos una respuesta.');
  return {
    title: session.blueprint.title,
    responseCount: session.responses.length,
    sections: session.actions.map((item, index) => ({ position: index + 1, title: `La decisión ${index + 1}`, text: item.bridge })),
    epilogue: `Estas ${session.responses.length} decisiones no sustituyen el canon. Construyen la trayectoria que el lector eligió recordar.`
  };
}
