const assert=require('node:assert/strict');
const {test}=require('node:test');
const adventure=require('./js/adventure.js');
const profile=require('./js/profile.js');
const locale=require('./js/locale.js');
const {createSimulation}=require('./pressure.sim.test.cjs');
const world=adventure.WORLDS['miami-1986'];
const balance=require('./miami.balance.cjs');
function play(sim,level){
  sim.mission(level);
  for(let turn=0;turn<320&&sim.state().playing;turn++){
    const group=sim.groups().at(-1);
    if(group&&!sim.state().busy)sim.tap(group.x,group.y);
    sim.advance(1900);
  }
  const state=sim.state(),{run}=sim.missionState();
  return {win:!state.playing&&adventure.outcome({...run,settled:false},{...state,busy:false})==='win',stars:adventure.stars(run,state.elapsed,state.pressure)};
}
test('every 5.2 mission has a seeded win and a three-star result',()=>{
  assert.equal(adventure.validate(world),true);
  for(const level of world.levels){
    const results=balance.seeds.map(seed=>balance.run(level,seed,'largest'));
    if(!results.some(result=>result.win&&result.stars===3)){
      for(const seed of balance.seeds)results.push(balance.run(level,seed,'overdrive'));
    }
    assert.ok(results.some(result=>result.win),'reachable level '+level.number);
    assert.ok(results.some(result=>result.win&&result.stars===3),'three stars on level '+level.number);
  }
});
test('all twenty missions can be earned in sequence without bypassing campaign progress',()=>{
  const sim=createSimulation(326);
  for(const level of world.levels){
    let wins=false;
    for(let attempt=0;attempt<12&&!wins;attempt++)wins=play(sim,level).win;
    assert.equal(wins,true,'can clear level '+level.number);
    assert.ok(sim.missionState().profile.campaign.mastery[adventure.DIFFICULTY][level.number].stars>0);
  }
  const save=sim.missionState().profile;
  assert.equal(profile.totals(save).levels,20);
  assert.ok(profile.earnedRewards(save).includes('miami-arcade'));
  assert.ok(save.achievements['miami-legend']);
});
test('validation rejects corrupt constraints, coordinates, targets, themes and rewards',()=>{
  const attempt=patch=>{
    const data=structuredClone(world);
    Object.assign(data.levels[0],patch);
    assert.throws(()=>adventure.validate(data));
  };
  attempt({moves:0});attempt({targets:{fragments:1}});attempt({blocks:[{x:7,y:0,hp:1}]});
  attempt({targets:{survival:10},time:9});attempt({theme:'unknown'});attempt({reward:'unknown'});
});
test('settlement gives the accepted last move or last second a chance, while reactor loss has priority',()=>{
  const level={...world.levels[0],targets:{score:50},moves:2,time:1};
  const run=adventure.createRun(level);run.moves=2;
  const state={score:49,elapsed:1001,pressure:40,busy:true};
  assert.equal(adventure.outcome(run,state),null);
  assert.equal(adventure.outcome(run,{...state,score:60,busy:false}),'win');
  assert.equal(adventure.outcome(run,{...state,busy:false}),'moves');
  run.moves=0;
  assert.equal(adventure.outcome(run,{...state,busy:false}),'time');
  assert.equal(adventure.outcome(run,{...state,pressure:100}),'reactor');
  run.settled=true;
  assert.equal(adventure.outcome(run,{...state,pressure:100}),null);
});
test('actual Scene timeout freezes while hidden and does not unlock a level',()=>{
  const sim=createSimulation(123);
  sim.mission({...world.levels[0],time:1});
  sim.hidden(true);sim.advance(2000);
  assert.equal(sim.state().elapsed,0);
  sim.hidden(false);sim.advance(1050);
  assert.equal(sim.state().playing,false);
  assert.deepEqual(Object.keys(sim.missionState().profile.campaign.levels),[]);
});
test('reinforced locks take distinct waves, fragments use their socket, and gravity respects blocking separators',()=>{
  const run=adventure.createRun({...world.levels[0],blocks:[{x:0,y:3,hp:2},{x:6,y:1,until:100}],fragments:[[1,4]]});
  adventure.applyClear(run,[[[0,2],[0,4],[1,4]]]);
  assert.equal(run.blocks.get(21).hp,1);
  assert.equal(run.counts.fragments,1);
  const grid=Array.from({length:7},(_,y)=>Array(7).fill(y%4));
  const labels=grid.map(row=>row.map(()=>1));
  grid[6][0]=-1;grid[2][0]=-1;
  const anchor=grid[3][0];
  const moved=adventure.settle(run,grid,labels,new Set([0]),()=>0);
  assert.equal(grid[3][0],anchor);
  assert.ok(moved.every(([,end,start])=>(end<3)===(start<3)));
  adventure.applyClear(run,[[[0,4]]]);
  assert.equal(run.counts.locks,1);
  assert.equal(adventure.expire(run,100),true);
  assert.equal(run.blocks.size,0);
});
test('legacy migration, nickname validation, replay stars, XP idempotence and finished sessions',()=>{
  const map=new Map([[ 'reactor.profile.v2','corrupt' ]]);
  const storage={getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value)};
  const store=profile.createStore(storage,82000,{'miami:pirate-radio':true});
  assert.equal(store.nickname('<svg>'),false);
  assert.equal(store.nickname('Étoile Ñ'),true);
  store.language('es');
  assert.equal(store.state.arcadeBest,82000);
  assert.equal(store.state.legacy['miami:pirate-radio'],null);
  assert.equal(profile.totals(store.state).attempts,0);
  const aborted=store.start('arcade-classic');
  aborted.moves=1;
  assert.equal(store.state.player.xp,0);
  const game=store.start('adventure-miami');
  const first=store.complete(game,{score:3000,elapsed:2000,level:1,stars:3});
  assert.deepEqual(first.opened,['first-contact']);
  const xp=store.state.player.xp;
  assert.equal(store.complete(game,{score:3000,elapsed:2000,level:1,stars:3}).result,false);
  const replay=store.start('adventure-miami');
  assert.deepEqual(store.complete(replay,{score:2900,elapsed:2500,level:1,stars:1}).opened,[]);
  assert.equal(store.state.campaign.levels[1].stars,3);
  assert.equal(store.state.player.xp,xp);
  assert.equal(profile.unlockedLevel(store.state),2);
  const newStore=profile.createStore(storage,500);
  assert.equal(newStore.state.player.nickname,'Étoile Ñ');
  assert.equal(newStore.state.settings.language,'es');
  assert.equal(newStore.state.arcadeBest,82000);
  assert.equal(profile.totals(newStore.state).attempts,3);
  assert.equal(profile.totals(newStore.state).games,2);
});
test('configuration skips missing future tracks and localized copy has fallback',()=>{
  assert.equal(adventure.createRun(world.levels[5]).music,world.fallback);
  assert.equal(adventure.createRun(world.levels[10]).music,world.fallback);
  assert.equal(locale.text('goalScore','en',{n:25}),'Reach 25 points');
  assert.equal(locale.text('goalScore','fr',{n:25}),'Atteindre 25 points');
  assert.equal(locale.text('goalScore','es',{n:25}),'Alcanza 25 puntos');
  assert.equal(locale.text('language','xx'),'Language');
});


test('last accepted tap wins after settlement with no moves or decision time left',()=>{
  const level={...world.levels[0],targets:{score:10},moves:1,time:1};
  const sim=createSimulation(78);
  sim.mission(level);
  sim.advance(975);
  const group=sim.groups().at(-1);
  sim.tap(group.x,group.y);
  assert.equal(sim.missionState().run.moves,1);
  assert.equal(sim.state().busy,true);
  sim.advance(625);
  assert.equal(sim.state().playing,false);
  assert.ok(sim.missionState().profile.campaign.levels[1].stars>=1);
  assert.equal(sim.state().best,0,'Adventure score must not replace the Arcade record');
});
test('blocked crystals and invalid taps do not consume moves; timed animation does not consume decision time',()=>{
  const sim=createSimulation(800);
  sim.mission({...world.levels[5],moves:10,time:40});
  const lock=world.levels[5].blocks[0];
  assert.equal(sim.findGroup(lock.x,lock.y,new Set()).length,0);
  sim.tap(lock.x,lock.y);
  assert.equal(sim.missionState().run.moves,0);
  const group=sim.groups().at(-1);
  sim.tap(group.x,group.y);
  sim.advance(75);
  assert.equal(sim.missionState().run.animationMs,75);
  assert.equal(adventure.timerUsed(sim.missionState().run,sim.state().elapsed),0);
  sim.changePressure(100);
  assert.equal(sim.state().playing,false);
  assert.equal(Object.keys(sim.missionState().profile.campaign.levels).length,0);
});


test('hard seals ignore small manual groups and reinforced locks require four separate waves',()=>{
  const run=adventure.createRun({...world.levels[14],blocks:[{x:1,y:1,hp:2,seal:true},{x:4,y:3,hp:4}],fragments:[]});
  adventure.applyClear(run,[[[1,0],[2,0]]]);
  assert.equal(run.blocks.get(8).hp,2);
  adventure.applyClear(run,[[[1,0],[2,0],[3,0],[4,0],[5,0]]]);
  assert.equal(run.blocks.get(8).hp,1);
  adventure.applyClear(run,[[[1,0],[2,0]]],true);
  assert.equal(run.counts.locks,1);
  for(let i=0;i<3;i++)adventure.applyClear(run,[[[4,2],[5,3]]]);
  assert.equal(run.blocks.get(25).hp,1);
  adventure.applyClear(run,[[[4,2],[5,3]]]);
  assert.equal(run.counts.locks,2);
});
test('legacy stars and rewards remain independent of versioned mastery',()=>{
  const mem=new Map([['reactor.profile.v2',JSON.stringify({player:{xp:123},campaign:{levels:{1:{stars:3,score:4500}}}})]]);
  const storage={getItem:key=>mem.get(key),setItem:(key,value)=>mem.set(key,value)};
  const store=profile.createStore(storage);
  const run=store.start('adventure-miami');
  store.complete(run,{level:1,score:22000,elapsed:65000,stars:1,difficulty:adventure.DIFFICULTY});
  assert.equal(store.state.campaign.levels[1].stars,3);
  assert.deepEqual(store.state.campaign.legacyLevels[1],{stars:3,score:4500});
  assert.deepEqual(store.state.campaign.mastery[adventure.DIFFICULTY][1],{stars:1,score:22000});
  assert.equal(store.state.player.xp,123);
  assert.equal(profile.createStore(storage).state.campaign.mastery[adventure.DIFFICULTY][1].stars,1);
});
