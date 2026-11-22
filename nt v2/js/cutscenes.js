(function(root){
'use strict';
const finaleLevels=[5,10,15,20];
const languages=['fr','en','es'];
function normalize(manifest,source){
  const directory=new URL('.',source),scenes=new Map();
  for(const scene of manifest?.scenes||[]){
    const level=scene.triggerLevel;
    if(!finaleLevels.includes(level)||typeof scene.image!=='string'||!/^[\w-]+\.webp$/.test(scene.image))continue;
    const lines=scene.dialogue;
    if(!languages.every(code=>Array.isArray(lines?.[code])&&lines[code].length===3&&lines[code].every(line=>typeof line==='string')))continue;
    if(!Number.isFinite(scene.durationMs)||scene.durationMs<6000)continue;
    const durations=[.35,.38,.27].map(fraction=>Math.round(scene.durationMs*fraction));
    durations[2]=scene.durationMs-durations[0]-durations[1];
    const panels=durations.map((duration,index)=>({
      image:new URL(scene.image,directory).href,duration,motion:['push-in','pan-right','pull-out'][index],
      dialogue:Object.fromEntries(languages.map(code=>[code,lines[code][index]]))
    }));
    scenes.set(level,{title:scene.title,panels});
  }
  return scenes;
}
function makePlayer(dialog,{reducedMotion,language,strings,music,volume,enabled,toggle}){
  const title=dialog.querySelector('h2'),picture=dialog.querySelector('.comic-picture');
  const art=dialog.querySelector('.comic-art');
  const text=dialog.querySelector('.comic-dialogue'),skip=dialog.querySelector('[data-comic-skip]');
  const next=dialog.querySelector('[data-comic-next]'),mute=dialog.querySelector('[data-comic-mute]'),replay=dialog.querySelector('[data-comic-replay]');
  let scene,index=0,timer=null,generation=0,done=null,deadline=0,remaining=0,track=null;
  function stopTimer(){if(timer!==null)clearTimeout(timer);timer=null;}
  function syncAudio(){
    mute.textContent=strings(enabled()?'comicMute':'comicUnmute');
    mute.setAttribute('aria-pressed',String(!enabled()));
    if(!track)return;
    track.volume=volume()*.78;
    if(!dialog.open||!enabled()||document.hidden||volume()===0)track.pause();
    else if(track.paused)track.play().catch(()=>{});
  }
  function close(){
    if(!dialog.open)return;
    stopTimer();
    generation++;
    track?.pause();
    track=null;
    dialog.close();
    art.replaceChildren();
    const callback=done;
    done=null;
    callback?.();
  }
  function advance(){
    if(++index>=scene.panels.length){close();return;}
    show();
  }
  function schedule(ms){
    deadline=performance.now()+ms;
    timer=setTimeout(advance,ms);
  }
  function show(){
    stopTimer();
    remaining=0;
    const panel=scene.panels[index],sequence=++generation;
    const image=document.createElement('img');
    image.alt='';
    image.decoding='async';
    image.dataset.motion=panel.motion;
    image.style.setProperty('--shot-duration',panel.duration+'ms');
    art.replaceChildren(image);
    text.textContent=panel.dialogue[language()]||panel.dialogue.en;
    image.onload=()=>{
      if(sequence!==generation||reducedMotion())return;
      if(!document.hidden)schedule(panel.duration);
      else remaining=panel.duration;
    };
    image.onerror=()=>{if(sequence===generation)advance();};
    image.src=panel.image;
  }
  skip.onclick=close;
  next.onclick=advance;
  replay.onclick=()=>{index=0;if(track)track.currentTime=0;show();syncAudio();};
  mute.onclick=()=>{toggle();syncAudio();};
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  document.addEventListener('visibilitychange',()=>{
    if(!dialog.open)return;
    picture.dataset.paused=String(document.hidden);
    syncAudio();
    if(reducedMotion())return;
    if(document.hidden&&timer!==null){
      remaining=Math.max(1,deadline-performance.now());
      stopTimer();
    }else if(!document.hidden&&timer===null&&remaining>0){schedule(remaining);remaining=0;}
  });
  return {
    open(value,onClose){
      if(dialog.open||!value?.panels.length)return false;
      scene=value;index=0;done=onClose;
      title.textContent=value.title||strings('chapterFilm');
      skip.textContent=strings('skip');
      next.textContent=strings('advance');
      replay.textContent=strings('replayFilm');
      picture.dataset.paused='false';
      dialog.showModal();
      if(typeof Audio==='function'){
        track=new Audio(music);
        track.loop=true;
        track.preload='none';
      }
      show();
      syncAudio();
      skip.focus({preventScroll:true});
      return true;
    }
  };
}
const api={finaleLevels,normalize,makePlayer};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ReactorCutscenes=Object.freeze(api);
})(globalThis);
