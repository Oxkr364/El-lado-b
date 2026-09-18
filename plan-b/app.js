import { PLAN_B_LIMITS, createPlanBReaderSession, directorPlanB, buildPlanBOutcome } from './agents/plan-b-network.js';
import { reviewSafety } from './agents/runtime.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'el_lado_b_reader_network_v3';
const blueprint = {
  title: 'El Lado B',
  limits: PLAN_B_LIMITS,
  branches: [
    { id: 'branch-1', position: 1, title: 'La primera mirada', context: 'En el gimnasio de 1998, José descubre que mirar a Paz ya no se parece del todo a mirar a una amiga. Todavía no existe una historia entre ellos; apenas una posibilidad.', questions: [{ id: 'branch-1-a', text: '¿Qué decide hacer José cuando reconoce que está sintiendo algo distinto?' }, { id: 'branch-1-b', text: '¿Qué decide ocultar o revelar José en ese primer instante?' }] },
    { id: 'branch-2', position: 2, title: 'El naranjo', context: 'En la fiesta, Paz pregunta quién es Nadia. La pregunta parece pequeña, pero permite que los celos entren por primera vez en el lenguaje secreto de ambos.', questions: [{ id: 'branch-2-a', text: '¿Cómo responde José a la pregunta de Paz?' }, { id: 'branch-2-b', text: '¿Qué hace Paz después de escuchar la respuesta de José?' }] },
    { id: 'branch-3', position: 3, title: 'La distancia cambia', context: 'Una invitación aparentemente sencilla modifica el límite entre amistad e intimidad. Ambos comprenden que permanecer cerca también puede tener consecuencias.', questions: [{ id: 'branch-3-a', text: '¿Qué límite decide conservar o cruzar José?' }, { id: 'branch-3-b', text: '¿Qué necesita decir Paz antes de que la noche termine?' }] },
    { id: 'branch-4', position: 4, title: 'Los siete dígitos', context: 'Paz entrega a José el número de la red fija de su casa y le pide que no pierdan la comunicación. El papel puede convertirse en recuerdo, promesa o acción.', questions: [{ id: 'branch-4-a', text: '¿Qué decide hacer José con el número de teléfono?' }, { id: 'branch-4-b', text: '¿Qué espera realmente Paz cuando le entrega el número?' }] },
    { id: 'branch-5', position: 5, title: 'Lo que todavía puede decirse', context: 'Después de los reencuentros y los silencios, ambos deben decidir si la memoria seguirá siendo escondite o se convertirá en una conversación verdadera.', questions: [{ id: 'branch-5-a', text: '¿Qué verdad decide decir José antes de que sea demasiado tarde?' }, { id: 'branch-5-b', text: '¿Qué respuesta decide darle Paz para cerrar o abrir esta historia?' }] }
  ]
};

let session = null;
let selectedQuestionId = null;

function saveSession() { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); }
function restoreSession() { try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return stored?.status === 'active' && stored?.blueprint?.branches?.length === PLAN_B_LIMITS.branches ? stored : null; } catch { return null; } }

function renderBranch() {
  const branch = session.blueprint.branches[session.current];
  if (!branch) return renderClosure();
  selectedQuestionId = null;
  $('chapterLabel').textContent = `RAMA ${branch.position} · CAPA 1`;
  $('decisionTitle').textContent = branch.title;
  $('summary').textContent = branch.context;
  $('progressLabel').textContent = `Rama ${branch.position} de ${PLAN_B_LIMITS.branches}`;
  $('progressBar').style.width = `${(branch.position / PLAN_B_LIMITS.branches) * 100}%`;
  $('trajectoryCount').textContent = `${session.responses.length} ${session.responses.length === 1 ? 'respuesta' : 'respuestas'}`;
  $('choices').innerHTML = '';
  branch.questions.forEach((question, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'choice'; button.dataset.questionId = question.id;
    button.innerHTML = `<span class="code">${index + 1}</span><span>${question.text}</span>`;
    button.onclick = () => selectQuestion(question);
    $('choices').appendChild(button);
  });
  $('responseForm').classList.add('hidden'); $('readerResponse').value = ''; $('responseCount').textContent = '0';
  $('development').classList.add('hidden'); $('choice-panel').classList.remove('hidden');
}

function selectQuestion(question) {
  selectedQuestionId = question.id;
  document.querySelectorAll('.choice').forEach(button => button.classList.toggle('selected', button.dataset.questionId === question.id));
  $('selectedQuestion').textContent = question.text;
  $('responseForm').classList.remove('hidden');
  $('readerResponse').focus();
}

function submitResponse(event) {
  event.preventDefault();
  const response = $('readerResponse').value.trim();
  const safetyErrors = reviewSafety(response);
  if (safetyErrors.length) return alert(safetyErrors.join('\n'));
  try {
    const branch = session.blueprint.branches[session.current];
    session = directorPlanB(session, { branchId: branch.id, questionId: selectedQuestionId, response });
    saveSession();
    const latest = session.actions.at(-1);
    $('bridge').textContent = latest.bridge;
    $('pulseReading').textContent = latest.emotionalReading;
    $('trajectoryCount').textContent = `${session.responses.length} ${session.responses.length === 1 ? 'respuesta' : 'respuestas'}`;
    $('choice-panel').classList.add('hidden'); $('development').classList.remove('hidden');
    $('continueBtn').innerHTML = session.status === 'completed' ? 'DESCUBRIR MI DESENLACE <span>→</span>' : 'SEGUIR LEYENDO <span>→</span>';
  } catch (error) { alert(error.message); }
}

function renderClosure() {
  const outcome = buildPlanBOutcome(session);
  $('closureTitle').textContent = 'Tus cinco respuestas encontraron un camino.';
  $('closureText').textContent = outcome.epilogue;
  $('closureCount').textContent = `${outcome.responseCount} respuestas · pulso dominante: ${outcome.pulse.label}`;
  $('reader').classList.add('hidden'); $('closure').classList.remove('hidden');
}

function renderCompleteStory() {
  const outcome = buildPlanBOutcome(session);
  $('storyBody').innerHTML = '';
  outcome.sections.forEach(section => { const article = document.createElement('article'), title = document.createElement('h3'), text = document.createElement('p'); article.className = 'story-section'; title.textContent = section.title; text.textContent = section.text; article.append(title, text); $('storyBody').appendChild(article); });
  $('storyEpilogue').innerHTML = '';
  const label = document.createElement('span'), title = document.createElement('strong'), text = document.createElement('p'); label.textContent = 'EPÍLOGO'; title.textContent = 'La historia posible'; text.textContent = outcome.epilogue; $('storyEpilogue').append(label, title, text);
  $('closure').classList.add('hidden'); $('completeStory').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function start() { session = restoreSession() || createPlanBReaderSession(blueprint); $('intro').classList.add('hidden'); $('reader').classList.remove('hidden'); renderBranch(); }

$('startBtn').onclick = start;
$('responseForm').onsubmit = submitResponse;
$('readerResponse').oninput = event => { $('responseCount').textContent = event.target.value.length; };
$('continueBtn').onclick = () => { $('development').classList.add('hidden'); if (session.status === 'completed') return renderClosure(); $('choice-panel').classList.remove('hidden'); renderBranch(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
$('readStoryBtn').onclick = renderCompleteStory;
$('backClosureBtn').onclick = () => { $('completeStory').classList.add('hidden'); $('closure').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
$('restartBtn').onclick = () => { localStorage.removeItem(STORAGE_KEY); session = null; selectedQuestionId = null; $('closure').classList.add('hidden'); $('completeStory').classList.add('hidden'); $('reader').classList.add('hidden'); $('intro').classList.remove('hidden'); };
