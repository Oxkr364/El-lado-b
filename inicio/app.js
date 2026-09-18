const work={title:'El Lado B',genre:'Memoria',description:'Una obra sobre lo que pudo haber sido. Entra por la portada y recorre la historia a tu propio ritmo.',cover:'../assets/el-lado-b-cover.webp',href:'../canon/'};
const card=document.createElement('article');
card.className='work-card';
card.innerHTML=`<div class="work-cover"><img src="${work.cover}" alt="Portada de ${work.title}" loading="lazy"></div><div class="work-copy"><span class="genre">${work.genre}</span><h3>${work.title}</h3><p>${work.description}</p><a class="work-link" href="${work.href}">INGRESAR A LA OBRA →</a></div>`;
document.getElementById('catalogueGrid').appendChild(card);
