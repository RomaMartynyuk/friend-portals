import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled = await build({ stdin: { contents: `export * from './src/portals/celestial/celestialConfig.ts'; export * from './src/portals/celestial/CelestialPuzzleState.ts'; export * from './src/game/GameState.ts';`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const api = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`);
assert.equal(api.constellations.length, 8);
for (let index = 0; index < api.constellations.length; index++) {
  const clue = api.constellations[index];
  assert.equal(clue.targets.length, 3);
  assert.equal(clue.stars.length, 3);
  clue.targets.forEach((symbol, ring) => assert.ok(api.ringSymbols[ring].includes(symbol), `${clue.name} lacks ${symbol} on ring ${ring}`));
  let state = { ...api.initialCelestialPuzzle('TEST_RUN_001'), constellation: index, phase: 'running' };
  for (const ring of [0, 1, 2]) {
    state = { ...state, angles: state.angles.map((angle, i) => i === ring ? api.targetAngle(state, ring) : angle) };
    const result = api.lockCelestialRing(state, ring);
    assert.ok(result.verdict === 'perfect' || result.verdict === 'finale');
    state = result.next;
  }
  assert.equal(state.phase, 'finale');
  assert.equal(api.materializeCelestialShard(state).phase, 'shard-ready');
}
assert.ok(api.angularError(0.025, api.TAU - 0.025) < 0.051, '0° / 360° wrapping failed');
const seed = 'SLICE_0379', config = api.celestialConfigForSeed(seed);
assert.deepEqual(config, api.celestialConfigForSeed(seed));
for (const known of ['SLICE_0379', 'SLICE_0380', 'TEST_RUN_001', 'TEST_RUN_002']) {
  const choice = api.celestialConfigForSeed(known);
  assert.ok(choice.starts.every(angle => angle >= 0 && angle < api.TAU));
  assert.ok(choice.speeds.every(speed => speed >= 0.37 && speed <= 0.6));
  assert.ok(choice.directions.every(direction => direction === -1 || direction === 1));
  console.log(`${known}: ${api.constellations[choice.constellation].name}; angles ${choice.starts.map(angle => (angle * 180 / Math.PI).toFixed(0)).join('/')}; directions ${choice.directions.join('/')}; speeds ${choice.speeds.map(speed => speed.toFixed(3)).join('/')}`);
}
assert.notDeepEqual(api.celestialConfigForSeed('SLICE_0379'), api.celestialConfigForSeed('SLICE_0380'));
const initial = api.initialCelestialPuzzle(seed);
const running = api.beginCelestialMotion(initial);
assert.equal(running.phase, 'running');
const outer = api.targetAngle(running, 0);
const exact = api.lockCelestialRing({ ...running, angles: [outer, ...running.angles.slice(1)] }, 0);
assert.equal(exact.verdict, 'perfect');
const good = api.lockCelestialRing({ ...running, angles: [api.normalizeAngle(outer + api.GOOD_WINDOW * 0.75), ...running.angles.slice(1)] }, 0);
assert.equal(good.verdict, 'good');
const miss = api.lockCelestialRing({ ...running, angles: [api.normalizeAngle(outer + api.GOOD_WINDOW + 0.09), ...running.angles.slice(1)] }, 0);
assert.equal(miss.verdict, 'miss');
assert.equal(miss.next.lockedCount, 0);
assert.equal(api.beginCelestialMotion(miss.next).phase, 'running');
assert.equal(api.lockCelestialRing(exact.next, 0).verdict, 'ignored');
assert.equal(api.resetCelestialPuzzle(exact.next, seed).constellation, initial.constellation);
assert.deepEqual(api.resetCelestialPuzzle(exact.next, seed).angles, initial.angles);
const evolved = api.advanceCelestial(running, config, 1.25);
assert.notDeepEqual(evolved.angles, running.angles);
assert.deepEqual(api.advanceCelestial(running, config, 1.25), evolved);
const journey = { ...api.createInitialGameState(seed), scene: 'CELESTIAL_OBSERVATORY', completedPortals: [1, 2, 3], celestial: exact.next };
assert.deepEqual(api.enterPortal(api.returnToIsland(journey), 4).celestial, exact.next);
const claimed = api.claimCelestialShard({ ...journey, celestial: { ...exact.next, lockedCount: 3, phase: 'shard-ready' } });
assert.deepEqual(claimed.completedPortals, [1, 2, 3, 4]);
assert.equal(api.claimCelestialShard(claimed), claimed);
assert.equal(api.portalStatus(claimed, 4), 'complete');
const anotherJourney = api.startNewJourney(claimed, 'SLICE_0380');
assert.deepEqual(anotherJourney.completedPortals, []);
assert.notEqual(anotherJourney.celestial.constellation, claimed.celestial.constellation);
assert.deepEqual(anotherJourney.celestial.angles, api.celestialConfigForSeed('SLICE_0380').starts);
console.log('Eight constellations, angular windows, wraparound, retry, reset, re-entry and duplicate-claim rules verified.');
