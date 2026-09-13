/* EL LADO B — Motor narrativo Plan B */

export const INITIAL_STATE = Object.freeze({
  jose: { interesRomantico: 0, confianza: 0, temorAPerderPaz: 0, tendenciaAlSilencio: 0, iniciativa: 0, comodidadConPaula: 0, curiosidadPorPaula: 0, conflictoInterno: 0 },
  paz: { confianzaEnJose: 0, percepcionDelInteres: 0, disponibilidadEmocional: 0, iniciativa: 0 },
  paula: { interesPorJose: 0, confianza: 0, lecturaEmocional: 0, cercania: 0 },
  relacion: { cercania: 0, tension: 0, comunicacion: 0, clandestinidad: 0, distancia: 0, confianza: 0 },
  relacionPaula: { cercania: 0, confianza: 0, tension: 0, posibilidad: 0 },
  memoria: { numeroSieteDigitos: false, llamadas: 0, codigoSecreto: 0, heridas: 0, consejoPaula: 0 },
  meta: { steps: 0 }
});

export function cloneState(state = INITIAL_STATE) { return JSON.parse(JSON.stringify(state)); }

function add(target, delta = {}) {
  for (const [key, value] of Object.entries(delta)) {
    if (typeof value === 'number') target[key] = (target[key] ?? 0) + value;
    else if (typeof value === 'boolean') target[key] = value;
    else if (value && typeof value === 'object') target[key] = { ...(target[key] ?? {}), ...value };
    else if (value !== undefined) target[key] = value;
  }
}

export function applyStateDelta(state, delta = {}) {
  const next = cloneState(state);
  add(next.jose, delta.jose); add(next.paz, delta.paz); add(next.paula, delta.paula);
  add(next.relacion, delta.relacion); add(next.relacionPaula, delta.relacionPaula);
  add(next.memoria, delta.memoria); add(next.meta, delta.meta);
  next.meta.steps = (state.meta?.steps ?? 0) + 1;
  return next;
}

export function chooseDecision(state, decision, choiceId) {
  if (!decision || !decision.choices) throw new Error('Decisión inválida.');
  const choice = decision.choices.find(item => item.id === choiceId);
  if (!choice) throw new Error(`Opción no encontrada: ${choiceId}`);
  const nextState = applyStateDelta(state, choice.state_delta);
  return { choice, state: nextState, bridgeFragment: choice.bridge_fragment, affectedPassages: choice.affected_passages ?? [], nextDecision: choice.next_decision ?? null };
}

export function getChapterDecision(decisions, chapterId) { return decisions.find(decision => decision.chapter === chapterId) ?? null; }

export function createSession() {
  return { session_id: globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`, decisions: [], current_chapter: 'capitulo-01', current_passage: null, state: cloneState(INITIAL_STATE), fragments: [] };
}

export function recordDecision(session, decisionId, choiceId, result) {
  return { ...session, decisions: [...session.decisions, { decision_id: decisionId, choice_id: choiceId }], state: cloneState(result.state), fragments: [...session.fragments, { decision_id: decisionId, choice_id: choiceId, literary_text: result.bridgeFragment }], current_chapter: result.nextDecision?.chapter ?? session.current_chapter, current_passage: result.nextDecision?.passage ?? null };
}

export function summarizeTrajectory(session, chapters) {
  return session.decisions.map(item => chapters.find(ch => ch.id === item.decision_id || ch.decision_id === item.decision_id)?.title ?? item.decision_id);
}

export function buildClosure(session, closureRules = []) {
  const matched = closureRules.filter(rule => typeof rule.when === 'function' ? rule.when(session.state) : false);
  return matched[0] ?? { id: 'closure-default', label: 'La historia que construiste', literary_text: 'Esta es la historia que fue tomando forma a partir de tus decisiones.' };
}
