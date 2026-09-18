export const PLAN_B_LIMITS = Object.freeze({ branches: 5, questionsPerBranch: 2, responses: 5 });

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const sentence = value => { const text = clean(value); return text ? `${text[0].toUpperCase()}${text.slice(1).replace(/[.!?]+$/, '')}.` : ''; };
const PULSE_KEYS = ['desire', 'fear', 'bond', 'wound', 'hope'];
const PULSE_LABELS = Object.freeze({ desire: 'deseo', fear: 'miedo', bond: 'vínculo', wound: 'herida', hope: 'esperanza' });
const PULSE_WORDS = Object.freeze({
  desire: ['quiere', 'desea', 'busca', 'necesita', 'elige', 'acerca', 'confiesa'],
  fear: ['teme', 'miedo', 'evita', 'huye', 'calla', 'oculta', 'protege'],
  bond: ['habla', 'cuenta', 'confía', 'acompaña', 'abraza', 'juntos', 'escucha', 'ayuda'],
  wound: ['pierde', 'duele', 'abandona', 'rechaza', 'distancia', 'traiciona', 'silencio'],
  hope: ['intenta', 'espera', 'vuelve', 'perdona', 'oportunidad', 'futuro', 'promete']
});
const clampPulse = value => Math.max(0, Math.min(10, value));
const dominantPulse = pulse => PULSE_KEYS.slice().sort((a, b) => (pulse[b] ?? 0) - (pulse[a] ?? 0))[0];

function readPulse(text) {
  const lower = clean(text).toLocaleLowerCase('es');
  const delta = Object.fromEntries(PULSE_KEYS.map(key => [key, PULSE_WORDS[key].reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0)]));
  if (!PULSE_KEYS.some(key => delta[key])) delta.desire = 1;
  return delta;
}

function linkNextQuestions(branch, action, pulse) {
  const dominant = dominantPulse(pulse), secondary = PULSE_KEYS.filter(key => key !== dominant).sort((a, b) => pulse[b] - pulse[a])[0];
  const remembered = action.action.replace(/[.!?]+$/, '').slice(0, 120);
  return {
    ...branch,
    questions: [
      { id: branch.questions[0]?.id ?? `${branch.id}-a`, text: `Después de que ${remembered[0].toLocaleLowerCase('es')}${remembered.slice(1)}, ¿qué decisión protege su ${PULSE_LABELS[dominant]}?` },
      { id: branch.questions[1]?.id ?? `${branch.id}-b`, text: `¿Qué tendría que hacer ahora para que su ${PULSE_LABELS[secondary]} no contradiga lo que acaba de decidir?` }
    ],
    pulseSource: { dominant, secondary }
  };
}

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
  return { id: globalThis.crypto?.randomUUID?.() ?? `plan-b-${Date.now()}`, blueprint: { ...blueprint, branches }, current: 0, responses: [], actions: [], continuity: { facts: [], lastAction: '', thread: [], pulse: { desire: 0, fear: 0, bond: 0, wound: 0, hope: 0 }, pulseHistory: [] }, status: 'active' };
}

export function actionAgent(response) {
  const raw = clean(response);
  if (raw.length < 8) throw new Error('Escribe una respuesta un poco más completa para que la historia pueda recordarla.');
  if (raw.length > 500) throw new Error('La respuesta no puede superar 500 caracteres.');
  return { intent: raw, action: sentence(raw), tokens: raw.toLocaleLowerCase('es').split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 3).slice(0, 8), pulseDelta: readPulse(raw) };
}

export function continuityAgent(session, branch, question, action) {
  const previous = session.continuity.lastAction;
  const previousPulse = session.continuity.pulse ?? { desire: 0, fear: 0, bond: 0, wound: 0, hope: 0 };
  const pulse = Object.fromEntries(PULSE_KEYS.map(key => [key, clampPulse((previousPulse[key] ?? 0) + (action.pulseDelta[key] ?? 0))]));
  const dominant = dominantPulse(pulse);
  const bridge = previous
    ? `La historia conserva lo anterior: ${previous} Ahora, ${action.action[0].toLocaleLowerCase('es')}${action.action.slice(1)}`
    : `Desde este momento, ${action.action[0].toLocaleLowerCase('es')}${action.action.slice(1)}`;
  return {
    bridge,
    pulse,
    emotionalReading: `El pulso se inclina hacia ${PULSE_LABELS[dominant]}.`,
    continuity: {
      facts: [...session.continuity.facts, ...action.tokens].slice(-24),
      lastAction: action.action,
      thread: [...session.continuity.thread, { branchId: branch.id, questionId: question.id, action: action.action }],
      pulse,
      pulseHistory: [...(session.continuity.pulseHistory ?? []), { branchId: branch.id, delta: action.pulseDelta, pulse }]
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
  const branches = session.blueprint.branches.slice();
  if (!completed && branches[next]) branches[next] = linkNextQuestions(branches[next], action, continuity.pulse);
  return {
    ...session,
    blueprint: { ...session.blueprint, branches },
    current: next,
    responses: [...session.responses, { branchId, questionId, question: question.text, response: clean(response) }],
    actions: [...session.actions, { branchId, action: action.action, bridge: continuity.bridge, emotionalReading: continuity.emotionalReading, pulse: continuity.pulse }],
    continuity: continuity.continuity,
    status: completed ? 'completed' : 'active'
  };
}

export function buildPlanBOutcome(session) {
  if (!session.responses.length) throw new Error('El Plan B necesita al menos una respuesta.');
  const pulse = session.continuity.pulse ?? { desire: 0, fear: 0, bond: 0, wound: 0, hope: 0 };
  const dominant = dominantPulse(pulse);
  return {
    title: session.blueprint.title,
    responseCount: session.responses.length,
    sections: session.actions.map((item, index) => ({ position: index + 1, title: `La decisión ${index + 1}`, text: `${item.bridge} ${item.emotionalReading}` })),
    pulse: { ...pulse, dominant, label: PULSE_LABELS[dominant] },
    epilogue: `Estas ${session.responses.length} decisiones no sustituyen el canon. Construyen una trayectoria cuyo pulso final es ${PULSE_LABELS[dominant]}.`
  };
}
