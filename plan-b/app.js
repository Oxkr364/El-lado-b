const SUPABASE_URL = 'https://bqrwcmrpzvtjoebmqiji.supabase.co'
const SUPABASE_KEY = 'sb_publishable_XK4dh9Ch_7MebSMO7JJm7Q_8CXu2Qa8'
const { createClient } = window.supabase
const db = createClient(SUPABASE_URL, SUPABASE_KEY)

const initialState = {
  jose: { interesRomantico: 0, confianza: 0, temorAPerderPaz: 0, tendenciaAlSilencio: 0, iniciativa: 0 },
  paz: { confianzaEnJose: 0, percepcionDelInteres: 0, disponibilidadEmocional: 0, iniciativa: 0 },
  relacion: { cercania: 0, tension: 0, comunicacion: 0, clandestinidad: 0, distancia: 0, confianza: 0 },
  memoria: { numeroSieteDigitos: false, llamadas: 0, codigoSecreto: 0, heridas: 0 }
}

let session = null
let decisions = []
let current = 0

const $ = (id) => document.getElementById(id)

function deepMerge(target, delta) {
  for (const [key, value] of Object.entries(delta || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge({ ...(target[key] || {}) }, value)
    } else {
      target[key] = typeof value === 'number' && typeof target[key] === 'number' ? target[key] + value : value
    }
  }
  return target
}

async function loadDecisions() {
  const { data, error } = await db
    .from('plan_b_decisions')
    .select('id,chapter,title,summary,question,sort_order')
    .order('sort_order')
  if (error) throw error

  const { data: choices, error: choicesError } = await db
    .from('plan_b_choices')
    .select('id,decision_id,choice_code,choice_text,bridge_paragraph,state_delta,next_decision_id,next_passage')
    .order('choice_code')
  if (choicesError) throw choicesError

  decisions = data.map(d => ({ ...d, choices: choices.filter(c => c.decision_id === d.id) }))
}

async function createSession() {
  const { data, error } = await db.from('plan_b_sessions').insert({
    state: initialState,
    current_decision_id: decisions[0].id,
    current_passage: 'inicio',
    status: 'active'
  }).select().single()
  if (error) throw error
  session = data
  localStorage.setItem('plan_b_session_id', session.id)
}

async function restoreSession() {
  const id = localStorage.getItem('plan_b_session_id')
  if (!id) return false
  const { data, error } = await db.from('plan_b_sessions').select('*').eq('id', id).maybeSingle()
  if (error || !data || data.status === 'completed') return false
  session = data
  current = Math.max(0, decisions.findIndex(d => d.id === data.current_decision_id))
  return true
}

function renderDecision() {
  const d = decisions[current]
  if (!d) return renderClosure()

  $('chapterLabel').textContent = `${d.chapter.replace('capitulo-', 'CAPÍTULO ')} · ${d.id}`
  $('decisionTitle').textContent = d.title
  $('summary').textContent = d.summary
  $('question').textContent = d.question
  $('progressLabel').textContent = `Decisión ${current + 1} de ${decisions.length}`
  $('progressBar').style.width = `${((current + 1) / decisions.length) * 100}%`
  $('trajectoryCount').textContent = `${current} ${current === 1 ? 'decisión' : 'decisiones'}`

  const choices = $('choices')
  choices.innerHTML = ''
  d.choices.forEach(choice => {
    const button = document.createElement('button')
    button.className = 'choice'
    button.innerHTML = `<span class="code">${choice.choice_code}</span>${choice.choice_text}`
    button.addEventListener('click', () => choose(choice))
    choices.appendChild(button)
  })
}

async function choose(choice) {
  const before = structuredClone(session.state)
  const after = deepMerge(structuredClone(session.state), choice.state_delta)

  const { error: eventError } = await db.from('plan_b_decision_events').insert({
    session_id: session.id,
    decision_id: choice.decision_id,
    choice_id: choice.id,
    state_before: before,
    state_after: after,
    bridge_paragraph: choice.bridge_paragraph
  })
  if (eventError) return alert('No se pudo guardar esta decisión. Intenta nuevamente.')

  const next = decisions.findIndex(d => d.id === choice.next_decision_id)
  const isLast = next === -1
  const nextDecisionId = isLast ? null : choice.next_decision_id

  const { data, error } = await db.from('plan_b_sessions').update({
    state: after,
    current_decision_id: nextDecisionId,
    current_passage: choice.next_passage,
    updated_at: new Date().toISOString(),
    status: isLast ? 'completed' : 'active',
    closure_code: isLast ? ({ A: 'mature_connection', B: 'distance', C: 'open_door' }[choice.choice_code] || 'open_door') : null
  }).eq('id', session.id).select().single()
  if (error) return alert('La decisión se guardó, pero no se pudo actualizar la trayectoria.')

  session = data
  $('bridge').textContent = choice.bridge_paragraph
  $('development').classList.remove('hidden')
  $('choice-panel').classList.add('hidden')
  current = isLast ? decisions.length : next
}

async function renderClosure() {
  const code = session.closure_code || 'open_door'
  const { data, error } = await db.from('plan_b_closures').select('title,paragraph').eq('code', code).single()
  if (error) return alert('No se pudo cargar el cierre.')
  $('closureTitle').textContent = data.title
  $('closureText').textContent = data.paragraph
  $('closureCount').textContent = `${decisions.length} decisiones tomadas`
  $('reader').classList.add('hidden')
  $('closure').classList.remove('hidden')
}

async function start() {
  try {
    await loadDecisions()
    const restored = await restoreSession()
    if (!restored) await createSession()
    $('intro').classList.add('hidden')
    $('reader').classList.remove('hidden')
    $('development').classList.add('hidden')
    $('choice-panel').classList.remove('hidden')
    renderDecision()
  } catch (error) {
    console.error(error)
    alert('Plan B no pudo conectarse con su memoria narrativa. Revisa la configuración de Supabase.')
  }
}

$('startBtn').addEventListener('click', start)
$('continueBtn').addEventListener('click', () => {
  $('development').classList.add('hidden')
  if (current >= decisions.length) return renderClosure()
  $('choice-panel').classList.remove('hidden')
  renderDecision()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
$('restartBtn').addEventListener('click', async () => {
  localStorage.removeItem('plan_b_session_id')
  $('closure').classList.add('hidden')
  $('intro').classList.remove('hidden')
  session = null
  current = 0
})