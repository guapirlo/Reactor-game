const assert=require('node:assert/strict');
const {test}=require('node:test');
const adventure=require('./js/adventure.js');
const profile=require('./js/profile.js');
const locale=require('./js/locale.js');
const {createSimulation}=require('./pressure.sim.test.cjs');
const world=adventure.WORLDS['miami-1986'];
function boardPolicy(sim){
  const {run}=sim.missionState(), {pressure}=sim.state();
  const rank=group=>{
    const cells=sim.findGroup(group.x,group.y,new Set());
    const locks=new Set();
    let fragments=0;
    for(const [x,y] of cells){
      if(run.fragments.has(y*7+x))fragments++;
      for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
        if(a>=0&&a<7&&b>=0&&b<7&&run.blocks.get(b*7+a)?.hp)locks.add(b*7+a);
      }
    }
    return group.size*(pressure>75?4:2)+(pressure>88&&group.size<4?-100:0)+
      locks.size*(run.level.targets.locks?12:0)+fragments*(run.level.targets.fragments?20:0);
  };
  return sim.groups().sort((a,b)=>rank(b)-rank(a))[0];
}
function play(sim,level){
  sim.mission(level);
  let moves=0;
  for(let frame=0;frame<420&&sim.state().playing;frame++){
    const group=boardPolicy(sim);
    if(group&&!sim.state().busy&&!(level.number===19&&sim.state().overUntil>0&&sim.state().elapsed>=sim.state().overUntil&&sim.state().elapsed<sim.state().recoverUntil&&sim.state().pressure<35&&sim.missionState().run.counts.overdrive<2)){
      sim.tap(group.x,group.y);moves++;
    }
    sim.advance(level.number===19?850:480);
  }
  const s=sim.state(),{profile:save,run}=sim.missionState();
  return {score:s.score,pressure:s.pressure,time:s.elapsed,moves,goals:run.counts,win:adventure.outcome({...run,settled:false},{...s,busy:false})==='win',stars:save.campaign.levels[level.number]?.stars||0};
}
test('all authored levels validate and can be cleared with multiple seeds',t=>{
  assert.equal(adventure.validate(world),true);
  for(const original of [326,7001,94011]){
    const sim=createSimulation(original);
    for(const level of world.levels){
      const result=play(sim,level);
      t.diagnostic(JSON.stringify({seed:original,level:level.number,...result}));
      assert.equal(result.win,true,'seed '+original+' level '+level.number);
      assert.ok(result.stars>0);
    }
    const save=sim.missionState().profile;
    assert.equal(profile.totals(save).levels,20);
    assert.ok(profile.earnedRewards(save).includes('miami-arcade'));
    assert.ok(save.achievements['miami-legend']);
  }
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
