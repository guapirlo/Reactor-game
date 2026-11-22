(function(root){
'use strict';
const KEY='reactor.profile.v2';
const MODES=['arcade-classic','arcade-miami','adventure-miami'];
const METRICS=['started','finished','score','crystals','milliseconds','overdrives','combo','best'];
const PROGRESSION=[
  ['first-contact','First Contact','games',1,'bronze'],
  ['regular-operator','Regular Operator','games',25,'bronze'],
  ['arcade-veteran','Arcade Veteran','games',100,'silver'],
  ['reactor-addict','Reactor Addict','games',500,'gold'],
  ['rising-star','Rising Star','points',100000,'bronze'],
  ['millionaire-club','Millionaire Club','best',1000000,'gold'],
  ['overdrive-apprentice','Overdrive Apprentice','overdrives',25,'bronze'],
  ['overdrive-master','Overdrive Master','overdrives',250,'gold'],
  ['crystal-collector','Crystal Collector','crystals',10000,'silver'],
  ['chain-specialist','Chain Specialist','combo',10,'silver'],
  ['miami-explorer','Miami Explorer','levels',5,'bronze'],
  ['miami-specialist','Miami Specialist','levels',10,'silver'],
  ['miami-night-rider','Miami Night Rider','levels',15,'silver'],
  ['miami-survivor','Miami Survivor','levels',20,'gold'],
  ['perfect-run','Perfect Run','stars',60,'gold'],
  ['secret-hunter','Secret Hunter','secrets',10,'gold',true],
  ['miami-legend','Miami Legend','final',1,'gold']
];
const record=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const number=value=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:0;
function validNickname(value){
  if(typeof value!=='string')return false;
  const nickname=value.trim().normalize('NFC');
  return /^[\p{L}\p{M}\p{N} _-]{2,20}$/u.test(nickname)&&/[\p{L}\p{N}]/u.test(nickname);
}
function sanitize(raw){
  const data=record(raw), player=record(data.player), campaign=record(data.campaign);
  const levels={};
  for(let i=1;i<=20;i++){
    const item=record(record(campaign.levels)[i]);
    if(number(item.stars)>=1&&number(item.stars)<=3)levels[i]={stars:item.stars,score:number(item.score)};
    else break;
  }
  function ratings(rows){
    const clean={};
    for(const [key,value] of Object.entries(record(rows))){
      if(!/^([1-9]|1[0-9]|20)$/.test(key))continue;
      const item=record(value);
      if(number(item.stars)>=1&&number(item.stars)<=3){
        clean[key]={stars:item.stars,score:number(item.score)};
        for(const flag of ['bonus','coolFinish','noOverdrive'])if(item[flag]===true)clean[key][flag]=true;
      }
    }
    return clean;
  }
  const mastery={};
  for(const [version,rows] of Object.entries(record(campaign.mastery))){
    if(/^miami-hard-[0-9]+\.[0-9]+$/.test(version))mastery[version]=ratings(rows);
  }
  const legacyLevels=ratings(Object.hasOwn(campaign,'legacyLevels')?campaign.legacyLevels:!Object.keys(mastery).length?levels:{});
  function ledger(rawLedger){
    return Object.fromEntries(Object.entries(record(rawLedger)).filter(([id,stamp])=>/^[a-z0-9:-]{1,80}$/.test(id)&&(stamp===null||number(stamp)>0)));
  }
  return {schemaVersion:2,
    player:{nickname:validNickname(player.nickname)?player.nickname.trim().normalize('NFC'):'PLAYER',xp:number(player.xp)},
    settings:{language:['en','fr','es'].includes(record(data.settings).language)?data.settings.language:'en'},
    stats:Object.fromEntries(MODES.map(mode=>[mode,Object.fromEntries(METRICS.map(field=>[field,number(record(record(data.stats)[mode])[field])]))])),
    arcadeBest:number(data.arcadeBest), campaign:{levels,legacyLevels,mastery,secrets:ledger(campaign.secrets)},
    achievements:ledger(data.achievements),
    legacy:ledger(data.legacy)
  };
}
function unlockedLevel(state){return Math.min(20,Object.keys(state.campaign.levels).length+1);}
function totals(state){
  const modes=Object.values(state.stats);
  const sum=field=>modes.reduce((total,row)=>total+row[field],0);
  return {attempts:sum('started'),games:sum('finished'),points:sum('score'),crystals:sum('crystals'),
    time:sum('milliseconds'),overdrives:sum('overdrives'),combo:Math.max(0,...modes.map(row=>row.combo)),
    best:state.arcadeBest,levels:Object.keys(state.campaign.levels).length,
    stars:Object.values(state.campaign.levels).reduce((sum,row)=>sum+row.stars,0),
    secrets:Object.keys(state.campaign.secrets).length,final:Number(!!state.campaign.levels[20])};
}
function playerLevel(xp){return 1+Math.floor((Math.sqrt(1+xp/25)-1)/2);}
function earnedRewards(state){
  const completed=totals(state).levels;
  return ['golden-accent','violet-accent','night-title','legend-frame','miami-arcade'].filter((_,i)=>completed>=Math.min(20,5*(i+1)));
}
function createStore(storage,legacyBest=0,legacyUnlocks={}){
  function read(){
    try{return sanitize(JSON.parse(storage.getItem(KEY)));}catch{return sanitize(null);}
  }
  let memory=read();
  function mutate(fn){
    const result=fn(memory);
    const progress=totals(memory), opened=[];
    const stamp=Date.now();
    for(const [id,,field,target] of PROGRESSION)if(progress[field]>=target&&!Object.hasOwn(memory.achievements,id)){
      memory.achievements[id]=stamp;opened.push(id);
    }
    try{storage.setItem(KEY,JSON.stringify(memory));}catch{}
    return {result,opened};
  }
  mutate(state=>{
    state.arcadeBest=Math.max(state.arcadeBest,number(legacyBest));
    for(const [id,unlocked] of Object.entries(legacyUnlocks))if(unlocked&&!Object.hasOwn(state.legacy,id))state.legacy[id]=null;
    for(const [id,secret] of [['miami:the-penthouse','penthouse'],['miami:jet-ski-chaser','jet'],['miami:pirate-radio','radio']]){
      if(legacyUnlocks[id]&&!Object.hasOwn(state.campaign.secrets,secret))state.campaign.secrets[secret]=null;
    }
  });
  return {
    get state(){return memory;},
    nickname(name){if(!validNickname(name))return false;mutate(s=>{s.player.nickname=name.trim().normalize('NFC');});return true;},
    language(code){if(['en','fr','es'].includes(code))mutate(s=>{s.settings.language=code;});},
    legacy(id){if(!Object.hasOwn(memory.legacy,id))mutate(s=>{s.legacy[id]=Date.now();});},
    start(mode){
      mutate(s=>{s.stats[mode].started++;});
      return {mode,crystals:0,combo:0,overdrives:0,moves:0,committed:false};
    },
    complete(run,{score,elapsed,level=null,stars=0,difficulty=null,feats={}}){
      if(!run||run.committed)return {opened:[],result:false};
      run.committed=true;
      return mutate(state=>{
        const stats=state.stats[run.mode];
        stats.finished++;stats.score+=number(score);stats.milliseconds+=number(Math.round(elapsed));
        stats.crystals+=number(run.crystals);stats.overdrives+=number(run.overdrives);
        stats.combo=Math.max(stats.combo,run.combo);stats.best=Math.max(stats.best,score);
        if(level!==null&&stars&&level<=unlockedLevel(state)){
          const previous=state.campaign.levels[level]||{stars:0,score:0};
          state.campaign.levels[level]={stars:Math.max(previous.stars,stars),score:Math.max(previous.score,score)};
          if(typeof difficulty==='string'&&/^miami-hard-[0-9]+\.[0-9]+$/.test(difficulty)){
            const results=state.campaign.mastery[difficulty]??={};
            const best=results[level]||{stars:0,score:0};
            results[level]={...best,stars:Math.max(best.stars,stars),score:Math.max(best.score,score)};
            for(const flag of ['bonus','coolFinish','noOverdrive'])if(feats[flag]===true)results[level][flag]=true;
          }
          state.player.xp+=(previous.stars?0:110)+Math.max(0,stars-previous.stars)*30;
        }
        if(run.mode.startsWith('arcade-')&&run.moves>0){
          state.arcadeBest=Math.max(state.arcadeBest,score);
          state.player.xp+=25+Math.min(85,Math.floor(run.crystals/3))+Math.min(40,Math.floor(score/2500));
        }
        return true;
      });
    },
    arcadeRecord(score){if(score>memory.arcadeBest)mutate(s=>{s.arcadeBest=number(score);});},
    secret(id){
      if(Object.hasOwn(memory.campaign.secrets,id))return {opened:[],result:false};
      return mutate(state=>{state.campaign.secrets[id]=Date.now();state.player.xp+=35;return true;});
    }
  };
}
const api={createStore,validNickname,totals,unlockedLevel,playerLevel,earnedRewards,PROGRESSION,MODES};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ReactorProfile=Object.freeze(api);
})(globalThis);
