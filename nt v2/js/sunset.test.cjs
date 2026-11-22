const assert=require('node:assert/strict');
const {test}=require('node:test');
const {timeline,DURATION}=require('./sunset.js');
const {missionName}=require('./locale.js');

test('Ocean Drive has a distinct entrance, golden hour, reveal and final frame',()=>{
  assert.equal(DURATION,23000);
  assert.ok(timeline(0).carX<0);
  assert.ok(timeline(5000).carX>380);
  assert.ok(timeline(11000).evening>timeline(5000).evening);
  assert.equal(timeline(11999).congrats,false);
  assert.equal(timeline(12000).congrats,true);
  assert.ok(timeline(14800).wide>timeline(12000).wide);
  assert.equal(timeline(16999).reward,false);
  assert.equal(timeline(17000).reward,true);
  assert.equal(timeline(22999).finished,false);
  assert.equal(timeline(23000).finished,true);
  assert.equal(timeline(40000).distance,timeline(DURATION).distance);
});
test('localized mission names preserve the English fallback',()=>{
  const mission={number:1,title:'Welcome to Miami'};
  assert.equal(missionName(mission,'en'),mission.title);
  assert.equal(missionName(mission,'fr'),'Bienvenue à Miami');
  assert.equal(missionName(mission,'es'),'Bienvenido a Miami');
});
