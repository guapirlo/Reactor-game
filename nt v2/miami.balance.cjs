// Run from the repository root: node "nt v2/miami.balance.cjs" results.json
const {writeFileSync}=require('node:fs');
const output=process.argv[2];
{
  const {createSimulation}=require('./pressure.sim.test.cjs');
  const adventure=require('./js/adventure.js');
  const seeds=[326,7001,94011,30103,1959];
  const policies=['random','largest','objectives','overdrive'];
  const cadence=Number(process.env.REACTOR_CADENCE||1900);
  const world=adventure.WORLDS['miami-1986'];
  function adjacent(x,y){return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&a<7&&b>=0&&b<7);}
  function choose(sim,groups,policy,random){
    if(policy==='random')return groups[Math.floor(random()*groups.length)];
    if(policy==='largest')return groups.at(-1);
    const {run}=sim.missionState(),{pressure,energy,elapsed,overUntil,recoverUntil}=sim.state();
    const largest=groups.at(-1)?.size||0;
    const rank=group=>{
      const cells=sim.findGroup(group.x,group.y,new Set()), hits=new Set();
      let fragments=0,approach=0;
      for(const [x,y] of cells){
        const key=y*7+x;
        if(run.fragments.has(key))fragments++;
        for(const [a,b] of adjacent(x,y)){
          const index=b*7+a;
          const lock=run.blocks.get(index);
          if(lock?.hp&&(!lock.seal||group.size>=5))hits.add(index);
          if(run.fragments.has(index))approach++;
          if(lock?.seal&&group.size<5)approach+=.4;
        }
      }
      const fragmentWeight=run.level.targets.fragments>run.counts.fragments?(pressure<38&&group.size>=3?15:pressure<54&&group.size>=4?6:0):0;
      const lockWeight=run.level.targets.locks>run.counts.locks?(pressure<36&&group.size>=4?8:pressure<56&&group.size>=4?3:0):0;
      const safety=pressure>68?7:3.1;
      const comboWeight=policy==='overdrive'&&elapsed<overUntil?4:0;
      const opensDrive=elapsed>=recoverUntil&&energy+Math.min(22,2+(group.size-2)*2+Math.max(0,group.size-4)*2)>=100;
      const chargeWeight=policy==='overdrive'&&opensDrive&&pressure<44&&group.size>=3&&group.size<largest?largest*2:0;
      return group.size*(safety+comboWeight)+chargeWeight+(pressure>86&&group.size<4?-150:0)+
        hits.size*lockWeight+fragments*fragmentWeight+(lockWeight||fragmentWeight?approach*.17:0);
    };
    return groups.reduce((best,group)=>!best||rank(group)>rank(best)?group:best,undefined);
  }
  function run(level,seed,policy){
    const sim=createSimulation(seed);
    sim.mission(level);
    let randomSeed=(seed+level.number*6997)>>>0;
    const random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/2**32;};
    let moves=0,pressureSum=0,dead=0,manualScore=0,cascadeScore=0,gems=0,overdrives=0;
    for(let i=0;i<330&&sim.state().playing;i++){
      const state=sim.state(), groups=sim.groups();
      if(!groups.length)dead++;
      const group=choose(sim,groups,policy,random);
      if(group&&!state.busy){
        sim.tap(group.x,group.y);
        manualScore+=sim.state().score-state.score;gems+=group.size;moves++;
        pressureSum+=sim.state().pressure;
      }
      const now=sim.state().score;
      sim.advance(cadence);
      cascadeScore+=sim.state().score-now;
      overdrives=sim.missionState().run.counts.overdrive;
    }
    const {run}=sim.missionState(),s=sim.state();
    const win=!s.playing&&adventure.outcome({...run,settled:false},{...s,busy:false})==='win';
    return {level:level.number,seed,policy,win,moves,seconds:s.elapsed/1000,score:s.score,
      stars:win?adventure.stars(run,s.elapsed,s.pressure):0,pressure:moves?pressureSum/moves:0,
      manualScore,cascadeScore,gems,overdrives,endPressure:s.pressure,dead,recoveries:run.recoveries||0};
  }
  module.exports={run,seeds,policies};
  if(require.main===module){
    if(!output)throw new Error('Provide the output JSON path');
    writeFileSync(output,JSON.stringify({cadence,seeds,results:world.levels.flatMap(level=>policies.flatMap(policy=>seeds.map(seed=>run(level,seed,policy))))}));
  }
}
