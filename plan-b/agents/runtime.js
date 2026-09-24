import { buildPlanBBlueprint, PLAN_B_LIMITS } from './plan-b-network.js';

const MAX_FREE_IMAGES = 4;
const MAX_FREE_CHARACTERS = 4;
const MAX_FREE_PAGES = 40;
const MAX_IMAGE_BYTES = 650 * 1024;
const PAGE_MIN_WORDS = 200;
const PAGE_TARGET_WORDS = 300;
const PAGE_MAX_WORDS = 450;

export const AGENTS = Object.freeze({
  seguridad: { name: 'Seguridad editorial', role: 'Protege a lectores y autores' },
  directorPlanB: { name: 'Director de Plan B', role: 'Coordina hasta cuatro decisiones' },
  accion: { name: 'Acción', role: 'Convierte cada respuesta en una acción narrativa' },
  continuidad: { name: 'Continuidad', role: 'Mantiene la lógica entre las dos capas' },
  canon: { name: 'Canon', role: 'Protege la fuente original' },
  editor: { name: 'Editor', role: 'Ordena el material narrativo' },
  friccion: { name: 'Fricción', role: 'Detecta el punto que mueve la historia' },
  narrador: { name: 'Narrador', role: 'Construye una secuencia legible' },
  archivo: { name: 'Archivo', role: 'Clasifica fotografías y procedencia' },
  validador: { name: 'Validador', role: 'Comprueba reglas y coherencia' },
  planificador: { name: 'Planificador', role: 'Ordena la ejecución' },
  ejecutor: { name: 'Ejecutor', role: 'Genera el borrador final' },
  gen: { name: 'Gerente Gen', role: 'Prepara y controla la producción visual' }
});

function event(agent, status, result, detail, data = {}) {
  return { agent, agentName: AGENTS[agent].name, status, result, detail, data, timestamp: new Date().toISOString() };
}

function normalizeText(value) {
  return String(value ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
}

function splitStory(text) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean); if (!words.length) return [];
  const pages = []; for (let index = 0; index < words.length; index += PAGE_TARGET_WORDS) pages.push(words.slice(index, index + PAGE_TARGET_WORDS).join(' '));
  if (pages.length > 1) { const lastWords = pages.at(-1).split(/\s+/); if (lastWords.length < PAGE_MIN_WORDS) { const previous = pages.at(-2).split(/\s+/); const combined = [...previous, ...lastWords]; if (combined.length <= PAGE_MAX_WORDS) { pages.splice(-2, 2, combined.join(' ')); } else { const splitAt = Math.ceil(combined.length / 2); pages.splice(-2, 2, combined.slice(0, splitAt).join(' '), combined.slice(splitAt).join(' ')); } } }
  return pages;
}

function safeSlug(title) {
  return normalizeText(title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 56) || `historia-${Date.now()}`;
}

function visualScenes(pages, count = MAX_FREE_IMAGES) {
  const words = pages.flatMap(page => normalizeText(page.text).split(/\s+/)).filter(Boolean);
  if (!words.length || !count) return [];
  const size = Math.max(1, Math.ceil(words.length / count));
  return Array.from({ length: count }, (_, index) => {
    const start = Math.min(words.length - 1, index * size);
    const chunk = words.slice(start, Math.min(words.length, start + size));
    return chunk.length ? chunk.join(' ') : words.slice(Math.max(0, words.length - size)).join(' ');
  });
}

function visualPromptBase({ genre, title }) {
  return `Ilustración editorial para “${title}”, género ${genre}. Mantener época, ambiente, vestuario y rasgos de los personajes con absoluta continuidad. Sin palabras, letras, logotipos ni marcas de agua.`;
}

function buildGenEmail(title, tasks, summary) {
  const executable = task => `[GENERAR IMAGEN — NO RESPONDER CON TEXTO]\nGenera ahora una única imagen usando tu herramienta de creación de imágenes. No saludes, no expliques, no analices y no devuelvas un prompt. Ejecuta directamente esta instrucción visual:\n\n${task.prompt}`;
  const section = (heading, items, empty) => [heading, items.length
    ? items.map((task, index) => `BLOQUE ${index + 1} — COPIAR POR SEPARADO\n${executable(task)}`).join('\n\n--------------------\n\n')
    : empty].join('\n');
  const body = [
    'GERENTE GEN — ORDEN DE PRODUCCIÓN VISUAL',
    `OBRA: ${title}`,
    `TOTAL A GENERAR: ${summary.totalImagesToGenerate}`,
    '',
    'IMPORTANTE: pega en Gemini un solo bloque por vez. No pegues el correo completo.',
    'Cada bloque exige generar la imagen directamente y prohíbe responder con texto.',
    '',
    section('PORTADA', tasks.filter(task => task.type === 'cover'), 'Portada cargada por el autor. No generar.'),
    '',
    section('PERSONAJES', tasks.filter(task => task.type === 'character'), 'No hay retratos pendientes.'),
    '',
    section('ESCENAS SIGNIFICATIVAS (ÁLBUM)', tasks.filter(task => task.type === 'album'), 'No hay escenas pendientes.'),
    '',
    'ORDEN: personajes → portada → álbum.',
    'Usar un resultado final por imagen. Repetir solo ante falla técnica.',
    'Plazo máximo: 48 horas.'
  ].join('\n');
  return { subject: `Solicitud visual Gen — ${title}`, body };
}

export function buildGenWorkOrder({ title, synopsis, genre, cover, characters, pages, modules, uploadedAlbumImages = 0 }) {
  const base = visualPromptBase({ genre, title });
  const characterTasks = characters
    .filter(character => character.portraitSource === 'ai')
    .map((character, index) => ({
      id: `personaje-${index + 1}`,
      type: 'character',
      name: character.name,
      quantity: 1,
      prompt: `${base} Retrato de referencia de ${character.name}, ${character.role}: ${character.description}${character.relationship ? ` Relación: ${character.relationship}.` : ''} Fondo neutro, cuerpo visible y rostro claramente definido.`
    }));
  const coverTasks = cover.source === 'ai' ? [{
    id: 'portada', type: 'cover', quantity: 1,
    prompt: `${base} Portada vertical, composición cinematográfica. Reseña: ${synopsis}.${cover.prompt ? ` Indicación del autor: ${cover.prompt}.` : ''}`
  }] : [];
  const missingAlbumImages = modules.album ? Math.max(0, MAX_FREE_IMAGES - uploadedAlbumImages) : 0;
  const selectedScenes = visualScenes(pages, missingAlbumImages);
  const albumTasks = selectedScenes.map((scene, index) => ({
    id: `album-${index + 1}`,
    type: 'album',
    scene: index + 1,
    quantity: 1,
    prompt: `${base} Escena horizontal significativa del relato: ${scene.slice(0, 520)}. Usar como referencia obligatoria los retratos de personajes ya creados.`
  }));
  const tasks = [...characterTasks, ...coverTasks, ...albumTasks];
  const summary = {
    cover: cover.source === 'ai' ? 'generate' : 'uploaded',
    charactersToGenerate: characterTasks.length,
    albumUploaded: uploadedAlbumImages,
    albumToGenerate: albumTasks.length,
    totalImagesToGenerate: tasks.reduce((total, task) => total + task.quantity, 0)
  };
  return {
    version: 1,
    manager: 'gen',
    status: tasks.length ? 'pending' : 'not_required',
    deadlineHours: tasks.length ? 48 : 0,
    sequence: ['characters', 'cover', 'album'],
    policy: {
      oneResultPerItem: true,
      aestheticRevisions: false,
      retryOnlyOnTechnicalFailure: true,
      editorialReviewRepeated: false
    },
    summary,
    notification: buildGenEmail(title, tasks, summary),
    tasks
  };
}

function failure(log, agent, result, detail, errors) {
  log.push(event(agent, 'error', result, detail, { errors }));
  return { ok: false, status: 'blocked', errors, log };
}

const SAFETY_RULES = Object.freeze({
  violence: /(?:asesin(?:ar|ato|ó)|matar|mató|degollar|decapitar|desmembrar|mutilar|torturar|apuñalar|acuchillar|disparar|balazo|golpear\s+hasta|sangre\s+derramada|cadáver\s+mutilado)/iu,
  explicitSex: /(?:penetr(?:ar|ación)|sexo\s+explícito|acto\s+sexual|genitales|eyacul(?:ar|ación)|orgasmo|masturb(?:ar|ación)|pornograf(?:ía|ico|ica))/iu,
  sexualViolence: /(?:violación|violar|abuso\s+sexual|agresión\s+sexual|sexo\s+forzado)/iu,
  minors: /(?:niñ[oa]|menor|adolescente).{0,80}(?:sexo|sexual|desnud[oa]|erótic[oa]|íntim[oa])|(?:sexo|sexual|desnud[oa]|erótic[oa]|íntim[oa]).{0,80}(?:niñ[oa]|menor|adolescente)/iu
});
const SAFETY_MESSAGES = Object.freeze({
  violence: 'Posible violencia no permitida por las reglas editoriales.',
  explicitSex: 'Posible sexualidad explícita. Solo admitimos contenido adulto sugerido, no gráfico.',
  sexualViolence: 'Posible violencia sexual, contenido no permitido.',
  minors: 'Posible relación entre contenido sexual y menores, lo que está prohibido.'
});

function safetyExcerpt(text, match) {
  const start = Math.max(0, match.index - 55), end = Math.min(text.length, match.index + match[0].length + 55);
  const prefix = start > 0 ? '…' : '', suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}

export function reviewSafetyFindings(text) {
  const source = String(text ?? '');
  return Object.entries(SAFETY_RULES).flatMap(([rule, pattern]) => {
    const match = pattern.exec(source);
    return match ? [{ rule, message: SAFETY_MESSAGES[rule], phrase: match[0], excerpt: safetyExcerpt(source, match), index: match.index }] : [];
  });
}

export function reviewSafety(text) {
  return reviewSafetyFindings(text).map(finding => `${finding.message} Frase observada: “${finding.excerpt}”`);
}

export function runStoryAgents(input) {
  const log = [];
  const title = normalizeText(input.title);
  const story = normalizeText(input.story);
  const author = normalizeText(input.author);
  const synopsis = normalizeText(input.synopsis);
  const modules = { album: Boolean(input.modules?.album), planB: Boolean(input.modules?.planB) };
  const cover = {
    source: input.cover?.source === 'upload' ? 'upload' : 'ai',
    prompt: normalizeText(input.cover?.prompt),
    name: normalizeText(input.cover?.name)
  };
  const genre = normalizeText(input.genre) || 'general';
  const adultConfirmed = Boolean(input.adultConfirmed);
  const images = Array.isArray(input.images) ? input.images : [];
  const sourceCharacters = Array.isArray(input.characters) ? input.characters : (input.character ? [input.character] : []);
  const characters = sourceCharacters.map((item, index) => ({
    name: normalizeText(item?.name),
    description: normalizeText(item?.description),
    role: index === 0 ? 'protagonist' : (['coprotagonist', 'secondary'].includes(item?.role) ? item.role : 'secondary'),
    relationship: normalizeText(item?.relationship),
    portraitSource: ['none', 'upload', 'ai'].includes(item?.portraitSource) ? item.portraitSource : 'none',
    portraitName: normalizeText(item?.portraitName),
    portraitType: normalizeText(item?.portraitType),
    portraitSize: Number(item?.portraitSize ?? 0)
  }));

  log.push(event('canon', 'ok', 'canon_protegido',
    'La historia recibida se crea como una obra independiente y no modifica el canon de El Lado B.',
    { source: 'user_story', canonMutation: false }));

  const editorialErrors = [];
  if (author.length < 2) editorialErrors.push('Ingresa el nombre del autor o un seudónimo.');
  if (title.length < 3) editorialErrors.push('El título debe tener al menos 3 caracteres.');
  if (synopsis.length < 30) editorialErrors.push('La reseña debe tener al menos 30 caracteres.');
  if (story.length < 80) editorialErrors.push('El relato debe tener al menos 80 caracteres.');
  if (cover.source === 'upload' && !cover.name) editorialErrors.push('Selecciona una portada o elige crearla con IA.');
  if (characters.length > MAX_FREE_CHARACTERS) editorialErrors.push(`La edición gratuita admite hasta ${MAX_FREE_CHARACTERS} personajes.`);
  if (!characters.length) editorialErrors.push('Agrega al menos un personaje protagonista.');
  characters.forEach((character, index) => {
    if (character.name.length < 2) editorialErrors.push(`El personaje ${index + 1} necesita un nombre.`);
    if (character.description.length < 20) editorialErrors.push(`Describe al personaje ${index + 1} con al menos 20 caracteres.`);
  });
  if (editorialErrors.length) return failure(log, 'editor', 'material_incompleto', 'Falta material para construir una historia.', editorialErrors);

  if (genre === 'adult_sensual' && !adultConfirmed) return failure(log, 'seguridad', 'edad_sin_confirmar', 'La clasificación adulta necesita confirmación.', ['Confirma que eres mayor de 18 años para publicar una obra sensual para adultos.']);
  const safetyText = [title, synopsis, story, ...characters.flatMap(character => [character.name, character.description, character.relationship])].join('\n');
  const safetyErrors = reviewSafety(safetyText);
  if (safetyErrors.length) return failure(log, 'seguridad', 'contenido_bloqueado', 'La obra no cumple las reglas editoriales.', safetyErrors);
  log.push(event('seguridad', 'ok', genre === 'adult_sensual' ? 'aprobada_mayores_18' : 'aprobada', genre === 'adult_sensual' ? 'La obra fue aprobada como contenido sensual no explícito para mayores de 18 años.' : 'La obra cumple las reglas editoriales de publicación.', { rating: genre === 'adult_sensual' ? '18+' : 'general', violenceAllowed: false, explicitSexAllowed: false }));

  const rawSections = splitStory(story);
  if (rawSections.length > MAX_FREE_PAGES) return failure(log, 'editor', 'limite_paginas', `La edición gratuita admite hasta ${MAX_FREE_PAGES} páginas.`, [`Reduce el relato a ${MAX_FREE_PAGES} páginas o menos.`]);
  log.push(event('editor', 'ok', 'material_clasificado',
    `El relato quedó organizado en ${rawSections.length} fragmentos narrativos.`,
    { type: 'textual', destination: 'user_plan_b', sections: rawSections.length }));

  if (modules.planB) {
    const tension = rawSections.length > 1
      ? 'La historia cambia entre sus fragmentos y admite una progresión.'
      : 'La historia funciona como una memoria breve y continua.';
    log.push(event('friccion', 'ok', 'friccion_detectada', tension,
      { scope: rawSections.length > 2 ? 'progressive' : 'local', sectionCount: rawSections.length }));
    const blueprint = buildPlanBBlueprint({ title, sections: rawSections, protagonist: characters[0]?.name || 'el protagonista' });
    log.push(event('directorPlanB', 'ok', 'red_plan_b_preparada', `Se prepararon ${blueprint.branches.length} decisiones con una pregunta y dos alternativas por momento.`, { limits: PLAN_B_LIMITS, blueprint }));
  }

  const pages = rawSections.map((text, index) => ({
    id: `page-${index + 1}`, position: index + 1, title: index === 0 ? title : `Fragmento ${index + 1}`,
    text, imageIndex: index < images.length ? index : null
  }));
  log.push(event('narrador', 'ok', 'secuencia_construida',
    `Se prepararon ${pages.length} páginas sin agregar hechos nuevos.`, { pages: pages.length, inventedFacts: false }));

  const archiveErrors = [];
  if (images.length > MAX_FREE_IMAGES) archiveErrors.push(`El plan gratuito admite hasta ${MAX_FREE_IMAGES} imágenes.`);
  const invalidImage = images.find(image => !String(image.type ?? '').startsWith('image/'));
  if (invalidImage) archiveErrors.push(`“${invalidImage.name}” no es una imagen válida.`);
  const oversizedImage = images.find(image => Number(image.size ?? 0) > MAX_IMAGE_BYTES);
  if (oversizedImage) archiveErrors.push(`“${oversizedImage.name}” supera el máximo de 650 KB después de comprimir.`);
  characters.forEach((character, index) => {
    const label = character.name || `personaje ${index + 1}`;
    if (character.portraitSource === 'upload' && !character.portraitName) archiveErrors.push(`Selecciona la fotografía de ${label} o elige otra opción.`);
    if (character.portraitSource === 'upload' && !['image/jpeg', 'image/png', 'image/webp'].includes(character.portraitType)) archiveErrors.push(`El retrato de ${label} debe ser JPG, PNG o WebP.`);
    if (character.portraitSource === 'upload' && character.portraitSize > MAX_IMAGE_BYTES) archiveErrors.push(`El retrato de ${label} supera el máximo de 650 KB después de comprimir.`);
  });
  if (!input.consent && (images.length || characters.some(character => character.portraitSource === 'upload'))) archiveErrors.push('Debes confirmar que puedes utilizar las fotografías.');
  if (archiveErrors.length) return failure(log, 'archivo', 'archivo_requiere_revision', 'Las fotografías no superaron la revisión.', archiveErrors);
  log.push(event('archivo', 'ok', 'archivo_clasificado',
    `${images.length} de ${MAX_FREE_IMAGES} imágenes gratuitas fueron clasificadas para el borrador.`,
    { category: 'user_story', provenance: input.consent ? 'declared' : 'not_required', images: images.length }));

  const validationErrors = [];
  if (!pages.length) validationErrors.push('No se pudo construir ninguna página.');
  if (pages.some(page => !page.text)) validationErrors.push('Existe una página sin contenido.');
  if (validationErrors.length) return failure(log, 'validador', 'validacion_fallida', 'El borrador contiene inconsistencias.', validationErrors);
  log.push(event('validador', 'ok', 'borrador_validado',
    'El relato conserva su texto, mantiene el canon separado y respeta el límite gratuito.', { freeImageLimit: MAX_FREE_IMAGES }));

  const visualWorkOrder = buildGenWorkOrder({
    title, synopsis, genre, cover, characters, pages, modules, uploadedAlbumImages: images.length
  });
  log.push(event('gen', 'ok', visualWorkOrder.status === 'pending' ? 'orden_visual_creada' : 'produccion_visual_no_requerida',
    visualWorkOrder.status === 'pending'
      ? `Orden lista: ${visualWorkOrder.summary.totalImagesToGenerate} imágenes, con plazo máximo de 48 horas.`
      : 'La portada y el contenido visual fueron cargados por el autor; no hay imágenes pendientes.',
    { workOrder: visualWorkOrder }));

  const plan = ['Crear portada', 'Ordenar fragmentos', 'Asociar fotografías', 'Construir vista previa privada'];
  log.push(event('planificador', 'ok', 'tarea_planificada', 'La ejecución quedó dividida en cuatro operaciones.', { plan }));

  const generated = {
    id: globalThis.crypto?.randomUUID?.() ?? `story-${Date.now()}`, slug: safeSlug(title), title, author, synopsis, modules, genre,
    ageRating: genre === 'adult_sensual' ? '18+' : 'general', safetyStatus: 'approved',
    planBBlueprint: modules.planB ? buildPlanBBlueprint({ title, sections: rawSections, protagonist: characters[0]?.name || 'el protagonista' }) : null,
    status: 'draft', visibility: 'private', plan: 'free', imageLimit: MAX_FREE_IMAGES,
    characterLimit: MAX_FREE_CHARACTERS, pageLimit: MAX_FREE_PAGES, cover, visualWorkOrder,
    imageCount: images.length, characters, character: characters[0], pages, createdAt: new Date().toISOString()
  };
  log.push(event('ejecutor', 'ok', 'borrador_generado',
    'El Plan B fue generado como borrador privado. No se publicó automáticamente.',
    { storyId: generated.id, slug: generated.slug, status: generated.status }));
  log.push(event('validador', 'ok', 'ejecucion_verificada',
    'La salida técnica coincide con el plan aprobado.', { publishAllowed: false, humanReviewRequired: true }));

  return { ok: true, status: 'draft', story: generated, log };
}

export { MAX_FREE_IMAGES, MAX_FREE_CHARACTERS, MAX_FREE_PAGES, MAX_IMAGE_BYTES, PAGE_MIN_WORDS, PAGE_TARGET_WORDS, PAGE_MAX_WORDS };
