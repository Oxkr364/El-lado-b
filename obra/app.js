import { createPlanBReaderSession, directorPlanB, buildPlanBOutcome } from '../plan-b/agents/plan-b-network.js';
const db = window.supabase.createClient('https://bqrwcmrpzvtjoebmqiji.supabase.co','sb_publishable_XK4dh9Ch_7MebSMO7JJm7Q_8CXu2Qa8');
const $=id=>document.getElementById(id); const slug=new URLSearchParams(location.search).get('slug');
let story=null, session=null, selectedQuestion=null;
const text=(el,value)=>{el.textContent=value??''};
function showError(message){$('readerState').textContent=message;$('readerState').className='reader-state error';}
function renderStory(){
  $('readerState').hidden=true; $('story').hidden=false; text($('storyGenre'),`${story.genre||'Historia'} · ${story.modules?.planB?'Plan B disponible':'lectura abierta'}`); text($('storyTitle'),story.title); text($('storyByline'),`Por ${story.author_name}`); text($('storySynopsis'),story.synopsis);
  const chars=$('characters'); chars.replaceChildren(); (story.characters||[]).forEach(c=>{const card=document.createElement('article');card.className='character';const h=document.createElement('h3');h.textContent=c.name;const p=document.createElement('p');p.textContent=c.description;card.append(h,p);chars.append(card)});
  const pages=$('pages'); pages.replaceChildren(); (story.pages||[]).forEach(p=>{const article=document.createElement('article');article.className='page';const n=document.createElement('span');n.className='page-number';n.textContent=String(p.position).padStart(2,'0');const h=document.createElement('h2');h.textContent=p.title;const body=document.createElement('p');body.textContent=p.body;article.append(n,h,body);pages.append(article)});
  if(story.modules?.planB && story.plan_b_blueprint?.branches?.length){$('planB').hidden=false;text($('planBIntro'),'El canon permanece intacto. Aquí puedes tomar hasta cinco decisiones y observar qué hilo nace de cada una.');session=createPlanBReaderSession(story.plan_b_blueprint);renderPlanB();}
}
function renderPlanB(){
  const stage=$('planBStage'); stage.replaceChildren();
  if(session.status==='completed'){const outcome=buildPlanBOutcome(session);const box=document.createElement('div');box.className='outcome';const h=document.createElement('h3');h.textContent='Tu trayectoria';box.append(h);outcome.sections.forEach(s=>{const p=document.createElement('p');p.textContent=s.text;box.append(p)});const end=document.createElement('p');end.textContent=outcome.epilogue;box.append(end);stage.append(box);return;}
  const branch=session.blueprint.branches[session.current]; const context=document.createElement('div');context.className='branch-context';context.textContent=branch.context;stage.append(context);const list=document.createElement('div');list.className='question-list';branch.questions.forEach(q=>{const b=document.createElement('button');b.className='question'+(selectedQuestion?.id===q.id?' selected':'');b.textContent=q.text;b.onclick=()=>{selectedQuestion=q;renderPlanB()};list.append(b)});stage.append(list);
  if(selectedQuestion){const wrap=document.createElement('div');wrap.className='response-box';const area=document.createElement('textarea');area.placeholder='Escribe una acción o respuesta (8–500 caracteres)…';const submit=document.createElement('button');submit.textContent='CONVERTIR EN ACCIÓN →';const error=document.createElement('div');error.className='error';submit.onclick=()=>{try{session=directorPlanB(session,{branchId:branch.id,questionId:selectedQuestion.id,response:area.value});selectedQuestion=null;renderPlanB()}catch(e){error.textContent=e.message}};wrap.append(area,submit,error);stage.append(wrap)}
  if(session.actions.length){const history=document.createElement('div');session.actions.forEach(item=>{const itemEl=document.createElement('div');itemEl.className='action';itemEl.textContent=item.bridge;history.append(itemEl)});stage.append(history)}
}
async function load(){
  if(!slug)return showError('Esta obra necesita un enlace completo.');
  const {data,error}=await db.from('user_stories').select('id,slug,title,author_name,synopsis,genre,modules,plan_b_blueprint').eq('slug',slug).eq('status','published').eq('visibility','public').not('published_at','is',null).single();
  if(error||!data)return showError('La obra no existe o todavía no está publicada.'); story=data;
  const [pages,characters]=await Promise.all([db.from('user_story_pages').select('position,title,body,layout_data').eq('story_id',story.id).order('position'),db.from('user_story_characters').select('name,description,role,relationship,position').eq('story_id',story.id).order('position')]); if(pages.error||characters.error)return showError('No se pudo cargar el contenido de la obra.'); story.pages=pages.data||[];story.characters=characters.data||[];renderStory();
}
load();
