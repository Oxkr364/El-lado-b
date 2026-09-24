import { MAX_FREE_IMAGES, MAX_FREE_CHARACTERS, runStoryAgents } from '../plan-b/agents/runtime.js';
const $ = id => document.getElementById(id);
const db = window.supabase?.createClient('https://bqrwcmrpzvtjoebmqiji.supabase.co', 'sb_publishable_XK4dh9Ch_7MebSMO7JJm7Q_8CXu2Qa8');
const PUBLIC_CREATOR_URL = 'https://el-lado-b-git-codex-plan-b-story-engine-el-lado-b.vercel.app/crear/';
const AUTH_REDIRECT_URL = ['localhost', '127.0.0.1'].includes(location.hostname) ? PUBLIC_CREATOR_URL : new URL('./', location.href).href;
let selectedImages = [], previewUrls = [], characters = [], currentUser = null, generatedResult = null, coverImage = null, coverPreviewUrl = null;
let magicLinkCooldown = null;
let savedStoriesRequest = 0;
let saveInProgress = false;
let savedStory = null;
const createCharacter = (data = {}) => ({ id: crypto.randomUUID(), name: '', description: '', role: characters.length ? 'secondary' : 'protagonist', relationship: '', portraitSource: 'none', image: null, previewUrl: null, ...data });
const MAX_IMAGE_BYTES = 650 * 1024;
async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  let quality = .82, blob;
  do { blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality)); quality -= .08; } while (blob.size > MAX_IMAGE_BYTES && quality > .42);
  if (!blob || blob.size > MAX_IMAGE_BYTES) throw new Error('La imagen no pudo comprimirse por debajo de 650 KB.');
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp', lastModified: Date.now() });
}

function setErrors(errors = []) {
  const box = $('formErrors'); box.hidden = !errors.length; box.innerHTML = ''; if (!errors.length) return;
  const title = document.createElement('strong'); title.textContent = 'Antes de continuar:';
  const list = document.createElement('ul'); errors.forEach(message => { const item = document.createElement('li'); item.textContent = message; list.appendChild(item); }); box.append(title, list);
}

function updateConsentVisibility() {
  const needsConsent = Boolean(coverImage || selectedImages.length || characters.some(character => character.image));
  $('consentRow').hidden = !needsConsent;
  if (!needsConsent) $('consent').checked = false;
}

function setStoryText(text, fileName = '') {
  $('story').value = text.slice(0, 80000);
  $('storyCount').textContent = $('story').value.length.toLocaleString('es-CL');
  $('storyFileName').hidden = !fileName;
  $('storyFileName').textContent = fileName ? `Texto cargado desde: ${fileName}` : '';
}

async function loadStoryFile(file) {
  if (!file) return;
  if (!/\.(txt|md)$/i.test(file.name) && !['text/plain', 'text/markdown'].includes(file.type)) throw new Error('El archivo de la historia debe ser TXT o Markdown.');
  setStoryText(await file.text(), file.name);
}

function renderCover() {
  const source = document.querySelector('input[name="coverSource"]:checked')?.value ?? 'ai';
  $('coverUpload').hidden = source !== 'upload';
  $('coverPromptLabel').hidden = source !== 'ai';
  $('coverPreview').innerHTML = '';
  if (source === 'upload' && coverPreviewUrl) {
    const image = document.createElement('img'); image.src = coverPreviewUrl; image.alt = 'Vista previa de la portada'; $('coverPreview').appendChild(image);
  }
  updateConsentVisibility();
}

function renderCharacters() {
  const list = $('charactersList'); list.innerHTML = '';
  characters.forEach((character, index) => {
    if (!index) character.role = 'protagonist';
    const card = document.createElement('article'); card.className = 'character-card';
    card.innerHTML = `<div class="character-card-head"><div><span>PERSONAJE ${index + 1}</span><h3>${index ? 'Personaje adicional' : 'Protagonista'}</h3></div>${index ? '<button class="remove-character text-button" type="button">Quitar</button>' : '<small>OBLIGATORIO</small>'}</div>
      <div class="field-grid"><label>Nombre<input class="character-name" maxlength="80" placeholder="Nombre del personaje"></label><label>Rol<select class="character-role" ${index ? '' : 'disabled'}><option value="protagonist">Protagonista</option><option value="coprotagonist">Coprotagonista</option><option value="secondary">Secundario</option></select></label></div>
      <label>Descripción<textarea class="character-description" maxlength="1200" rows="4" placeholder="Apariencia, personalidad y detalles importantes."></textarea></label>
      <label ${index ? '' : 'hidden'}>Relación con el protagonista<input class="character-relationship" maxlength="240" placeholder="Hermana, amigo, rival…"></label>
      <div class="portrait-options" role="radiogroup"><label><input type="radio" name="portrait-${character.id}" value="upload"><span><strong>Subir fotografía</strong><small>Usaremos tu imagen como referencia.</small></span></label><label><input type="radio" name="portrait-${character.id}" value="ai"><span><strong>Crear con IA</strong><small>A partir del nombre y descripción.</small></span></label><label><input type="radio" name="portrait-${character.id}" value="none"><span><strong>Sin imagen</strong><small>Podrás agregarla después.</small></span></label></div>
      <div class="portrait-upload"><label class="dropzone compact"><strong>Agregar retrato</strong><span>JPG, PNG o WebP.</span><input class="character-image" type="file" accept="image/jpeg,image/png,image/webp"></label><div class="character-preview"></div></div>
      <p class="ai-note" hidden>Gerente Gen preparará una sola imagen final a partir de esta descripción. Sé lo más específico posible.</p>`;
    for (const [selector, value] of [['.character-name', character.name], ['.character-description', character.description], ['.character-role', character.role], ['.character-relationship', character.relationship]]) card.querySelector(selector).value = value;
    card.querySelector(`input[value="${character.portraitSource}"]`).checked = true;
    const upload = card.querySelector('.portrait-upload'), aiNote = card.querySelector('.ai-note'); upload.hidden = character.portraitSource !== 'upload'; aiNote.hidden = character.portraitSource !== 'ai';
    if (character.previewUrl) { const image = document.createElement('img'); image.src = character.previewUrl; image.alt = `Retrato de ${character.name || 'personaje'}`; card.querySelector('.character-preview').appendChild(image); }
    for (const [selector, key] of [['.character-name', 'name'], ['.character-description', 'description'], ['.character-role', 'role'], ['.character-relationship', 'relationship']]) card.querySelector(selector).addEventListener('input', event => { character[key] = event.target.value; });
    card.querySelectorAll('input[type="radio"]').forEach(input => input.addEventListener('change', event => { character.portraitSource = event.target.value; upload.hidden = character.portraitSource !== 'upload'; aiNote.hidden = character.portraitSource !== 'ai'; }));
    card.querySelector('.character-image').addEventListener('change', async event => { try { character.image = event.target.files[0] ? await compressImage(event.target.files[0]) : null; if (character.previewUrl) URL.revokeObjectURL(character.previewUrl); character.previewUrl = character.image ? URL.createObjectURL(character.image) : null; renderCharacters(); updateConsentVisibility(); } catch (error) { setErrors([error.message]); } });
    card.querySelector('.remove-character')?.addEventListener('click', () => { if (character.previewUrl) URL.revokeObjectURL(character.previewUrl); characters = characters.filter(item => item.id !== character.id); renderCharacters(); updateConsentVisibility(); });
    list.appendChild(card);
  });
  $('addCharacterBtn').disabled = characters.length >= MAX_FREE_CHARACTERS; $('addCharacterBtn').textContent = characters.length >= MAX_FREE_CHARACTERS ? 'LÍMITE GRATUITO: 4 PERSONAJES' : '＋ AÑADIR OTRO PERSONAJE';
}

function renderImages() {
  previewUrls.forEach(URL.revokeObjectURL); previewUrls = []; $('imageGrid').innerHTML = '';
  selectedImages.forEach((file, index) => { const url = URL.createObjectURL(file); previewUrls.push(url); const card = document.createElement('figure'), image = document.createElement('img'), caption = document.createElement('figcaption'), remove = document.createElement('button'); image.src = url; image.alt = `Fotografía ${index + 1}: ${file.name}`; caption.textContent = `${index + 1}. ${file.name}`; remove.type = 'button'; remove.textContent = 'Quitar'; remove.onclick = () => { selectedImages.splice(index, 1); renderImages(); }; card.append(image, caption, remove); $('imageGrid').appendChild(card); });
  $('imageCount').textContent = `${selectedImages.length} de ${MAX_FREE_IMAGES} gratis`;
  updateConsentVisibility();
}

async function animateLog(log) { $('pipelineState').className = 'status working'; $('pipelineState').textContent = 'PREPARANDO TU HISTORIA'; for (const message of ['Leyendo tu relato…', 'Organizando los recuerdos…', 'Preparando los personajes…', 'Construyendo la vista previa…']) { $('processingMessage').textContent = message; await new Promise(resolve => setTimeout(resolve, Math.max(180, log.length * 24))); } }
function storySafetyMessage(story) { return story.ageRating === '18+' ? 'Tu obra fue aprobada como contenido sensual no explícito para mayores de 18 años.' : 'Tu obra superó la revisión editorial y está lista para revisar.'; }
function blueprintFor(story) { return story.planBBlueprint ?? generatedResult?.log?.find(item => item.agent === 'directorPlanB')?.data?.blueprint ?? null; }
function genEmailHref(order) { return order?.notification ? `mailto:?subject=${encodeURIComponent(order.notification.subject)}&body=${encodeURIComponent(order.notification.body)}` : ''; }
function setPublishState() {
  const publish = $('publishBtn'), open = $('openPublishedBtn');
  if (!publish) return;
  const hasSaved = Boolean(savedStory?.id);
  publish.hidden = !hasSaved;
  publish.disabled = !hasSaved;
  publish.textContent = savedStory?.published ? 'OBRA PUBLICADA ✓' : 'PUBLICAR OBRA';
  if (open) {
    open.hidden = !savedStory?.published;
    if (savedStory?.published) open.href = `../obra/?slug=${encodeURIComponent(savedStory.slug)}`;
  }
}

function renderPreview(result) {
  const story = result.story, pages = $('previewPages'); $('previewTitle').textContent = story.title; const experiences = ['lectura']; if (story.modules.album) experiences.push('álbum'); if (story.modules.planB) experiences.push('Plan B'); if (story.ageRating === '18+') experiences.push('+18'); $('previewMeta').textContent = `Por ${story.author} · ${story.pages.length} páginas · ${story.characters.length} personajes · ${experiences.join(' + ')}`; pages.innerHTML = '';
  const proposal = document.createElement('article'); proposal.className = 'work-proposal'; proposal.innerHTML = `<span>ESTA OBRA PROPONE</span><h3>${story.synopsis}</h3><p>${story.modules.planB ? 'Conoce primero la historia original y después interviene en sus momentos decisivos.' : story.modules.album ? 'Lee la historia y recorre también su álbum visual.' : 'Una experiencia de lectura centrada en la historia original.'}</p>`; pages.appendChild(proposal);
  const gen = story.visualWorkOrder;
  if (gen) { const order = document.createElement('article'); order.className = 'gen-work-order'; order.innerHTML = `<span>GERENTE GEN · PRODUCCIÓN VISUAL</span><h3>${gen.status === 'pending' ? 'Orden visual preparada' : 'Sin trabajo visual pendiente'}</h3><p>${gen.status === 'pending' ? `${gen.summary.totalImagesToGenerate} imágenes pendientes: ${gen.summary.charactersToGenerate} personajes, ${gen.summary.cover === 'generate' ? '1 portada' : 'portada cargada'} y ${gen.summary.albumToGenerate} escenas de álbum. Plazo máximo: 48 horas.` : 'La obra ya incluye todos sus recursos visuales.'}</p><small>Primero personajes, luego portada y finalmente álbum. Un resultado por imagen; solo se repite ante una falla técnica.</small>`; if (gen.status === 'pending') { const send = document.createElement('a'); send.className = 'gen-email'; send.href = genEmailHref(gen); send.textContent = 'ENVIAR ORDEN A GEN POR CORREO →'; order.appendChild(send); } pages.appendChild(order); }
  const group = document.createElement('section'); group.className = 'character-preview-group';
  story.characters.forEach((character, index) => { const card = document.createElement('article'), portrait = document.createElement('div'), copy = document.createElement('div'), label = document.createElement('span'), name = document.createElement('h3'), description = document.createElement('p'); card.className = 'character-preview-card'; portrait.className = 'character-portrait'; if (characters[index]?.previewUrl) { const image = document.createElement('img'); image.src = characters[index].previewUrl; image.alt = `Retrato de ${character.name}`; portrait.appendChild(image); } else portrait.textContent = character.name.slice(0, 1).toUpperCase(); label.textContent = character.role === 'protagonist' ? 'PROTAGONISTA' : character.role === 'coprotagonist' ? 'COPROTAGONISTA' : 'PERSONAJE SECUNDARIO'; name.textContent = character.name; description.textContent = character.description; copy.append(label, name, description); if (character.relationship) { const relation = document.createElement('small'); relation.textContent = character.relationship; copy.appendChild(relation); } card.append(portrait, copy); group.appendChild(card); }); pages.appendChild(group);
  story.pages.forEach(page => { const article = document.createElement('article'), number = document.createElement('span'), title = document.createElement('h3'), text = document.createElement('p'); number.textContent = String(page.position).padStart(2, '0'); title.textContent = page.title; text.textContent = page.text; article.append(number); if (page.imageIndex !== null && previewUrls[page.imageIndex]) { const image = document.createElement('img'); image.src = previewUrls[page.imageIndex]; image.alt = `Fotografía asociada a ${page.title}`; article.appendChild(image); } article.append(title, text); pages.appendChild(article); });
  $('preview').hidden = false; $('saveTitle').textContent = savedStory?.published ? 'Obra publicada.' : savedStory?.id ? 'Borrador guardado de forma segura.' : 'Tu historia no fue publicada.'; $('saveDetail').textContent = savedStory?.published ? `Ya está disponible para lectores: ${savedStory.slug}` : savedStory?.id ? `Identificador privado: ${savedStory.slug}` : currentUser ? 'Puedes guardarla ahora como borrador privado.' : 'Inicia sesión para guardarla de forma segura.'; $('saveBtn').textContent = savedStory?.id ? 'BORRADOR GUARDADO ✓' : currentUser ? 'GUARDAR BORRADOR PRIVADO' : 'INICIAR SESIÓN PARA GUARDAR'; $('saveBtn').disabled = Boolean(savedStory?.id); setPublishState(); $('preview').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAuth() { $('authForm').hidden = Boolean(currentUser); $('logoutBtn').hidden = !currentUser; $('authStatus').textContent = currentUser ? `Sesión protegida activa: ${currentUser.email ?? 'usuario verificado'}` : 'Puedes generar una vista previa sin iniciar sesión.'; }
async function loadSavedStories() {
  const requestId = ++savedStoriesRequest, box = $('savedStories');
  if (!currentUser || !db) { box.replaceChildren(); box.hidden = true; return; }
  const { data, error } = await db.from('user_stories').select('title,slug,status,visibility').order('updated_at', { ascending: false }).limit(5);
  if (requestId !== savedStoriesRequest || error) return;
  const heading = document.createElement('strong'); heading.textContent = 'Tus historias privadas';
  const list = document.createElement('ul');
  (data ?? []).forEach(story => { const item = document.createElement('li'); item.textContent = story.title; if (story.status === 'published' && story.visibility === 'public') { const link = document.createElement('a'); link.href = `../obra/?slug=${encodeURIComponent(story.slug)}`; link.textContent = 'Abrir obra publicada →'; item.append(' ', link); } list.appendChild(item); });
  box.replaceChildren(heading, list); box.hidden = false;
}
function authErrorMessage(error) {
  if (error?.status === 429 || /rate|seconds|limit/i.test(error?.message ?? '')) return 'Espera un minuto antes de pedir otro enlace. Supabase limita los reenvíos por seguridad.';
  if (/email|smtp|send/i.test(error?.message ?? '')) return `No se pudo enviar el correo: ${error.message}`;
  return `No se pudo iniciar el acceso: ${error?.message ?? 'error desconocido'}`;
}
function startMagicLinkCooldown() {
  let remaining = 60; clearInterval(magicLinkCooldown); $('loginBtn').disabled = true;
  $('loginBtn').textContent = `REENVIAR EN ${remaining} S`;
  magicLinkCooldown = setInterval(() => { remaining -= 1; $('loginBtn').textContent = remaining > 0 ? `REENVIAR EN ${remaining} S` : 'REENVIAR ENLACE DE ACCESO'; if (remaining <= 0) { clearInterval(magicLinkCooldown); $('loginBtn').disabled = false; } }, 1000);
}
async function sendMagicLink() {
  const email = $('email').value.trim();
  if (!email) { $('email').focus(); setErrors(['Ingresa tu correo electrónico para recibir el enlace de acceso.']); return false; }
  if (!db) { setErrors(['No fue posible iniciar la conexión segura. Recarga la página e inténtalo nuevamente.']); return false; }
  $('loginBtn').disabled = true; $('loginBtn').textContent = 'ENVIANDO…'; setErrors();
  try {
    const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: AUTH_REDIRECT_URL } });
    if (error) throw error;
    $('authStatus').textContent = `Enlace enviado a ${email}. Revisa también Spam. Volverás aquí para guardar el borrador.`;
    startMagicLinkCooldown(); return true;
  } catch (error) {
    $('loginBtn').disabled = false; $('loginBtn').textContent = 'ENVIAR ENLACE DE ACCESO'; setErrors([authErrorMessage(error)]); return false;
  }
}

async function persistStory() {
  if (saveInProgress) return;
  if (!generatedResult) return setErrors(['Primero prepara la vista previa de la obra.']);
  if (!currentUser) {
    localStorage.setItem('plan_b_pending_save', 'true');
    $('saveTitle').textContent = 'Tu borrador está listo; falta verificar tu correo.';
    $('saveDetail').textContent = 'Te enviaremos un enlace y, al volver, el guardado continuará automáticamente.';
    document.querySelector('.identity').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return sendMagicLink();
  }
  saveInProgress = true;
  const button = $('saveBtn'), story = generatedResult.story, uploadedPaths = []; button.disabled = true; button.textContent = 'GUARDANDO…';
  try {
    const { data, error } = await db.from('user_stories').insert({ owner_id: currentUser.id, slug: `${story.slug}-${crypto.randomUUID().slice(0, 8)}`, title: story.title, author_name: story.author, synopsis: story.synopsis ?? $('synopsis').value, genre: story.genre ?? $('genre').value, source_text: $('story').value, modules: story.modules ?? { album: false, planB: false }, plan_b_blueprint: blueprintFor(story), cover_config: { source: document.querySelector('input[name="coverSource"]:checked')?.value ?? 'ai', prompt: $('coverPrompt').value, fileName: coverImage?.name ?? '' }, status: 'draft', visibility: 'private' }).select('id,slug').single(); if (error) throw error; savedStory = { ...data, published: false }; localStorage.setItem('plan_b_saved_story', JSON.stringify(savedStory));
    const { error: pagesError } = await db.from('user_story_pages').insert(story.pages.map(page => ({ story_id: data.id, position: page.position, title: page.title, body: page.text, layout_data: { imageIndex: page.imageIndex } }))); if (pagesError) throw pagesError;
    for (let i = 0; i < selectedImages.length; i++) { const file = selectedImages[i], path = `${currentUser.id}/${data.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`; const { error: uploadError } = await db.storage.from('story-media').upload(path, file, { contentType: file.type }); if (uploadError) throw uploadError; uploadedPaths.push(path); const { error: mediaError } = await db.from('user_story_media').insert({ story_id: data.id, owner_id: currentUser.id, storage_path: path, position: i + 1, file_name: file.name, mime_type: file.type, byte_size: file.size, consent_confirmed_at: new Date().toISOString(), status: 'ready' }); if (mediaError) throw mediaError; }
    const rows = [];
    for (let i = 0; i < story.characters.length; i++) { const character = story.characters[i], local = characters[i]; let path = null, status = character.portraitSource === 'ai' ? 'pending' : 'none'; if (character.portraitSource === 'upload' && local?.image) { path = `${currentUser.id}/${data.id}/characters/${crypto.randomUUID()}.${local.image.name.split('.').pop()}`; const { error: portraitError } = await db.storage.from('story-media').upload(path, local.image, { contentType: local.image.type }); if (portraitError) throw portraitError; uploadedPaths.push(path); status = 'ready'; } rows.push({ story_id: data.id, owner_id: currentUser.id, name: character.name, description: character.description, role: character.role, relationship: character.relationship, position: i + 1, portrait_source: character.portraitSource, portrait_storage_path: path, portrait_status: status, ai_prompt: character.portraitSource === 'ai' ? `${character.name}: ${character.description}` : null }); }
    const { error: characterError } = await db.from('user_story_characters').insert(rows); if (characterError) throw characterError;
    const { error: eventsError } = await db.from('user_story_agent_events').insert(generatedResult.log.map(item => ({ story_id: data.id, owner_id: currentUser.id, agent: item.agent, status: item.status, result: item.result, detail: item.detail, event_data: item.data }))); if (eventsError) throw eventsError;
    $('saveTitle').textContent = 'Borrador guardado de forma segura.'; $('saveDetail').textContent = `Identificador privado: ${data.slug}`; button.textContent = 'BORRADOR GUARDADO ✓'; button.disabled = true; setPublishState(); localStorage.removeItem('plan_b_pending_save'); await loadSavedStories();
  } catch (error) { if (uploadedPaths.length) await db.storage.from('story-media').remove(uploadedPaths); if (savedStory?.id) await db.from('user_stories').delete().eq('id', savedStory.id); saveInProgress = false; setErrors([`No se pudo guardar: ${error.message}`]); button.disabled = false; button.textContent = 'INTENTAR NUEVAMENTE'; }
}

async function publishStory() {
  if (!savedStory?.id || !currentUser) return setErrors(['Guarda primero el borrador y verifica tu correo.']);
  const button = $('publishBtn'); button.disabled = true; button.textContent = 'PUBLICANDO…'; setErrors();
  const { data, error } = await db.from('user_stories').update({ status: 'published', visibility: 'public', published_at: new Date().toISOString() }).eq('id', savedStory.id).eq('owner_id', currentUser.id).select('id,slug').single();
  if (error) { button.disabled = false; button.textContent = 'PUBLICAR OBRA'; return setErrors([`No se pudo publicar: ${error.message}`]); }
  savedStory = { ...savedStory, ...data, published: true }; localStorage.setItem('plan_b_saved_story', JSON.stringify(savedStory)); $('saveTitle').textContent = 'Obra publicada.'; $('saveDetail').textContent = `Tu obra ya está disponible en el catálogo público.`; const badge = document.querySelector('.private-badge'); if (badge) { badge.textContent = 'PUBLICADA'; badge.classList.add('published'); } setPublishState(); await loadSavedStories();
}

$('addCharacterBtn').onclick = () => { if (characters.length < MAX_FREE_CHARACTERS) { characters.push(createCharacter()); renderCharacters(); } };
$('images').onchange = async event => { const incoming = [...event.target.files], remaining = MAX_FREE_IMAGES - selectedImages.length; event.target.value = ''; try { const compressed = await Promise.all(incoming.slice(0, Math.max(remaining, 0)).map(compressImage)); selectedImages.push(...compressed); renderImages(); } catch (error) { setErrors([error.message]); } };
$('story').oninput = event => { $('storyCount').textContent = event.target.value.length.toLocaleString('es-CL'); };
$('storyFile').onchange = async event => { try { await loadStoryFile(event.target.files[0]); setErrors(); } catch (error) { setErrors([error.message]); } event.target.value = ''; };
for (const eventName of ['dragenter', 'dragover']) $('storyDropzone').addEventListener(eventName, event => { event.preventDefault(); $('storyDropzone').classList.add('dragging'); });
for (const eventName of ['dragleave', 'drop']) $('storyDropzone').addEventListener(eventName, event => { event.preventDefault(); $('storyDropzone').classList.remove('dragging'); });
$('storyDropzone').addEventListener('drop', async event => { try { await loadStoryFile(event.dataTransfer.files[0]); setErrors(); } catch (error) { setErrors([error.message]); } });
document.querySelectorAll('input[name="coverSource"]').forEach(input => input.onchange = renderCover);
$('coverImage').onchange = async event => { try { coverImage = event.target.files[0] ? await compressImage(event.target.files[0]) : null; if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl); coverPreviewUrl = coverImage ? URL.createObjectURL(coverImage) : null; renderCover(); } catch (error) { setErrors([error.message]); } };
$('enableAlbum').onchange = event => { $('albumFields').hidden = !event.target.checked; if (!event.target.checked) { selectedImages = []; renderImages(); } };
$('genre').onchange = event => { const adult = event.target.value === 'adult_sensual'; $('adultConfirmation').hidden = !adult; if (!adult) $('adultConfirmed').checked = false; };
$('suggestSynopsisBtn').onclick = () => { const text = $('story').value.trim(); if (!text) return setErrors(['Carga o pega el texto antes de solicitar una reseña.']); const suggestion = text.replace(/\s+/g, ' ').slice(0, 260).replace(/\s+\S*$/, ''); $('synopsis').value = `${suggestion}${suggestion.length < text.length ? '…' : ''}`; setErrors(); };
$('storyForm').onsubmit = async event => { event.preventDefault(); $('preview').hidden = true; const coverSource = document.querySelector('input[name="coverSource"]:checked')?.value; const genre = $('genre').value; const preflight = []; if ($('author').value.trim().length < 2) preflight.push('Ingresa el nombre del autor o un seudónimo.'); if ($('synopsis').value.trim().length < 30) preflight.push('La reseña debe tener al menos 30 caracteres.'); if (coverSource === 'upload' && !coverImage) preflight.push('Selecciona una portada o elige crearla con IA.'); if (coverSource === 'ai' && !$('title').value.trim()) preflight.push('La portada con IA necesita el título de la obra.'); if (genre === 'adult_sensual' && !$('adultConfirmed').checked) preflight.push('Confirma que eres mayor de 18 años para utilizar la clasificación sensual adulta.'); if (preflight.length) return setErrors(preflight); const result = runStoryAgents({ author: $('author').value, title: $('title').value, synopsis: $('synopsis').value, genre, adultConfirmed: $('adultConfirmed').checked, story: $('story').value, cover: { source: coverSource, prompt: $('coverPrompt').value, name: coverImage?.name ?? '' }, modules: { album: $('enableAlbum').checked, planB: $('enablePlanB').checked }, consent: $('consent').checked, characters: characters.map(c => ({ name: c.name, description: c.description, role: c.role, relationship: c.relationship, portraitSource: c.portraitSource, portraitName: c.image?.name ?? '', portraitType: c.image?.type ?? '', portraitSize: c.image?.size ?? 0 })), images: selectedImages.map(file => ({ name: file.name, type: file.type, size: file.size })) }); await animateLog(result.log); if (!result.ok) { setErrors(result.errors); $('pipelineState').className = 'status error'; $('pipelineState').textContent = result.log.at(-1)?.agent === 'seguridad' ? 'REVISIÓN EDITORIAL' : 'REVISAR DATOS'; return; } setErrors(); $('pipelineState').className = 'status done'; $('pipelineState').textContent = 'BORRADOR LISTO'; $('processingMessage').textContent = storySafetyMessage(result.story); localStorage.setItem('plan_b_creator_draft', JSON.stringify({ author: result.story.author, title: result.story.title, synopsis: result.story.synopsis, genre: result.story.genre, story: $('story').value, characters: result.story.characters, modules: result.story.modules })); generatedResult = result; localStorage.setItem('plan_b_generated_result', JSON.stringify(result)); renderPreview(result); };
$('loginBtn').onclick = sendMagicLink; $('logoutBtn').onclick = async () => db?.auth.signOut(); $('saveBtn').onclick = persistStory; $('publishBtn').onclick = publishStory;

try { const draft = JSON.parse(localStorage.getItem('plan_b_creator_draft')); savedStory = JSON.parse(localStorage.getItem('plan_b_saved_story')) ?? null; $('author').value = draft?.author ?? ''; $('title').value = draft?.title ?? ''; $('synopsis').value = draft?.synopsis ?? ''; $('genre').value = draft?.genre ?? 'general'; $('story').value = draft?.story ?? ''; $('enableAlbum').checked = Boolean(draft?.modules?.album); $('enablePlanB').checked = Boolean(draft?.modules?.planB); $('albumFields').hidden = !$('enableAlbum').checked; $('adultConfirmation').hidden = $('genre').value !== 'adult_sensual'; characters = draft?.characters?.length ? draft.characters.map(item => createCharacter({ ...item, image: null, previewUrl: null })) : [createCharacter()]; generatedResult = JSON.parse(localStorage.getItem('plan_b_generated_result')); } catch { characters = [createCharacter()]; generatedResult = null; }
$('storyCount').textContent = $('story').value.length.toLocaleString('es-CL'); renderCharacters(); renderCover(); updateConsentVisibility();
if (generatedResult) renderPreview(generatedResult);
if (db) { db.auth.getSession().then(async ({ data }) => { currentUser = data.session?.user ?? null; renderAuth(); await loadSavedStories(); if (currentUser && generatedResult && localStorage.getItem('plan_b_pending_save') === 'true') await persistStory(); }); db.auth.onAuthStateChange(async (event, session) => { currentUser = session?.user ?? null; renderAuth(); await loadSavedStories(); if (event === 'SIGNED_IN' && currentUser && generatedResult && localStorage.getItem('plan_b_pending_save') === 'true') await persistStory(); }); } else setErrors(['No fue posible iniciar la conexión segura.']);
