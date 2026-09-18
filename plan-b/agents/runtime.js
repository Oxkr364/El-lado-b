import { buildPlanBBlueprint, PLAN_B_LIMITS } from './plan-b-network.js';

const MAX_FREE_IMAGES = 5;
const MAX_FREE_CHARACTERS = 4;
const MAX_FREE_PAGES = 40;
const MAX_IMAGE_BYTES = 650 * 1024;

export const AGENTS = Object.freeze({
  seguridad: { name: 'Seguridad editorial', role: 'Protege a lectores y autores' },
  directorPlanB: { name: 'Director de Plan B', role: 'Coordina las cinco ramas' },
  accion: { name: 'Acción', role: 'Convierte cada respuesta en una acción narrativa' },
  continuidad: { name: 'Continuidad', role: 'Mantiene la lógica entre las dos capas' },
  canon: { name: 'Canon', role: 'Protege la fuente original' },
  editor: { name: 'Editor', role: 'Ordena el material narrativo' },
  friccion: { name: 'Fricción', role: 'Detecta el punto que mueve la historia' },
  narrador: { name: 'Narrador', role: 'Construye una secuencia legible' },
  archivo: { name: 'Archivo', role: 'Clasifica fotografías y procedencia' },
  validador: { name: 'Validador', role: 'Comprueba reglas y coherencia' },
  planificador: { name: 'Planificador', role: 'Ordena la ejecución' },
  ejecutor: { name: 'Ejecutor', role: 'Genera el borrador final' }
});

function event(agent, status, result, detail, data = {}) {
  return { agent, agentName: AGENTS[agent].name, status, result, detail, data, timestamp: new Date().toISOString() };
}

function normalizeText(value) {
  return String(value ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
}

function splitStory(text) {
  const paragraphs = normalizeText(text).split(/\n{2,}/).map(item => item.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;
  const sentences = normalizeText(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
  const pages = [];
  for (let index = 0; index < sentences.length; index += 3) pages.push(sentences.slice(index, index + 3).join(' ').trim());
  return pages.filter(Boolean);
}

function safeSlug(title) {
  return normalizeText(title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 56) || `historia-${Date.now()}`;
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
    log.push(event('directorPlanB', 'ok', 'red_plan_b_preparada', `Se prepararon ${blueprint.branches.length} ramas con dos preguntas alternativas por rama.`, { limits: PLAN_B_LIMITS, blueprint }));
  }

  const pages = rawSections.map((text, index) => ({
    id: `page-${index + 1}`, position: index + 1, title: index === 0 ? title : `Fragmento ${index + 1}`,
    text, imageIndex: images.length ? index % images.length : null
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

  const plan = ['Crear portada', 'Ordenar fragmentos', 'Asociar fotografías', 'Construir vista previa privada'];
  log.push(event('planificador', 'ok', 'tarea_planificada', 'La ejecución quedó dividida en cuatro operaciones.', { plan }));

  const generated = {
    id: globalThis.crypto?.randomUUID?.() ?? `story-${Date.now()}`, slug: safeSlug(title), title, author, synopsis, modules, genre,
    ageRating: genre === 'adult_sensual' ? '18+' : 'general', safetyStatus: 'approved',
    planBBlueprint: modules.planB ? buildPlanBBlueprint({ title, sections: rawSections, protagonist: characters[0]?.name || 'el protagonista' }) : null,
    status: 'draft', visibility: 'private', plan: 'free', imageLimit: MAX_FREE_IMAGES,
    characterLimit: MAX_FREE_CHARACTERS, pageLimit: MAX_FREE_PAGES,
    imageCount: images.length, characters, character: characters[0], pages, createdAt: new Date().toISOString()
  };
  log.push(event('ejecutor', 'ok', 'borrador_generado',
    'El Plan B fue generado como borrador privado. No se publicó automáticamente.',
    { storyId: generated.id, slug: generated.slug, status: generated.status }));
  log.push(event('validador', 'ok', 'ejecucion_verificada',
    'La salida técnica coincide con el plan aprobado.', { publishAllowed: false, humanReviewRequired: true }));

  return { ok: true, status: 'draft', story: generated, log };
}

export { MAX_FREE_IMAGES, MAX_FREE_CHARACTERS, MAX_FREE_PAGES, MAX_IMAGE_BYTES };
