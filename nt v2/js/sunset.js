(function(root){
'use strict';
const WIDTH=960, HEIGHT=440, DURATION=23000;
const clamp=(x,lo=0,hi=1)=>Math.min(hi,Math.max(lo,x));
const ease=value=>{
  const t=clamp(value);
  return t*t*(3-2*t);
};
function timeline(ms){
  const time=clamp(ms,0,DURATION);
  return {
    time,evening:ease((time-4200)/11400),wide:ease((time-11500)/3300),
    carX:-160+570*ease(time/5200),distance:time*.118,
    congrats:time>=12000&&time<17000,reward:time>=17000,finished:time>=DURATION
  };
}
function polygon(ctx,color,points){
  ctx.fillStyle=color;
  ctx.beginPath();
  for(const [i,[x,y]] of points.entries())i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  ctx.closePath();ctx.fill();
}
function lamp(ctx,x,y,w,h,color){
  ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
}
function repeatTile(width,draw){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=HEIGHT;
  draw(canvas.getContext('2d'),width);
  return canvas;
}
function renderStrip(ctx,tile,distance){
  const phase=((distance%tile.width)+tile.width)%tile.width;
  for(let x=-phase;x<WIDTH;x+=tile.width)ctx.drawImage(tile,x,0);
}
function drawSkyline(ctx){
  for(let i=0;i<24;i++){
    const x=i*29,h=9+(i*73%63),y=243-h;
    lamp(ctx,x,y,17+i%4*3,h,'#503669');
    if(i%4===1)lamp(ctx,x+8,y-7,2,7,'#96506d');
    for(let j=0;j<5;j++)lamp(ctx,x+4+(j%2)*8,y+5+Math.floor(j/2)*6,2,2,'#deb692');
  }
}
const fronts=[
  [22,74,133,144,'#dd8fa9','#ffd1af'],[185,89,125,129,'#9e75a5','#e9b2cc'],
  [357,67,141,151,'#bd8db0','#ffc5aa'],[542,91,118,127,'#9078a9','#ed9fd8']
];
function drawHotels(ctx,lit){
  for(const [x,y,w,h,facade,trim] of fronts){
    if(lit){
      lamp(ctx,x-7,y+34,w+14,3,'#ff63ce');
      lamp(ctx,x+3,y+63,w-5,2,'#65f4ff');
      for(let j=0;j<8;j++)lamp(ctx,x+13+j*14,y+79,6,11,j%3===0?'#78d9f7':'#ffc389');
      continue;
    }
    lamp(ctx,x,y,w,h,facade);
    polygon(ctx,'#6a477e',[[x+w,y],[x+w+15,y+12],[x+w+15,220],[x+w,218]]);
    lamp(ctx,x+w*.32,y-13,w*.33,20,facade);
    lamp(ctx,x+2,y+9,w-4,3,trim);
    lamp(ctx,x+6,y+25,w-12,5,'#7b597c');
    for(let row=0;row<3;row++)for(let j=0;j<8;j++){
      const wx=x+13+j*14,wy=y+48+row*25;
      lamp(ctx,wx,wy,6,11,'#6b4f79');
      lamp(ctx,wx-2,wy+11,10,2,trim);
    }
    lamp(ctx,x-7,y+32,w+14,7,trim);
    lamp(ctx,x+15,204,w-30,14,'#563d6f');
  }
}
function palm(ctx,x,y,size){
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);
  ctx.strokeStyle='#342143';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-24,-63,-12,-123);ctx.stroke();
  for(let i=0;i<7;i++){
    const angle=(i-3)*.66;
    ctx.save();ctx.translate(-12,-121);ctx.rotate(angle);
    polygon(ctx,i%2?'#3b2652':'#272946',[[0,2],[12,-13],[37,-16],[58,-6],[33,-7],[23,-1],[11,1]]);
    ctx.restore();
  }
  ctx.restore();
}
function drawPalms(ctx){
  for(const [x,y,size] of [[28,281,.89],[244,274,.55],[460,285,.97],[684,276,.65]])palm(ctx,x,y,size);
}
function wheel(ctx,x,y,rotation){
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
  for(const [r,color] of [[30,'#170e28'],[23,'#3d3150'],[15,'#c7d2dc'],[10,'#615b80']]){
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<6;i++){
    ctx.rotate(Math.PI/3);lamp(ctx,1,-1,14,2,'#f7d5eb');
  }
  ctx.restore();
}
function drawCar(ctx,x,y,rotation,scale){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ctx.fillStyle='#160f3194';ctx.beginPath();ctx.ellipse(0,29,145,11,0,0,Math.PI*2);ctx.fill();
  wheel(ctx,-78,13,rotation);wheel(ctx,84,13,rotation);
  polygon(ctx,'#5b285e',[[-149,-21],[-118,-38],[40,-42],[101,-29],[134,-25],[150,-13],[147,12],[112,15],[104,-3],[66,-3],[56,16],[-50,16],[-59,-4],[-98,-4],[-106,14],[-142,14]]);
  polygon(ctx,'#ea529d',[[-146,-25],[-118,-38],[4,-43],[44,-42],[101,-29],[135,-26],[148,-15],[143,0],[112,1],[102,-10],[65,-10],[54,2],[-52,2],[-61,-11],[-98,-11],[-110,1],[-143,0]]);
  polygon(ctx,'#ffb3be',[[-141,-24],[-117,-34],[8,-40],[43,-39],[109,-26],[134,-24],[138,-20],[68,-18],[-57,-23]]);
  polygon(ctx,'#352649',[[-79,-35],[-65,-45],[-27,-46],[-13,-36]]);
  polygon(ctx,'#643551',[[-62,-43],[-54,-55],[-42,-55],[-40,-43],[-25,-41],[-25,-35],[-65,-37]]);
  polygon(ctx,'#a7d6e9',[[-7,-40],[32,-68],[43,-66],[16,-40]]);
  polygon(ctx,'#e8b6cc',[[30,-69],[46,-68],[44,-63],[29,-64]]);
  lamp(ctx,-39,-17,63,3,'#ffbad7');lamp(ctx,16,-24,19,2,'#ebd9db');
  lamp(ctx,131,-17,14,5,'#fff0b9');lamp(ctx,-146,-17,12,6,'#ffc1c4');
  lamp(ctx,121,1,27,4,'#e5aec7');lamp(ctx,-145,2,28,4,'#d3a7bf');
  ctx.restore();
}
function createRenderer(canvas){
  const ctx=canvas.getContext('2d',{alpha:false});
  const skyline=repeatTile(696,drawSkyline);
  const hotels=repeatTile(696,c=>drawHotels(c,false));
  const lights=repeatTile(696,c=>drawHotels(c,true));
  const palms=repeatTile(740,drawPalms);
  return frame=>{
    const {evening,wide,distance,carX,time}=frame;
    const sky=ctx.createLinearGradient(0,0,0,300);
    sky.addColorStop(0,'rgb('+[104-51*evening,65-27*evening,124-41*evening].map(Math.round).join(',')+')');
    sky.addColorStop(.62,'#b65089');sky.addColorStop(1,'#ffb182');
    ctx.fillStyle=sky;ctx.fillRect(0,0,WIDTH,HEIGHT);
    const sunY=115+evening*57;
    ctx.fillStyle='#ffb474';ctx.beginPath();ctx.arc(739,sunY,77,0,Math.PI*2);ctx.fill();
    for(let i=0;i<4;i++)lamp(ctx,672+i*4,sunY+40+i*8,134-i*8,2,'#db7583');
    ctx.save();ctx.translate(WIDTH*.04*wide,0);ctx.scale(1-.08*wide,1);
    lamp(ctx,-45,224,1060,67,'#40678c');
    for(let i=0;i<26;i++){
      const x=((i*107-distance*.15)%1050+1050)%1050-45;
      lamp(ctx,x,228+(i*11)%58,7+i%4*5,1,i%3?'#78a3b6':'#ed9fb2');
    }
    for(let i=0;i<3;i++){
      const x=((i*318-distance*.08)%1000+1000)%1000;
      polygon(ctx,'#dac7c5',[[x,269],[x+21,269],[x+15,272],[x+4,273]]);
      polygon(ctx,'#e4bbd1',[[x+11,255],[x+11,269],[x+19,269]]);
    }
    renderStrip(ctx,skyline,distance*.11);
    lamp(ctx,-45,281,1060,27,'#d7928e');
    renderStrip(ctx,hotels,distance*.37);
    ctx.globalAlpha=evening;renderStrip(ctx,lights,distance*.37);ctx.globalAlpha=1;
    renderStrip(ctx,palms,distance*.67);
    lamp(ctx,-45,295,1060,12,'#df9ea8');
    lamp(ctx,-45,307,1060,90,'#38304c');
    lamp(ctx,-45,310,1060,3,'#b08499');
    for(let i=-1;i<13;i++)lamp(ctx,i*84-(distance%84),356,42,3,'#d99d9a');
    lamp(ctx,-45,390,1060,50,'#744e70');
    lamp(ctx,-45,392,1060,2,'#edb9b2');
    ctx.restore();
    drawCar(ctx,carX+wide*35,357+Math.sin(time/190)*1.1,distance*.055,1-.15*wide);
  };
}
function createPlayer(dialog,{music,enabled,volume,reducedMotion,onFrame}){
  const canvas=dialog.querySelector('canvas'),render=createRenderer(canvas);
  let frameId=0,elapsed=0,last=null,lastDraw=-100,track=null;
  function paint(){
    const state=timeline(elapsed);
    render(state);onFrame(state);
    return state;
  }
  function tick(now){
    if(!dialog.open||document.hidden)return;
    if(last!==null)elapsed+=now-last;
    last=now;
    if(now-lastDraw>=30||elapsed>=DURATION){
      lastDraw=now;
      if(paint().finished)return;
    }
    frameId=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frameId);last=null;
    if(!dialog.open||document.hidden){track?.pause();return;}
    if(track&&enabled()&&volume()>0){
      track.volume=volume()*.72;
      if(track.paused)track.play().catch(()=>{});
    }else track?.pause();
    if(elapsed<DURATION)frameId=requestAnimationFrame(tick);
  }
  function start(){
    cancelAnimationFrame(frameId);
    track?.pause();
    track=typeof Audio==='function'?new Audio(music):null;
    if(track){track.loop=true;track.preload='none';}
    elapsed=reducedMotion()?DURATION:0;
    lastDraw=-100;paint();sync();
  }
  function skip(){elapsed=DURATION;cancelAnimationFrame(frameId);paint();}
  function stop(){cancelAnimationFrame(frameId);track?.pause();track=null;}
  document.addEventListener('visibilitychange',sync);
  dialog.addEventListener('close',stop);
  return {start,skip,stop};
}
const api={WIDTH,HEIGHT,DURATION,timeline,createPlayer};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ReactorSunset=Object.freeze(api);
})(globalThis);
