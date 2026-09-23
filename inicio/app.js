const SUPABASE_URL='https://bqrwcmrpzvtjoebmqiji.supabase.co';
const SUPABASE_KEY='sb_publishable_XK4dh9Ch_7MebSMO7JJm7Q_8CXu2Qa8';
const db=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
const grid=document.getElementById('catalogueGrid');
const state=document.getElementById('catalogueState');
const searchInput=document.getElementById('searchInput');
let works=[];
let filter='all';

const featured={
  slug:'el-lado-b',
  title:'El Lado B',
  author_name:'Obra fundadora de Umbral',
  synopsis:'Una historia sobre lo que ocurrió y los caminos que todavía pudieron abrirse.',
  genre:'Memoria',
  modules:{planB:true,album:true},
  cover:'../assets/el-lado-b-cover.webp',
  href:'../canon/'
};

const text=value=>String(value??'');
const escapeHtml=value=>text(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
function badges(modules={}){
  const items=['LECTURA'];
  if(modules.album)items.push('ÁLBUM');
  if(modules.planB)items.push('PLAN B');
  return items.map(item=>`<span>${item}</span>`).join('');
}
function card(work){
  const article=document.createElement('article');
  article.className='work-card';
  const href=work.href||`../obra/?slug=${encodeURIComponent(work.slug)}`;
  const safeHref=escapeHtml(href);
  const cover=work.cover?`<img src="${escapeHtml(work.cover)}" alt="Portada de ${escapeHtml(work.title)}" loading="lazy">`:`<div class="cover-placeholder">HISTORIA<br>ABIERTA</div>`;
  article.innerHTML=`<a class="work-cover" href="${safeHref}" aria-label="Abrir ${escapeHtml(work.title)}">${cover}</a><div class="work-copy"><div class="work-meta"><span>${escapeHtml(work.genre||'Historia')}</span><span>·</span><span>${escapeHtml(work.author_name||'Autor invitado')}</span></div><h3>${escapeHtml(work.title)}</h3><p>${escapeHtml(work.synopsis||'Una historia publicada en Umbral Editores.')}</p><div class="work-badges">${badges(work.modules)}</div><a class="work-link" href="${safeHref}">ABRIR OBRA →</a></div>`;
  return article;
}
function matches(work){
  const query=(searchInput?.value||'').trim().toLocaleLowerCase('es');
  const haystack=`${work.title} ${work.author_name} ${work.genre} ${work.synopsis}`.toLocaleLowerCase('es');
  const moduleMatch=filter==='all'||Boolean(work.modules?.[filter]);
  return moduleMatch&&(!query||haystack.includes(query));
}
function render(){
  grid.replaceChildren();
  const visible=works.filter(matches);
  visible.forEach(work=>grid.appendChild(card(work)));
  state.hidden=visible.length>0;
  if(!visible.length)state.textContent='No encontramos obras con ese criterio.';
}
async function loadPublished(){
  works=[featured];
  render();
  if(!db)return;
  const {data,error}=await db.from('user_stories').select('slug,title,author_name,synopsis,genre,modules').eq('status','published').eq('visibility','public').not('published_at','is',null).order('published_at',{ascending:false});
  if(error){state.hidden=false;state.textContent='La biblioteca continúa disponible, pero no pudimos cargar las publicaciones recientes.';return;}
  const publicWorks=(data||[]).filter(item=>item.slug!==featured.slug);
  works=[featured,...publicWorks];
  render();
}
if(searchInput)searchInput.oninput=render;
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('active',item===button));render()});
loadPublished();
