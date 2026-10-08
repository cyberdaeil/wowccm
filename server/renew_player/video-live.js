(()=>{
 'use strict';
 const button=document.getElementById('videoRadio');if(!button)return;
 const defaultURL='https://www.youtube.com/@wowccm/live';let busy=false;
 function display(data){
  const live=data?.live===true&&data?.available===true;
  button.classList.toggle('is-live',live);
  const label=live?'보이는 라디오 · 유튜브 생방송 중':data?.available===true?'보이는 라디오 · 현재 생방송 없음':'보이는 라디오 · 유튜브 라이브 열기';
  button.title=label;button.setAttribute('aria-label',label);button.dataset.live=live?'true':'false';
  button.href=defaultURL;
  if(live){try{const url=new URL(data.url);if(url.protocol==='https:'&&url.hostname==='www.youtube.com'&&url.pathname==='/watch'&&/^[A-Za-z0-9_-]{11}$/.test(url.searchParams.get('v')||''))button.href=url.href;}catch(error){}}
 }
 async function check(){
  if(busy||document.hidden)return;busy=true;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch('/renew/player/video-live.php',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('status');display(await response.json());}
  catch(error){display(null);}finally{clearTimeout(timer);busy=false;}
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
 display(null);check();setInterval(check,60000);
})();
