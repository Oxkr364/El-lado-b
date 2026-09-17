import { AGENTS, MAX_FREE_IMAGES, runStoryAgents } from '../plan-b/agents/runtime.js';

const $ = id => document.getElementById(id);
const agentOrder = ['canon', 'editor', 'friccion', 'narrador', 'archivo', 'validador', 'planificador', 'ejecutor'];
const SUPABASE_URL = 'https://bqrwcmrpzvtjoebmqiji.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XK4dh9Ch_7MebSMO7JJm7Q_8CXu2Qa8';
const db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
let selectedImages = [];
let previewUrls = [];
let currentUser = null;
let generatedResult = null;

function renderAgentRoster() {
  const list = $('agentList');
  list.innerHTML = '';
  agentOrder.forEach((key, index) => {
    const node = $('agentTemplate').content.firstElementChild.cloneNode(true);
    node.dataset.agent = key;
    node.querySelector('.agent-number').textContent = String(index + 1).padStart(2, '0');
    node.querySelector('.agent-name').textContent = AGENTS[key].name;
    node.querySelector('.agent-role').textContent = AGENTS[key].role;
    list.appendChild(node);
  });
}

function renderImages() {
  previewUrls.forEach(URL.revokeObjectURL);
  previewUrls = [];
  $('imageGrid').innerHTML = '';
  selectedImages.forEach((file, index) => {
    const url = URL.createObjectURL(file);
    previewUrls.push(url);
    const card = document.createElement('figure');
    const image = document.createElement('img');
    const caption = document.createElement('figcaption');
    const remove = document.createElement('button');
    image.src = url;
    image.alt = `Fotografía ${index + 1}: ${file.name}`;
    caption.textContent = `${index + 1}. ${file.name}`;
    remove.type = 'button';
    remove.textContent = 'Quitar';
    remove.setAttribute('aria-label', `Quitar ${file.name}`);
    remove.addEventListener('click', () => { selectedImages.splice(index, 1); renderImages(); });
    card.append(image, caption, remove);
    $('imageGrid').appendChild(card);
  });
  $('imageCount').textContent = `${selectedImages.length} de ${MAX_FREE_IMAGES} gratis`;
}

function setErrors(errors = []) {
  const box = $('formErrors');
  box.hidden = !errors.length;
  box.innerHTML = '';
  if (!errors.length) return;
  const title = document.createElement('strong');
  title.textContent = 'Antes de continuar:';
  const list = document.createElement('ul');
  errors.forEach(message => { const item = document.createElement('li'); item.textContent = message; list.appendChild(item); });
  box.append(title, list);
}

function resetAgents() {
  document.querySelectorAll('.agent-card').forEach(card => {
    card.dataset.state = 'idle';
    card.querySelector('.agent-result').textContent = 'Esperando material.';
    card.querySelector('.agent-state').textContent = '○';
  });
}

async function animateLog(log) {
  resetAgents();
  $('pipelineState').className = 'status working';
  $('pipelineState').textContent = 'PROCESANDO';
  for (const item of log) {
    const card = document.querySelector(`[data-agent="${item.agent}"]`);
    if (!card) continue;
    card.dataset.state = 'working';
    card.querySelector('.agent-state').textContent = '…';
    await new Promise(resolve => setTimeout(resolve, 180));
    card.dataset.state = item.status === 'ok' ? 'done' : 'error';
    card.querySelector('.agent-result').textContent = item.detail;
    card.querySelector('.agent-state').textContent = item.status === 'ok' ? '✓' : '!';
  }
}

function renderPreview(result) {
  const story = result.story;
  $('previewTitle').textContent = story.title;
  $('previewMeta').textContent = `Por ${story.author} · ${story.pages.length} páginas · ${story.imageCount} fotografías`;
  const pages = $('previewPages');
  pages.innerHTML = '';
  story.pages.forEach(page => {
    const article = document.createElement('article');
    const number = document.createElement('span');
    const title = document.createElement('h3');
    const text = document.createElement('p');
    number.textContent = String(page.position).padStart(2, '0');
    title.textContent = page.title;
    text.textContent = page.text;
    article.append(number);
    if (page.imageIndex !== null && previewUrls[page.imageIndex]) {
      const image = document.createElement('img');
      image.src = previewUrls[page.imageIndex];
      image.alt = `Fotografía asociada a ${page.title}`;
      article.appendChild(image);
    }
    article.append(title, text);
    pages.appendChild(article);
  });
  $('preview').hidden = false;
  $('saveTitle').textContent = 'Tu historia no fue publicada.';
  $('saveDetail').textContent = currentUser
    ? 'Puedes guardarla ahora como borrador privado.'
    : 'Inicia sesión para guardarla de forma segura y recuperarla en otro dispositivo.';
  $('saveBtn').textContent = currentUser ? 'GUARDAR BORRADOR PRIVADO' : 'INICIAR SESIÓN PARA GUARDAR';
  $('saveBtn').disabled = false;
  $('preview').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAuth() {
  $('authForm').hidden = Boolean(currentUser);
  $('logoutBtn').hidden = !currentUser;
  $('authStatus').textContent = currentUser
    ? `Sesión protegida activa: ${currentUser.email ?? 'usuario verificado'}`
    : 'Puedes generar una vista previa sin iniciar sesión.';
  if (generatedResult) {
    $('saveBtn').textContent = currentUser ? 'GUARDAR BORRADOR PRIVADO' : 'INICIAR SESIÓN PARA GUARDAR';
    $('saveDetail').textContent = currentUser
      ? 'Puedes guardarla ahora como borrador privado.'
      : 'Inicia sesión para guardarla de forma segura y recuperarla en otro dispositivo.';
  }
}

async function loadSavedStories() {
  const box = $('savedStories');
  box.innerHTML = '';
  box.hidden = !currentUser;
  if (!currentUser || !db) return;
  const { data, error } = await db.from('user_stories')
    .select('id,title,status,updated_at').order('updated_at', { ascending: false }).limit(5);
  if (error) {
    const message = document.createElement('p');
    message.textContent = 'No pudimos recuperar tus borradores en este momento.';
    box.appendChild(message);
    return;
  }
  const heading = document.createElement('strong');
  heading.textContent = 'Tus historias privadas';
  box.appendChild(heading);
  if (!data.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Todavía no tienes borradores guardados.';
    box.appendChild(empty);
    return;
  }
  const list = document.createElement('ul');
  data.forEach(story => {
    const item = document.createElement('li');
    const title = document.createElement('span');
    const state = document.createElement('small');
    title.textContent = story.title;
    state.textContent = story.status === 'draft' ? 'Borrador privado' : story.status;
    item.append(title, state);
    list.appendChild(item);
  });
  box.appendChild(list);
}

async function sendMagicLink() {
  const email = $('email').value.trim();
  if (!email) return setErrors(['Ingresa tu correo electrónico para recibir el enlace de acceso.']);
  if (!db) return setErrors(['No fue posible conectar con la memoria segura.']);
  $('loginBtn').disabled = true;
  $('loginBtn').textContent = 'ENVIANDO…';
  const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
  $('loginBtn').disabled = false;
  $('loginBtn').textContent = 'ENVIAR ENLACE DE ACCESO';
  if (error) return setErrors([`No se pudo enviar el enlace: ${error.message}`]);
  setErrors();
  $('authStatus').textContent = 'Revisa tu correo. Te enviamos un enlace para abrir tu espacio privado.';
}

async function persistStory() {
  if (!generatedResult) return;
  if (!currentUser) {
    $('email').focus();
    $('identityTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const button = $('saveBtn');
  button.disabled = true;
  button.textContent = 'GUARDANDO…';
  const story = generatedResult.story;
  const slug = `${story.slug}-${crypto.randomUUID().slice(0, 8)}`;
  let savedStory = null;
  const uploadedPaths = [];
  try {
    const { data, error } = await db.from('user_stories').insert({
      owner_id: currentUser.id, slug, title: story.title, author_name: story.author,
      source_text: $('story').value, status: 'draft', visibility: 'private'
    }).select('id,slug').single();
    if (error) throw error;
    savedStory = data;

    if (story.pages.length) {
      const { error: pagesError } = await db.from('user_story_pages').insert(story.pages.map(page => ({
        story_id: data.id, position: page.position, title: page.title, body: page.text,
        layout_data: { imageIndex: page.imageIndex }
      })));
      if (pagesError) throw pagesError;
    }

    for (let index = 0; index < selectedImages.length; index += 1) {
      const file = selectedImages[index];
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'img';
      const path = `${currentUser.id}/${data.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await db.storage.from('story-media').upload(path, file, {
        cacheControl: '3600', contentType: file.type, upsert: false
      });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      const { error: mediaError } = await db.from('user_story_media').insert({
        story_id: data.id, owner_id: currentUser.id, storage_path: path, position: index + 1,
        file_name: file.name, mime_type: file.type, byte_size: file.size,
        consent_confirmed_at: new Date().toISOString(), status: 'ready'
      });
      if (mediaError) throw mediaError;
    }

    const { error: eventsError } = await db.from('user_story_agent_events').insert(generatedResult.log.map(item => ({
      story_id: data.id, owner_id: currentUser.id, agent: item.agent, status: item.status,
      result: item.result, detail: item.detail, event_data: item.data
    })));
    if (eventsError) throw eventsError;

    $('saveTitle').textContent = 'Borrador guardado de forma segura.';
    $('saveDetail').textContent = `Identificador privado: ${data.slug}`;
    button.textContent = 'BORRADOR GUARDADO ✓';
    localStorage.removeItem('plan_b_creator_draft');
    await loadSavedStories();
  } catch (error) {
    if (uploadedPaths.length) await db.storage.from('story-media').remove(uploadedPaths);
    if (savedStory?.id) await db.from('user_stories').delete().eq('id', savedStory.id);
    setErrors([`No se pudo guardar el borrador: ${error.message}`]);
    button.disabled = false;
    button.textContent = 'INTENTAR GUARDAR NUEVAMENTE';
  }
}

$('images').addEventListener('change', event => {
  const incoming = [...event.target.files];
  const remaining = MAX_FREE_IMAGES - selectedImages.length;
  if (incoming.length > remaining) setErrors([`Puedes usar ${MAX_FREE_IMAGES} fotografías gratis. Seleccionamos las primeras ${Math.max(remaining, 0)}.`]);
  else setErrors();
  selectedImages.push(...incoming.slice(0, Math.max(remaining, 0)));
  event.target.value = '';
  renderImages();
});

$('story').addEventListener('input', event => { $('storyCount').textContent = event.target.value.length.toLocaleString('es-CL'); });

$('storyForm').addEventListener('submit', async event => {
  event.preventDefault();
  $('preview').hidden = true;
  const result = runStoryAgents({
    author: $('author').value, title: $('title').value, story: $('story').value,
    consent: $('consent').checked,
    images: selectedImages.map(file => ({ name: file.name, type: file.type, size: file.size }))
  });
  await animateLog(result.log);
  if (!result.ok) {
    setErrors(result.errors);
    $('pipelineState').className = 'status error';
    $('pipelineState').textContent = 'BLOQUEADO';
    return;
  }
  setErrors();
  $('pipelineState').className = 'status done';
  $('pipelineState').textContent = 'BORRADOR LISTO';
  localStorage.setItem('plan_b_creator_draft', JSON.stringify({ author: result.story.author, title: result.story.title, story: $('story').value, savedAt: new Date().toISOString() }));
  generatedResult = result;
  renderPreview(result);
});

$('loginBtn').addEventListener('click', sendMagicLink);
$('logoutBtn').addEventListener('click', async () => { if (db) await db.auth.signOut(); });
$('saveBtn').addEventListener('click', persistStory);

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('plan_b_creator_draft'));
    if (!draft) return;
    $('author').value = draft.author ?? '';
    $('title').value = draft.title ?? '';
    $('story').value = draft.story ?? '';
    $('storyCount').textContent = $('story').value.length.toLocaleString('es-CL');
  } catch { localStorage.removeItem('plan_b_creator_draft'); }
}

renderAgentRoster();
restoreDraft();
if (db) {
  db.auth.getSession().then(({ data }) => { currentUser = data.session?.user ?? null; renderAuth(); loadSavedStories(); });
  db.auth.onAuthStateChange((_event, session) => { currentUser = session?.user ?? null; renderAuth(); loadSavedStories(); });
} else {
  setErrors(['No fue posible iniciar la conexión segura con Supabase.']);
}
