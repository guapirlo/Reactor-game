const assert=require('node:assert/strict');
const {test}=require('node:test');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {pathToFileURL,fileURLToPath}=require('node:url');
const {normalize,finaleLevels}=require('./cutscenes.js');
const source=pathToFileURL(resolve(__dirname,'../assets/cutscenes/miami/scenes.json'));
const manifest=JSON.parse(readFileSync(source,'utf8'));

test('all chapter finales resolve the supplied art, timings and translated dialogue',()=>{
  const scenes=normalize(manifest,source);
  assert.deepEqual([...scenes.keys()],finaleLevels);
  for(const entry of manifest.scenes){
    const scene=scenes.get(entry.triggerLevel);
    assert.equal(scene.title,entry.title);
    assert.equal(scene.panels.reduce((sum,panel)=>sum+panel.duration,0),entry.durationMs);
    assert.equal(new Set(scene.panels.map(p=>p.motion)).size,3);
    for(const code of ['fr','en','es'])assert.deepEqual(scene.panels.map(p=>p.dialogue[code]),entry.dialogue[code]);
    assert.equal(readFileSync(fileURLToPath(scene.panels[0].image)).subarray(8,12).toString(),'WEBP');
  }
});
test('bad triggers and unsafe or incomplete entries are ignored',()=>{
  for(const patch of [{triggerLevel:21},{image:'../untrusted.webp'},{image:'https://example.test/panel.webp'},{dialogue:{en:[]}}]){
    const invalid={scenes:[{...manifest.scenes[0],...patch}]};
    assert.equal(normalize(invalid,source).size,0);
  }
});
