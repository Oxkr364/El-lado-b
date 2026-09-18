const work={title:'El Lado B',genre:'Memoria',description:'Una obra sobre lo que pudo haber sido. Entra por la portada y recorre la historia a tu propio ritmo.',cover:'../assets/el-lado-b-cover.webp',href:'../canon/'};
const card=document.createElement('article');
card.className='work-card';
card.innerHTML=`<div class="work-cover"><img src="${work.cover}" alt="Portada de ${work.title}" loading="lazy"></div><div class="work-copy"><span class="genre">${work.genre}</span><h3>${work.title}</h3><p>${work.description}</p><a class="work-link" href="${work.href}">INGRESAR A LA OBRA →</a></div>`;
document.getElementById('catalogueGrid').appendChild(card);

const db=window.supabase?.createClient('https://bqrwcmrpzvtjoebmqiji.supabase.co','sb_publishable_XK4dh9Ch_7MebSMO7JJm7Q_8CXu2Qa8');
async function loadPublished(){
  if(!db)return;
  const {data}=await db.from('user_stories').select('slug,title,author_name,synopsis,genre,modules').eq('status','published').eq('visibility','public').not('published_at','is',null).order('published_at',{ascending:false});
  (data||[]).forEach(item=>{const el=document.createElement('article');el.className='work-card';const cover=document.createElement('div');cover.className='work-cover';cover.innerHTML='<div class="cover-placeholder">OBRA<br>ABIERTA</div>';const copy=document.createElement('div');copy.className='work-copy';const genre=document.createElement('span');genre.className='genre';genre.textContent=item.genre||'Historia';const title=document.createElement('h3');title.textContent=item.title;const desc=document.createElement('p');desc.textContent=item.synopsis||`Una obra de ${item.author_name||'autor invitado'}.`;const link=document.createElement('a');link.className='work-link';link.href=`../obra/?slug=${encodeURIComponent(item.slug)}`;link.textContent='INGRESAR A LA OBRA →';copy.append(genre,title,desc,link);el.append(cover,copy);document.getElementById('catalogueGrid').appendChild(el)});
}
loadPublished();
