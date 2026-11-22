// Run with node "nt v2/pressure.sim.test.cjs" from the repository root.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test, before } = require('node:test');
const { Script, createContext } = require('node:vm');

const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const hook = `
  globalThis.sim = {
    start, tap, finish, restartRun, findGroup,
    mission(level){pendingMission=level;start()},
    missionState(){return {run:adventureRun,profile:playerProfile.state}},
    setEnergy(value){energy=value},
    award, chargeOverdrive, collapse, chainGroups, settleColumns,
    hidden(value){document.hidden=value},
 pressureForGroup, passivePressureBetween, changePressure,
    tick(delta){scene.update(0,delta)},
    mount(host){
      scene = Object.assign(new Game(),host);
      scene.animateCity = ()=>{};
    },
    state(){return {playing,elapsed,pressure,score,best,energy,combo,busy,cityPhase,board,overUntil,recoverUntil}},
    setPressure(value){pressure=value}
  };
`;
const instrumented = new Script(script.replace(/\}\)\(\);\s*$/, hook + '\n})();'), { filename: 'index.html (inline script)' });

function createSimulation(seed = 20261122) {
  // LCG drives board generation, refills, visual random calls and perturbations.
  const math = Object.create(Math);
  math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };

  const elements = new Map();
  const records = new Map();
  const fakeElement = () => ({
    dataset: {},
    style: { setProperty() {} },
    classList: { add() {}, remove() {} },
  });
  const context = createContext({
    Math: math,
    Phaser: {
      Scene: class {},
      Game: class {},
      Scale: {},
      Math: { Between: (low, high) => low + Math.floor(math.random() * (high - low + 1)) },
    },
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, fakeElement());
        return elements.get(id);
      },
    },
    localStorage: { getItem: key => records.get(key), setItem: (key, value) => records.set(key, value) },
    window: { addEventListener() {} },
    matchMedia: () => ({ matches: false }),
    navigator: {},
    innerWidth: 412,
    innerHeight: 915,
  });
  for (const file of ['adventure.js', 'profile.js', 'locale.js']) {
    new Script(readFileSync(join(__dirname, 'js', file), 'utf8'), { filename: file }).runInContext(context);
  }
  instrumented.runInContext(context);
  const game = context.sim;

  // Rendering and audio are stubbed. The production tap and scene update run unchanged.
  const drawable = () => new Proxy({ visible: false }, {
    get(target, property) {
      if (property in target) return target[property];
      return () => target;
    },
  });
  const particle = () => {
    const object = drawable();
    object.setVisible = visible => { object.visible = visible; return object; };
    for (const method of ['setPosition', 'setFillStyle', 'setAlpha', 'setScale', 'setRotation']) {
      object[method] = () => object;
    }
    return object;
  };
  const gem = () => {
    const object = particle();
    object.setTexture = object.setDisplaySize = () => object;
    return object;
  };
  let clock = 0;
  let events = [];
  function schedule(delay, callback) {
    const event = {
      time: clock + delay,
      callback,
      canceled: false,
      remove() { this.canceled = true; },
    };
    events.push(event);
    return event;
  }
  game.mount({
    cell: 50, left: 0, top: 0, boardFrame: drawable(),
    gems: Array.from({ length: 49 }, gem),
    particles: Array.from({ length: 80 }, particle),
    time: { delayedCall: schedule },
    tweens: { killTweensOf() {}, add(config) {
      if (config.onComplete) schedule(config.duration, config.onComplete);
    } },
    cameras: { main: { shake() {}, resetFX() {} } },
  });
  game.start();

  function advance(ms) {
    const target = clock + ms;
    while (clock < target && game.state().playing) {
      const step = Math.min(25, target - clock);
      clock += step;
      const ready = events.filter(event => event.time <= clock);
      events = events.filter(event => event.time > clock);
      for (const event of ready) if (!event.canceled) event.callback();
      if (game.state().playing) game.tick(step);
    }
  }
  function groups() {
    const seen = new Set();
    const result = [];
    const { board } = game.state();
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        if (seen.has(y * board.length + x)) continue;
        const size = game.findGroup(x, y, seen).length;
        if (size >= 2) result.push({ x, y, size });
      }
    }
    return result.sort((a, b) => a.size - b.size);
  }
  return { ...game, advance, groups, records, elements };
}

function runScenario({ cadence, duration, choose }) {
  const sim = createSimulation();
  let moves = 0;
  let peak = sim.state().pressure;
  for (let time = cadence; time <= duration; time += cadence) {
    sim.advance(cadence);
    const beforeMove = sim.state();
    peak = Math.max(peak, beforeMove.pressure);
    if (!beforeMove.playing) break;
    const group = choose(sim.groups(), moves);
    if (!group || beforeMove.busy) continue;
    sim.tap(group.x, group.y);
    moves++;
    peak = Math.max(peak, sim.state().pressure);
    if (!sim.state().playing) break;
  }
  const { elapsed, pressure, playing, score } = sim.state();
  return { elapsed, pressure, playing, moves, peak, score };
}

const smallest = groups => groups[0];
const largest = groups => groups.at(-1);
// An imperfect policy: take the weakest legal move every third accepted move.
const mixed = (groups, moves) => moves % 3 === 2 ? smallest(groups) : largest(groups);

before(() => assert.doesNotThrow(() => new Script(script)));

test('pressure values, linear ramp and cap', () => {
  const sim = createSimulation();
  assert.deepEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 49].map(sim.pressureForGroup),
    [4, 2, -1, -5, -9, -12, -14, -16, -18, -20, -20]);
  assert.ok(Math.abs(sim.passivePressureBetween(0, 240000) - 126) < 1e-9);
  assert.ok(Math.abs(sim.passivePressureBetween(239000, 241000) - 1.4990625) < 1e-9);
  assert.equal(sim.passivePressureBetween(240000, 241000), .75);
  assert.ok(Math.abs(sim.passivePressureBetween(0, 1000) - .3009375) < 1e-9);
});

test('no-input survival ends at approximately 189 seconds', t => {
  const sim = createSimulation();
  sim.advance(240000);
  const state = sim.state();
  t.diagnostic(JSON.stringify({ elapsed: state.elapsed, pressure: state.pressure }));
  assert.ok(state.elapsed >= 188000 && state.elapsed < 190000);
  assert.equal(state.playing, false);
  assert.equal(state.pressure, 100);
});

test('frequent small clears are penalized', t => {
  const result = runScenario({ cadence: 1000, duration: 120000, choose: smallest });
  t.diagnostic(JSON.stringify(result));
  assert.ok(result.moves >= 15);
  assert.ok(result.elapsed < 45000);
  assert.equal(result.playing, false);
  assert.equal(result.pressure, 100);
});

test('skilled large-group clearing sustains pressure past the ramp', t => {
  const result = runScenario({ cadence: 4000, duration: 300000, choose: largest });
  t.diagnostic(JSON.stringify(result));
  assert.ok(result.moves >= 60);
  assert.equal(result.playing, true);
  assert.ok(result.peak < 55);
});

test('mixed play remains at risk when taking the smallest group every third move', t => {
  const slower = runScenario({ cadence: 4000, duration: 300000, choose: mixed });
  const faster = runScenario({ cadence: 2000, duration: 300000, choose: mixed });
  t.diagnostic(JSON.stringify({ slower, faster }));
  for (const result of [slower, faster]) {
    assert.ok(result.elapsed > 150000);
    assert.equal(result.playing, false);
    assert.equal(result.pressure, 100);
  }
});

test('long-session pressure rewards repeated cooling at the capped rate', t => {
  const greedy = runScenario({ cadence: 4000, duration: 1200000, choose: largest });
  const sim = createSimulation();
  let peak = 0;
  for (let time = 5000; time <= 1200000; time += 5000) {
    sim.advance(5000);
    peak = Math.max(peak, sim.state().pressure);
    // Isolate the pressure budget by supplying one five-gem clear every five seconds.
    // This does not assume an actual board can always supply these groups.
    sim.changePressure(sim.pressureForGroup(5));
  }
  const sustained = sim.state();
  t.diagnostic(JSON.stringify({ greedy, sustained: { elapsed: sustained.elapsed, pressure: sustained.pressure, peak } }));
  assert.ok(greedy.elapsed > 480000);
  assert.equal(sustained.elapsed, 1200000);
  assert.equal(sustained.playing, true);
  assert.equal(sustained.pressure, 0);
  assert.ok(peak < 15);
});

test('pressure clamps at zero and a manual clear ends the run immediately at 100', () => {
  const sim = createSimulation();
  sim.changePressure(-100);
  assert.equal(sim.state().pressure, 0);
  const pair = sim.groups().find(group => group.size === 2);
  assert.ok(pair);
  sim.advance(1200);
  sim.setPressure(96);
  sim.tap(pair.x, pair.y);
  const state = sim.state();
  assert.equal(state.pressure, 100);
  assert.equal(state.playing, false);
  assert.equal(state.busy, false);
  assert.equal(sim.elements.get('pct').textContent, '100%');
});

test('restart resets pressure and ramp, preserves the record and cancels pending input locks', () => {
  const sim = createSimulation();
  const group = sim.groups().at(-1);
  sim.advance(4000);
  sim.tap(group.x, group.y);
  assert.equal(sim.state().busy, true);
  sim.changePressure(100);
  const record = sim.state().best;
  assert.ok(record > 0);
  sim.start();
  assert.deepEqual(
    (({ elapsed, pressure, playing, busy, best }) => ({ elapsed, pressure, playing, busy, best }))(sim.state()),
    { elapsed: 0, pressure: 10, playing: true, busy: false, best: record },
  );
  sim.advance(1000);
  assert.ok(Math.abs(sim.state().pressure - 10.3009375) < 1e-9);
  assert.equal(sim.state().score, 0);
  assert.equal(Number(sim.records.get('reactor_miami_best')), record);
});

module.exports={createSimulation};
