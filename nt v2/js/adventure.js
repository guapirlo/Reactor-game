(function(root){
'use strict';
const WIDTH=7;
const CHAPTERS=[
  {name:'Golden Hour',theme:'golden',reward:'golden-accent'},
  {name:'Violet Hour',theme:'violet',reward:'violet-accent'},
  {name:'Neon Nights',theme:'neon',reward:'night-title'},
  {name:'Miami After Dark',theme:'midnight',reward:'legend-frame'}
];
const positions=[[1,5],[3,5],[5,5],[1,2],[3,2],[5,2]];
const fragments=[[0,6],[2,6],[4,6],[6,6],[3,3]];
const row=(title,targets,moves=null,time=null,locks=0,items=0,reinforced=false,storm=false)=>({title,targets,moves,time,locks,items,reinforced,storm});
const LEVELS=[
  row('Welcome to Miami',{score:2500}),
  row('Ocean Drive',{score:5000}),
  row('Palm Beach Fever',{score:6000},30),
  row('Sunset Boulevard',{score:7500,combos:3}),
  row('The Golden Hour',{score:10000},35),
  row('Purple Haze',{locks:4},null,null,4),
  row('Collins Avenue',{score:10500},34),
  row('Neon Boulevard',{locks:6,score:8000},35,null,6),
  row('Vice City Lights',{score:12000},null,150),
  row('Midnight Calling',{fragments:3},35,null,0,3),
  row('After Sunset',{fragments:4},null,null,0,4),
  row('Electric Paradise',{score:18000},35),
  row('South Beach Underground',{locks:4,fragments:2},44,null,4,2,true),
  row('Neon Overload',{overdrive:1,score:15000},null,180),
  row('Miami Heat',{score:25000,locks:6},45,null,6),
  row('The Last Drive',{score:30000},40),
  row('Nightfall Protocol',{fragments:5,locks:6},48,null,6,5),
  row('Electric Storm',{score:35000},null,210,0,0,false,true),
  row('The Final Overdrive',{overdrive:2,score:40000},70,null,0,0,false,true),
  row('Miami 1986: LEGEND',{score:45000,fragments:5,locks:6,overdrive:1},null,null,6,5,true,true)
].map((config,index)=>{
  const chapter=Math.floor(index/5);
  const {locks,items,reinforced,storm,title,targets,moves,time}=config;
  return {
    id:'miami-'+String(index+1).padStart(2,'0'),number:index+1,chapter,title,targets,moves,time,
    family:moves!==null?(Object.keys(targets).length>1||items?'D':'B'):time!==null?'C':index===19?'D':'A',
    theme:CHAPTERS[chapter].theme,
    blocks:positions.slice(0,locks).map(([x,y])=>({x,y,hp:reinforced?2:1})).concat(storm?[{x:6,y:0,until:3500}]:[]),
    fragments:fragments.slice(0,items),
    reward:(index+1)%5===0?CHAPTERS[chapter].reward:null
  };
});
const REWARDS=['golden-accent','violet-accent','night-title','legend-frame','miami-arcade'];
const WORLDS={
  'miami-1986':{name:'Miami 1986',skin:'miami',available:true,chapters:CHAPTERS,levels:LEVELS,
    music:['./audio/miami-reactor.mp3',null,null,'./audio/miami-reactor.mp3'],
    fallback:'./audio/miami-reactor.mp3',rewards:REWARDS},
  ouagadougou:{name:'Ouagadougou',available:false}
};
const OBJECTIVES=['score','combos','fragments','locks','overdrive','survival'];
function validate(world){
  const ids=new Set();
  for(const [index,level] of world.levels.entries()){
    const invalid=message=>{throw new Error(level.id+': '+message)};
    if(!level.id||ids.has(level.id)||level.number!==index+1)invalid('invalid ID or sequence');
    ids.add(level.id);
    if(world.chapters[level.chapter]?.theme!==level.theme)invalid('unknown theme');
    if(level.reward&&!world.rewards.includes(level.reward))invalid('unknown reward');
    if(!Object.keys(level.targets).length||Object.entries(level.targets).some(([key,value])=>!OBJECTIVES.includes(key)||!Number.isInteger(value)||value<1))invalid('invalid objective');
    for(const limit of [level.moves,level.time])if(limit!==null&&(!Number.isInteger(limit)||limit<1))invalid('invalid constraint');
    const coordinates=[...level.blocks.map(({x,y})=>[x,y]),...level.fragments];
    if(coordinates.some(pair=>pair.length!==2||pair.some(v=>!Number.isInteger(v)||v<0||v>=WIDTH))||new Set(coordinates.map(String)).size!==coordinates.length)invalid('invalid or overlapping coordinates');
    if(level.blocks.some(({hp,until})=>until?(!Number.isFinite(until)||until<1):hp!==1&&hp!==2))invalid('invalid obstacle durability');
    if((level.targets.fragments||0)>level.fragments.length||(level.targets.locks||0)>level.blocks.filter(x=>x.hp).length)invalid('unreachable item target');
    if(level.time!==null&&(level.targets.survival||0)>level.time)invalid('survival exceeds deadline');
    if(level.time!==null&&((level.targets.overdrive||0)-1)*21>=level.time)invalid('Overdrive recovery exceeds deadline');
    if(level.moves!==null&&(level.targets.combos||0)>=level.moves)invalid('combo count exceeds possible moves');
    const fixed=new Set(level.blocks.filter(x=>x.hp).map(({x,y})=>y*WIDTH+x));
    for(const block of level.blocks.filter(x=>x.hp)){
      const {x,y}=block;
      if(![[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([a,b])=>a>=0&&a<WIDTH&&b>=0&&b<WIDTH&&!fixed.has(b*WIDTH+a)))invalid('lock lacks an accessible neighbor');
    }
  }
  return true;
}
function createRun(level,world=WORLDS['miami-1986']){
  return {level,blocks:new Map(level.blocks.map(item=>[item.y*WIDTH+item.x,{...item}])),
    fragments:new Set(level.fragments.map(([x,y])=>y*WIDTH+x)),counts:{combos:0,fragments:0,locks:0,overdrive:0},
    moves:0,animationMs:0,settled:false,music:world.music[level.chapter]||world.fallback,fallback:world.fallback};
}
function applyClear(run,groups){
  const hit=new Set();
  for(const group of groups)for(const [x,y] of group){
    if(run.fragments.delete(y*WIDTH+x))run.counts.fragments++;
    for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      if(a<0||a>=WIDTH||b<0||b>=WIDTH)continue;
      const index=b*WIDTH+a;
      if(run.blocks.get(index)?.hp)hit.add(index);
    }
  }
  for(const index of hit){
    const lock=run.blocks.get(index);
    if(--lock.hp===0){run.blocks.delete(index);run.counts.locks++;}
  }
}
function expire(run,elapsed){
  let dirty=false;
  for(const [key,block] of run.blocks)if(block.until&&elapsed>=block.until){run.blocks.delete(key);dirty=true;}
  return dirty;
}
function settle(run,grid,labels,columns,nextGem){
  const moved=[];
  for(const x of columns){
    let bottom=WIDTH-1;
    for(let boundary=WIDTH-1;boundary>=-1;boundary--){
      if(boundary>=0&&!run.blocks.has(boundary*WIDTH+x))continue;
      let dest=bottom;
      for(let y=bottom;y>boundary;y--){
        if(grid[y][x]<0)continue;
        grid[dest][x]=grid[y][x];labels[dest][x]=labels[y][x];
        if(dest!==y)moved.push([x,dest,y]);
        dest--;
      }
      const first=boundary+1;
      for(let y=dest;y>=first;y--){
        grid[y][x]=nextGem();labels[y][x]=0;
        moved.push([x,y,Math.max(first,y-dest+first-1)]);
      }
      bottom=boundary-1;
    }
  }
  return moved;
}
function prepare(run,grid){
  // Seed approaches to sockets and locks. Refills still use the shared random generator.
  for(const index of run.fragments){
    const x=index%WIDTH,y=Math.floor(index/WIDTH);
    const neighbor=[[x,y-1],[x+1,y],[x-1,y],[x,y+1]].find(([a,b])=>
      a>=0&&a<WIDTH&&b>=0&&b<WIDTH&&!run.blocks.has(b*WIDTH+a)&&!run.fragments.has(b*WIDTH+a));
    if(neighbor)grid[neighbor[1]][neighbor[0]]=grid[y][x];
  }
  if(run.level.number===20){
    // Two deliberately generous openings leave enough headroom for the reinforced locks.
    for(let y=0;y<3;y++)for(let x=0;x<WIDTH;x++){
      if(!run.blocks.has(y*WIDTH+x))grid[y][x]=grid[0][x<4?0:4];
    }
  }
  recovery(run,grid);
}
function recovery(run,grid){
  let pair;
  for(let y=0;y<WIDTH;y++)for(let x=0;x<WIDTH;x++){
    if(run.blocks.has(y*WIDTH+x))continue;
    for(const [a,b] of [[x+1,y],[x,y+1]]){
      if(a>=WIDTH||b>=WIDTH||run.blocks.has(b*WIDTH+a))continue;
      if(grid[y][x]===grid[b][a])return false;
      const nearObjective=(cx,cy)=>run.fragments.has(cy*WIDTH+cx)||
        [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]].some(([dx,dy])=>dx>=0&&dx<WIDTH&&dy>=0&&dy<WIDTH&&run.blocks.get(dy*WIDTH+dx)?.hp);
      const priority=Number(nearObjective(x,y))+Number(nearObjective(a,b));
      if(!pair||priority>pair.priority)pair={x,y,a,b,priority};
    }
  }
  if(!pair)return false;
  grid[pair.b][pair.a]=grid[pair.y][pair.x];
  return true;
}
function value(run,key,score,elapsed){
  if(key==='score')return score;
  if(key==='survival')return Math.floor(elapsed/1000);
  return run.counts[key]||0;
}
function timerUsed(run,elapsed){return Math.max(0,elapsed-run.animationMs);}
function outcome(run,{score,elapsed,pressure,busy}){
  if(run.settled)return null;
  if(pressure>=100)return 'reactor';
  if(busy)return null;
  const {moves,time,targets}=run.level;
  const effectiveTime=time===null?elapsed:Math.min(elapsed,time*1000);
  if(Object.entries(targets).every(([key,target])=>value(run,key,score,effectiveTime)>=target))return 'win';
  if(moves!==null&&run.moves>=moves)return 'moves';
  if(time!==null&&timerUsed(run,elapsed)>=time*1000)return 'time';
  return null;
}
function stars(run,elapsed,pressure){
  const {moves,time}=run.level;
  const margins=[1-pressure/100];
  if(moves!==null)margins.push(1-run.moves/moves);
  if(time!==null)margins.push(1-timerUsed(run,elapsed)/(time*1000));
  return 1+Number(margins.every(x=>x>=.18))+Number(margins.every(x=>x>=.33));
}
validate(WORLDS['miami-1986']);
const api={WORLDS,validate,createRun,applyClear,expire,settle,prepare,recovery,value,timerUsed,outcome,stars};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ReactorAdventure=Object.freeze(api);
})(globalThis);
