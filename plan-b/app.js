import { PLAN_B_PROFILES, createPlanBReaderSession, directorPlanB, buildPlanBOutcome } from './agents/plan-b-network.js';
import { reviewSafety } from './agents/runtime.js';

const $ = id => document.getElementById(id);
const PROTOTYPE_LIMITS = PLAN_B_PROFILES.prototype;
const STORAGE_KEY = 'el_lado_b_reader_network_prototype_v1';
const makeBranch = (position, title, context, questions) => ({ id: `branch-${position}`, position, title, context, questions: questions.map((text, index) => ({ id: `branch-${position}-${String.fromCharCode(97 + index)}`, text })) });
const blueprint = {
  title: 'El Lado B',
  limits: PROTOTYPE_LIMITS,
  branches: [
    makeBranch(1, 'La primera mirada', 'En el gimnasio de 1998, José descubre que mirar a Paz ya no se parece del todo a mirar a una amiga. Todavía no existe una historia entre ellos; apenas una posibilidad.', ['¿Qué decide hacer José cuando reconoce que está sintiendo algo distinto?', '¿Qué decide ocultar o revelar José en ese primer instante?', '¿Qué riesgo está dispuesto a aceptar para acercarse a Paz?']),
    makeBranch(2, 'El naranjo', 'En la fiesta, Paz pregunta quién es Nadia. La pregunta parece pequeña, pero permite que los celos entren por primera vez en el lenguaje secreto de ambos.', ['¿Cómo responde José a la pregunta de Paz?', '¿Qué hace Paz después de escuchar la respuesta de José?', '¿Qué cambia entre ambos después de esa conversación?']),
    makeBranch(3, 'La moneda y el sillón', 'Una invitación aparentemente sencilla modifica el límite entre amistad e intimidad. Ambos comprenden que permanecer cerca también puede tener consecuencias.', ['¿Qué límite decide conservar o cruzar José?', '¿Qué necesita decir Paz antes de que la noche termine?', '¿Qué consecuencia emocional acepta cada uno después de esa cercanía?']),
    makeBranch(4, 'La grieta de septiembre', 'Paz cuenta que está conociendo a otra persona. José descubre el costo de haber protegido durante años la máscara de amigo.', ['¿José rompe el silencio o protege la amistad?', '¿Qué necesita escuchar Paz para comprenderlo?', '¿Qué distancia decide tomar José para no desaparecer de sí mismo?']),
    makeBranch(5, 'Los siete dígitos', 'Paz entrega a José el número de la red fija de su casa y le pide que no pierdan la comunicación. El papel puede convertirse en recuerdo, promesa o acción.', ['¿Qué decide hacer José con el número de teléfono?', '¿Qué espera realmente Paz cuando le entrega el número?', '¿Qué tendría que vencer José antes de realizar la llamada?']),
    makeBranch(6, 'La geometría del desvelo', 'En el reencuentro del año 2000, la distancia está llena de recuerdos que los demás no pueden leer. El idioma secreto todavía funciona.', ['¿José continúa hablando mediante señales o decide ser claro?', '¿Qué interpreta Paz en el silencio de José?', '¿Qué lugar ocupa Paula en esta nueva geometría emocional?']),
    makeBranch(7, 'La llamada de 2001', 'José encuentra el papel, llama a la casa y ambos vuelven a encontrarse. La rutina parece regresar, pero ya no son los mismos.', ['¿Qué busca realmente José al volver a llamar?', '¿Qué necesita comprobar Paz antes de confiar nuevamente?', '¿Qué parte del pasado deciden dejar atrás?']),
    makeBranch(8, 'La pregunta difícil', 'Una conversación sobre responsabilidad obliga a ambos a imaginar un futuro que ninguno había pronunciado de manera directa.', ['¿Desde qué lugar emocional responde José?', '¿Qué verdad necesita Paz detrás de su respuesta?', '¿Qué compromiso puede asumir José sin prometer lo imposible?']),
    makeBranch(9, 'Cuando quiero que estés', 'Paz expresa la ausencia que más le duele: cuando necesita que José esté, él no está. Ya no basta con explicar las intenciones.', ['¿José se defiende o reconoce el daño?', '¿Qué reparación estaría dispuesta a aceptar Paz?', '¿Qué acción concreta puede demostrar que esta vez comprendió?']),
    makeBranch(10, 'Lo que todavía puede decirse', 'Después de los reencuentros y los silencios, ambos deben decidir si la memoria seguirá siendo escondite o se convertirá en una conversación verdadera.', ['¿Qué verdad decide decir José antes de que sea demasiado tarde?', '¿Qué respuesta decide darle Paz para cerrar o abrir esta historia?', '¿Qué deben conservar aunque el desenlace los lleve por caminos distintos?'])
  ]
};

let session = null;
let selectedQuestionId = null;

function saveSession() { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); }
function restoreSession() { try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return stored?.status === 'active' && stored?.blueprint?.branches?.length === PROTOTYPE_LIMITS.branches ? stored : null; } catch { return null; } }

function renderBranch() {
  const branch = session.blueprint.branches[session.current];
  if (!branch) return renderClosure();
  selectedQuestionId = null;
  $('chapterLabel').textContent = `RAMA ${branch.position} · CAPA 1`;
  $('decisionTitle').textContent = branch.title;
  $('summary').textContent = branch.context;
  $('progressLabel').textContent = `Rama ${branch.position} de ${PROTOTYPE_LIMITS.branches}`;
  $('progressBar').style.width = `${(branch.position / PROTOTYPE_LIMITS.branches) * 100}%`;
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
  $('closureTitle').textContent = `Tus ${outcome.responseCount} respuestas encontraron un camino.`;
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
