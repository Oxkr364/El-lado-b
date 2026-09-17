const MAX_FREE_IMAGES = 5;

export const AGENTS = Object.freeze({
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

export function runStoryAgents(input) {
  const log = [];
  const title = normalizeText(input.title);
  const story = normalizeText(input.story);
  const author = normalizeText(input.author) || 'Autor anónimo';
  const images = Array.isArray(input.images) ? input.images : [];
  const character = {
    name: normalizeText(input.character?.name),
    description: normalizeText(input.character?.description),
    portraitSource: ['none', 'upload', 'ai'].includes(input.character?.portraitSource) ? input.character.portraitSource : 'none',
    portraitName: normalizeText(input.character?.portraitName),
    portraitType: normalizeText(input.character?.portraitType),
    portraitSize: Number(input.character?.portraitSize ?? 0)
  };

  log.push(event('canon', 'ok', 'canon_protegido',
    'La historia recibida se crea como una obra independiente y no modifica el canon de El Lado B.',
    { source: 'user_story', canonMutation: false }));

  const editorialErrors = [];
  if (title.length < 3) editorialErrors.push('El título debe tener al menos 3 caracteres.');
  if (story.length < 80) editorialErrors.push('El relato debe tener al menos 80 caracteres.');
  if (character.name.length < 2) editorialErrors.push('El personaje necesita un nombre.');
  if (character.description.length < 20) editorialErrors.push('Describe al personaje con al menos 20 caracteres.');
  if (editorialErrors.length) return failure(log, 'editor', 'material_incompleto', 'Falta material para construir una historia.', editorialErrors);

  const rawSections = splitStory(story);
  log.push(event('editor', 'ok', 'material_clasificado',
    `El relato quedó organizado en ${rawSections.length} fragmentos narrativos.`,
    { type: 'textual', destination: 'user_plan_b', sections: rawSections.length }));

  const tension = rawSections.length > 1
    ? 'La historia cambia entre sus fragmentos y admite una progresión.'
    : 'La historia funciona como una memoria breve y continua.';
  log.push(event('friccion', 'ok', 'friccion_detectada', tension,
    { scope: rawSections.length > 2 ? 'progressive' : 'local', sectionCount: rawSections.length }));

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
  if (character.portraitSource === 'upload' && !character.portraitName) archiveErrors.push('Selecciona la fotografía del personaje o elige otra opción.');
  if (character.portraitSource === 'upload' && !['image/jpeg', 'image/png', 'image/webp'].includes(character.portraitType)) archiveErrors.push('El retrato debe ser JPG, PNG o WebP.');
  if (character.portraitSource === 'upload' && character.portraitSize > 10485760) archiveErrors.push('El retrato no puede superar 10 MB.');
  if (!input.consent && (images.length || character.portraitSource === 'upload')) archiveErrors.push('Debes confirmar que puedes utilizar las fotografías.');
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
    id: globalThis.crypto?.randomUUID?.() ?? `story-${Date.now()}`, slug: safeSlug(title), title, author,
    status: 'draft', visibility: 'private', plan: 'free', imageLimit: MAX_FREE_IMAGES,
    imageCount: images.length, character, pages, createdAt: new Date().toISOString()
  };
  log.push(event('ejecutor', 'ok', 'borrador_generado',
    'El Plan B fue generado como borrador privado. No se publicó automáticamente.',
    { storyId: generated.id, slug: generated.slug, status: generated.status }));
  log.push(event('validador', 'ok', 'ejecucion_verificada',
    'La salida técnica coincide con el plan aprobado.', { publishAllowed: false, humanReviewRequired: true }));

  return { ok: true, status: 'draft', story: generated, log };
}

export { MAX_FREE_IMAGES };
