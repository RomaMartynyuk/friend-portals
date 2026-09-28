import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Bundle pure TypeScript modules so this check works on the project's Node 22 baseline.
const result = await build({
  stdin: { contents: `
    export * from './src/game/seededRun.ts';
    export * from './src/game/GameState.ts';
    export * from './src/game/ProgressStore.ts';
    export * from './src/portals/light/LightPuzzleState.ts';
    export * from './src/portals/echo/echoConfig.ts';
    export * from './src/portals/echo/EchoPuzzleState.ts';
    export * from './src/world/worldCosmetics.ts';
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false,
});
const source = Buffer.from(result.outputFiles[0].contents).toString('base64');
const game = await import(`data:text/javascript;base64,${source}`);
const seedA = 'SLICE_0379', seedB = 'SLICE_0380';

assert.equal(game.lightVariantForSeed(seedA), 0);
assert.equal(game.lightVariantForSeed(seedB), 6);
assert.deepEqual(game.echoSequencesForSeed(seedA), [[0, 3, 1], [4, 1, 3, 0], [2, 4, 0, 3, 1]]);
assert.notDeepEqual(game.echoSequencesForSeed(seedA), game.echoSequencesForSeed(seedB));
assert.deepEqual(game.createWorldCosmetics(seedA, 730), game.createWorldCosmetics(seedA, 730));
assert.notDeepEqual(game.createWorldCosmetics(seedA, 730), game.createWorldCosmetics(seedB, 730));
assert.equal(game.portalSeed(seedA, 'echo'), game.portalSeed(seedA, 'echo'));
assert.notEqual(game.portalSeed(seedA, 'echo'), game.worldSeed(seedA));

for (let variant = 0; variant < game.lightVariants.length; variant++) {
  const config = game.lightVariants[variant];
  let light = { variant, orientations: config.initial, phase: 'routing' };
  assert.equal(game.traceLight(light).seals, 0);
  assert.notDeepEqual(config.initial, config.required);
  let turns = 0;
  for (let crystal = 0; crystal < 3; crystal++) {
    const count = (config.required[crystal] - config.initial[crystal] + 4) % 4;
    assert.ok(count >= 1 && count <= 3);
    for (let turn = 0; turn < count; turn++) { light = game.rotateLightCrystal(light, crystal); turns++; }
    assert.equal(game.traceLight(light).seals, crystal + 1);
  }
  assert.equal(turns, 5);
  assert.equal(light.phase, 'charging');
  assert.equal(game.traceLight(light).reachesCore, true);
  const partial = game.rotateLightCrystal({ variant, orientations: config.initial, phase: 'routing' }, 0);
  assert.deepEqual(game.resetLightCrystals(partial).orientations, config.initial);
}

for (const seed of [seedA, seedB, 'TEST_RUN_003', 'TEST_RUN_004', 'TEST_RUN_005']) {
  const sequences = game.echoSequencesForSeed(seed);
  assert.deepEqual(sequences.map(round => round.length), [3, 4, 5]);
  assert.equal(new Set(sequences.map(round => round[0])).size, 3);
  for (const round of sequences) {
    assert.ok(round.every((rune, index) => rune >= 0 && rune < 5 && (index === 0 || rune !== round[index - 1])));
    const steps = round.slice(1).map((rune, index) => (rune - round[index] + 5) % 5);
    assert.ok(!steps.every(step => step === 1) && !steps.every(step => step === 4));
  }
}

let journey = game.createInitialGameState(seedA);
assert.equal(journey.runSeed, seedA);
assert.equal(journey.light.variant, 0);
journey = game.enterPortal(journey, 1);
journey = game.rotateCrystal(journey, 0);
const priorLight = journey.light;
journey = game.returnToIsland(journey);
journey = game.enterPortal(journey, 1);
assert.deepEqual(journey.light, priorLight);
journey = game.resetPuzzle(journey);
assert.deepEqual(journey.light.orientations, game.lightVariants[0].initial);
assert.equal(journey.runSeed, seedA);

const echoState = game.initialEchoPuzzle(seedA);
const inputState = game.allowEchoInput({ ...echoState, phase: 'playback' });
const wrong = game.submitEchoRune(inputState, 2);
assert.equal(wrong.verdict, 'wrong');
assert.deepEqual(game.restartEchoRound(wrong.next).sequences, echoState.sequences);
const reentered = game.prepareEchoEntry(game.pauseEchoForExit(inputState));
assert.deepEqual(reentered.sequences, echoState.sequences);

const completed = { ...journey, completedPortals: [1, 2], light: { ...journey.light, phase: 'claimed' }, echo: { ...journey.echo, phase: 'claimed' } };
const fixedNewJourney = game.startNewJourney(completed, seedB);
assert.equal(fixedNewJourney.runSeed, seedB);
assert.deepEqual(fixedNewJourney.completedPortals, []);
assert.equal(fixedNewJourney.scene, 'ISLAND');
assert.equal(fixedNewJourney.light.variant, 6);
assert.equal(fixedNewJourney.echo.phase, 'waiting');
assert.deepEqual([1, 2, 3, 4].map(portal => game.portalStatus(fixedNewJourney, portal)), ['active', 'locked', 'locked', 'locked']);
const generatedJourney = game.startNewJourney(completed);
assert.notEqual(generatedJourney.runSeed, completed.runSeed);
assert.notEqual(generatedJourney.light.variant, completed.light.variant);

const friendId = 999999999n;
assert.equal(game.sessionProgressStore.read(friendId, seedA).runSeed, seedA);
game.sessionProgressStore.write(friendId, game.gameProgress(fixedNewJourney));
assert.equal(game.sessionProgressStore.read(friendId, seedA).runSeed, seedB);
console.log(`Seed replayability verified: ${game.lightVariants.length} Light variants, ${seedA} → variant 0, ${seedB} → variant 6.`);
