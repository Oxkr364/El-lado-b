const menu=document.getElementById('coverMenu');
const openers=[document.getElementById('menuButton'),document.getElementById('enterButton')];
const close=document.getElementById('menuClose');
function setMenu(open){menu.classList.toggle('open',open);menu.setAttribute('aria-hidden',String(!open));openers[0].setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':'';if(open)close.focus();}
openers.forEach(button=>button.addEventListener('click',()=>setMenu(true)));
close.addEventListener('click',()=>setMenu(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false)});
