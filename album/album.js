const photos=[
{year:'1996',place:'Providencia',title:'De uniforme',note:'Antes de que alguien pensara en guardar una historia.',src:'/assets/story/1996-providencia-uniformes.webp'},
{year:'1998',place:'Reñaca',title:'Paz leyendo',note:'Había días en que bastaba un libro y el ruido del mar.',src:'/assets/story/1998-paz-leyendo-renaca.webp'},
{year:'1998',place:'Reñaca',title:'Paula',note:'Paula nunca necesitó que la cámara le pidiera atención.',src:'/assets/story/1998-paula-renaca.webp'},
{year:'1998',place:'Santiago',title:'Día de los Muertos',note:'Una noche cualquiera antes de que las cosas dejaran de ser cualquiera.',src:'/assets/story/1998-dia-muertos.webp'},
{year:'1998',place:'Santiago',title:'Fiesta fin de año',note:'Una de esas noches que parecían no terminar.',src:'/assets/story/1998-fiesta-fin-ano.webp'},
{year:'1998',place:'Santiago',title:'Mauricio y Orlando en la cuneta',note:'También quedaron las fotos que nadie pensó importantes entonces.',src:'/assets/story/1998-mauricio-orlando-cuneta.webp'},
{year:'1999',place:'Bellavista',title:'Conversaciones con un completo',note:'A veces la noche empezaba con algo tan simple como comer juntos.',src:'/assets/story/1999-completos-bellavista.webp'},
{year:'1999',place:'Cerro San Cristóbal',title:'A los pies de la Virgen',note:'Subieron juntos. Nadie preguntó cuánto iba a durar aquello.',src:'/assets/story/1999-san-cristobal.webp'},
{year:'1999',place:'Viña del Mar',title:'José y Antonio',note:'El pool era la excusa. La amistad era lo que se repetía.',src:'/assets/story/1999-jose-antonio-pool.webp'},
{year:'1999',place:'Reñaca',title:'Paula y el Escarabajo',note:'Un auto pequeño podía contener un verano completo.',src:'/assets/story/1999-paula-escarabajo.webp'},
{year:'1999',place:'Providencia',title:'Paz en movimiento',note:'Una tarde cualquiera podía terminar convertida en recuerdo.',src:'/assets/story/1999-paz-bicicleta.webp'},
{year:'2000',place:'La Reina',title:'Paula y José bailando',note:'La música también dejó su propia versión de aquellos años.',src:'/assets/story/2000-paula-jose-baile.webp'},
{year:'2000',place:'Santiago',title:'Paula y Paz',note:'Todavía había noches en que el futuro parecía no haber empezado.',src:'/assets/story/2000-paula-paz-disco.webp'},
{year:'2000',place:'Biblioteca Nacional',title:'Paz y José',note:'También hubo silencios que ocurrieron entre libros.',src:'/assets/story/2000-biblioteca-paz-jose.webp'},
{year:'2001',place:'Santiago',title:'Restaurante chino',note:'Una conversación guardada entre platos, luces y tiempo.',src:'/assets/story/2001-restaurante-chino.webp'},
{year:'2004',place:'Santiago',title:'Paula y José jugando cartas',note:'Foto: Antonio.',src:'/assets/story/2004-paula-jose-cartas.webp'},
{year:'2021',place:'Santiago',title:'Cumpleaños de José',note:'Los años habían pasado, pero algunas escenas todavía sabían reunirse.',src:'/assets/story/2021-cumple-jose.webp'},
{year:'2021',place:'Santiago',title:'Después de una gran noche',note:'Hay fotografías que aparecen cuando la fiesta ya terminó.',src:'/assets/story/2021-paula-jose-sillon.webp'},
{year:'2022',place:'Reñaca',title:'Paula',note:'Algunas personas cambian de época sin dejar de reconocerse.',src:'/assets/story/2022-paula-renaca.webp'},
{year:'2024',place:'Santiago',title:'Paula y Lorena',note:'Una amistad que ya tenía su propio lugar en la historia.',src:'/assets/story/2024-paula-lorena-pizza.webp'},
{year:'2024',place:'Costa central',title:'Paula y Lorena — Amigas, siempre',note:'Ya no necesitaban a nadie como puente.',src:'/assets/story/2024-paula-lorena-playa.webp'},
{year:'2024',place:'Santiago',title:'Matrimonio de José y Lorena',note:'Antonio estuvo allí para guardar la fotografía.',src:'/assets/story/2024-jose-lorena-boda-antonio.webp'},
{year:'2025',place:'Santiago',title:'Matrimonio de Paula',note:'José y Lorena, padrinos.',src:'/assets/story/2025-matrimonio-paula.webp'},
{year:'2025',place:'Santiago',title:'El primer hijo de José y Lorena',note:'Paula sostiene al recién llegado. La historia continúa en otra generación.',src:'/assets/story/2025-primer-hijo-jose-lorena.webp'},
{year:'2026',place:'Santiago',title:'MasterChef casero',note:'Recetas, risas y desastres. Así también se construye la amistad.',src:'/assets/story/2026-paula-lorena-cocina.webp'},
{year:'2026',place:'Santiago',title:'Karaoke & Amigas',note:'Algunas canciones no se cantan bien. Se cantan con el alma.',src:'/assets/story/2026-paula-lorena-karaoke.webp'}];
const spread=document.querySelector('#spread'),album=document.querySelector('#album'),open=document.querySelector('#openAlbum'),prev=document.querySelector('#prev'),next=document.querySelector('#next'),count=document.querySelector('#count');let current=0;
function render(){spread.innerHTML=photos.map((p,i)=>`<article class="photo-page ${i===0?'active':''}"><div class="meta"><span>${p.year}</span><span>${p.place}</span></div><div class="photo-wrap" style="--tilt:${i%2?1.1:-1.2}deg"><img src="${p.src}" alt="${p.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=missing>Fotografía reservada para el archivo definitivo</div>'"></div><p class="caption">${p.title}</p><p class="note">${p.note}</p></article>`).join('');update()}
function update(){document.querySelectorAll('.photo-page').forEach((el,i)=>el.classList.toggle('active',i===current));count.textContent=`FOTO ${String(current+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;prev.disabled=current===0;next.disabled=current===photos.length-1}
open.onclick=()=>{album.classList.add('open');album.setAttribute('aria-hidden','false');album.scrollIntoView({behavior:'smooth'});render()};prev.onclick=()=>{if(current){current--;update();spread.scrollIntoView({behavior:'smooth'})}};next.onclick=()=>{if(current<photos.length-1){current++;update();spread.scrollIntoView({behavior:'smooth'})}};