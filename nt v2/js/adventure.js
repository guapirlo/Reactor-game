(function(root){
'use strict';
const WIDTH=7;
const CHAPTERS=[
  {name:'Golden Hour',theme:'golden',reward:'golden-accent'},
  {name:'Violet Hour',theme:'violet',reward:'violet-accent'},
  {name:'Neon Nights',theme:'neon',reward:'night-title'},
  {name:'Miami After Dark',theme:'midnight',reward:'legend-frame'}
];
const DIFFICULTY='miami-hard-5.3';
const positions=[[1,5],[3,5],[5,5],[1,2],[3,2],[5,2],[2,0],[4,4]];
const fragments=[[0,6],[2,6],[4,6],[6,6],[3,3]];
const row=(title,targets,{moves=null,time=null,locks='',items=0,storm=false}={})=>({title,targets,moves,time,locks,items,storm});
const LEVELS=[
  row('Welcome to Miami',{score:22000}),
  row('Ocean Drive',{score:27000,combos:15}),
  row('Palm Beach Fever',{score:28000},{moves:66}),
  row('Sunset Boulevard',{score:33000,combos:22,pressureMax:65}),
  row('The Golden Hour',{score:38000,overdrive:2,grandGroups:1},{moves:92}),
  row('Purple Haze',{locks:4,score:32000},{locks:'SSSS'}),
  row('Collins Avenue',{score:47000},{moves:96}),
  row('Neon Boulevard',{locks:6,score:49000},{moves:116,locks:'SSSSSR'}),
  row('Vice City Lights',{score:53000,waves:8},{time:169}),
  row('Midnight Calling',{fragments:4,score:57000,locks:4},{moves:118,time:216,locks:'SSSR',items:4}),
  row('After Sunset',{fragments:5,score:52000},{items:5}),
  row('Electric Paradise',{score:68000,grandGroups:2},{moves:142}),
  row('South Beach Underground',{locks:6,fragments:3,score:66000,waves:10},{moves:148,locks:'RRRSSS',items:3}),
  row('Neon Overload',{overdrive:3,score:74000},{time:242}),
  row('Miami Heat',{score:83000,locks:7,waves:15},{moves:175,locks:'SSSRRRX'}),
  row('The Last Drive',{score:78000},{moves:160}),
  row('Nightfall Protocol',{fragments:5,locks:8,score:98000},{moves:202,locks:'SSRRRSXX',items:5}),
  row('Electric Storm',{score:103000,pressureMax:64,waves:15},{time:296,storm:true}),
  row('The Final Overdrive',{overdrive:4,score:110000,pressureMax:63},{moves:212,storm:true}),
  row('Miami 1986: LEGEND',{score:124000,fragments:5,locks:8,overdrive:4,pressureMax:65,grandGroups:3},
    {moves:230,time:440,locks:'SRXRRSSX',items:5,storm:true})
].map((config,index)=>{
  const chapter=Math.floor(index/5);
  const {locks,items,storm,title,targets,moves,time}=config;
  return {
    id:'miami-'+String(index+1).padStart(2,'0'),number:index+1,chapter,title,targets,moves,time,difficulty:DIFFICULTY,
    family:moves!==null?(time!==null||Object.keys(targets).length>1?'D':'B'):time!==null?'C':'A',
    theme:CHAPTERS[chapter].theme,
    signature:({5:'THE NEW KID',10:'NO RESPECT',15:'BAD BUSINESS',20:'KING OF MIAMI'})[index+1],
    impulses:index>=7&&locks.includes('R')?(chapter>=2?[8,12]:[8]):[],
    bonus:chapter===0?{key:'grandGroups',goal:2}:chapter===1?{key:'waves',goal:10}:chapter===2?{key:'pressureMax',goal:35}:{key:'grandGroups',goal:5},
    blocks:[...locks].map((type,i)=>({x:positions[i][0],y:positions[i][1],hp:type==='R'?4:2,seal:type==='X',kind:type}))
      .concat(storm?[{x:6,y:0,until:3500}]:[]),
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
const OBJECTIVES=['score','combos','fragments','locks','overdrive','survival','pressureMax','waves','grandGroups'];
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
    if(level.blocks.some(({hp,until,seal})=>until?(!Number.isFinite(until)||until<1):![1,2,4].includes(hp)||(seal&&hp!==2)))invalid('invalid obstacle durability');
    if(level.targets.pressureMax>99)invalid('pressure target exceeds reactor capacity');
    if((level.targets.fragments||0)>level.fragments.length||(level.targets.locks||0)>level.blocks.filter(x=>x.hp).length)invalid('unreachable item target');
    if(level.time!==null&&(level.targets.survival||0)>level.time)invalid('survival exceeds deadline');
    if(level.time!==null&&((level.targets.overdrive||0)-1)*21>=level.time)invalid('Overdrive recovery exceeds deadline');
    if(level.moves!==null&&(level.targets.combos||0)>=level.moves)invalid('combo count exceeds possible moves');
    const fixed=new Set(level.blocks.filter(x=>x.hp).map(({x,y})=>y*WIDTH+x));
    const reachable=(x,y)=>{
      const cells=new Set(),queue=[[x,y]];
      while(queue.length){
        const [a,b]=queue.pop(),key=b*WIDTH+a;
        if(a<0||b<0||a>=WIDTH||b>=WIDTH||fixed.has(key)||cells.has(key))continue;
        cells.add(key);
        queue.push([a-1,b],[a+1,b],[a,b-1],[a,b+1]);
      }
      return cells.size;
    };
    for(const {x,y,seal} of level.blocks.filter(x=>x.hp)){
      if(![[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([a,b])=>reachable(a,b)>=(seal?5:2)))invalid('no reachable qualifying group by lock');
    }
    for(const [x,y] of level.fragments)if(reachable(x,y)<2)invalid('fragment cannot join a group');
  }
  return true;
}
function createRun(level,world=WORLDS['miami-1986']){
  return {level,blocks:new Map(level.blocks.map(item=>[item.y*WIDTH+item.x,{...item}])),
    fragments:new Set(level.fragments.map(([x,y])=>y*WIDTH+x)),counts:{combos:0,fragments:0,locks:0,overdrive:0,waves:0,grandGroups:0},
    moves:0,manualGems:0,recoveries:0,animationMs:0,settled:false,music:world.music[level.chapter]||world.fallback,fallback:world.fallback};
}
function adjacentLocks(run,group,cascade=false){
  const hits=new Set();
  for(const [x,y] of group)for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
    if(a<0||a>=WIDTH||b<0||b>=WIDTH)continue;
    const index=b*WIDTH+a,lock=run.blocks.get(index);
    if(lock?.hp&&(!lock.seal||cascade||group.length>=5))hits.add(index);
  }
  return hits;
}
function pulseTargets(run,group){
  const limit=(run.level.impulses||[]).filter(size=>group.length>=size).length;
  if(!limit)return [];
  return [...adjacentLocks(run,group)].filter(key=>{
    const lock=run.blocks.get(key);
    return lock.hp>1&&(lock.kind==='R'||lock.seal);
  }).sort((a,b)=>run.blocks.get(b).hp-run.blocks.get(a).hp||a-b).slice(0,limit);
}
function applyClear(run,groups,cascade=false){
  const hits=new Set(), extra=new Set();
  if(cascade)run.counts.waves++;
  for(const group of groups){
    for(const [x,y] of group)if(run.fragments.delete(y*WIDTH+x))run.counts.fragments++;
    for(const key of adjacentLocks(run,group,cascade))hits.add(key);
    if(!cascade){
      if(group.length>=8)run.counts.grandGroups++;
      for(const key of pulseTargets(run,group))extra.add(key);
    }
  }
  return [...hits].map(key=>{
    const lock=run.blocks.get(key);
    const amount=Math.min(lock.hp,extra.has(key)?2:1);
    lock.hp-=amount;
    if(lock.hp===0){run.blocks.delete(key);run.counts.locks++;}
    return {key,amount,hp:lock.hp,seal:lock.seal};
  });
}
function bonusMet(run,score,elapsed,pressure){
  const bonus=run.level.bonus;
  if(!bonus)return false;
  const amount=value(run,bonus.key,score,elapsed,pressure);
  return bonus.key==='pressureMax'?pressure<=bonus.goal:amount>=bonus.goal;
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
  run.recoveries++;
  return true;
}
function value(run,key,score,elapsed,pressure){
  if(key==='pressureMax')return Math.ceil(pressure);
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
  if(Object.entries(targets).every(([key,target])=>key==='pressureMax'?pressure<=target:value(run,key,score,effectiveTime)>=target))return 'win';
  if(moves!==null&&run.moves>=moves)return 'moves';
  if(time!==null&&timerUsed(run,elapsed)>=time*1000)return 'time';
  return null;
}
function masteryGroup(level){
  if(level.number===8)return 4.35;
  return Number(([4.95,4.60,4.55,4.35][level.chapter]-(level.targets.locks||level.targets.fragments?0.18:0)).toFixed(2));
}
function stars(run,elapsed,pressure){
  const {moves,time}=run.level;
  if(run.level.difficulty!==DIFFICULTY){
    const margins=[1-pressure/100];
    if(moves!==null)margins.push(1-run.moves/moves);
    if(time!==null)margins.push(1-timerUsed(run,elapsed)/(time*1000));
    return 1+Number(margins.every(x=>x>=.18))+Number(margins.every(x=>x>=.33));
  }
  const mean=run.moves?run.manualGems/run.moves:0;
  const qualifies=(heat,margin,group)=>{
    return pressure<=heat&&mean>=group&&(moves===null||run.moves<=moves*(1-margin))&&
      (time===null||timerUsed(run,elapsed)<=time*1000*(1-margin));
  };
  return 1+Number(qualifies(70,.12,3.90))+Number(qualifies(44,.26,masteryGroup(run.level)));
}
validate(WORLDS['miami-1986']);
const api={DIFFICULTY,WORLDS,validate,createRun,applyClear,pulseTargets,bonusMet,expire,settle,prepare,recovery,value,timerUsed,outcome,stars,masteryGroup};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ReactorAdventure=Object.freeze(api);
})(globalThis);
