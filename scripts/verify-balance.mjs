import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled = await build({
  stdin: { contents: `
    export * from './src/game/GameState.ts';
    export * from './src/portals/balance/balanceLayouts.ts';
    export * from './src/portals/balance/BalancePuzzleState.ts';
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false,
});
export const balanceApi = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`);
const directions = [{ x: -1, row: 0 }, { x: 1, row: 0 }, { x: 0, row: -1 }, { x: 0, row: 1 }];
const key = state => state.blocks.map(cell => cell.join(',')).join('|');

/** Search legal grid pushes, with the same reducer used by the game. */
export function solveStage(initial) {
  const queue = [initial], seen = new Map([[key(initial), null]]);
  const moves = new Map();
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const state = queue[cursor], source = key(state);
    for (let block = 0; block < state.blocks.length; block++) for (const direction of directions) {
      const result = balanceApi.pushBalanceBlock(state, block, direction);
      if (result.result !== 'moved') continue;
      let next = result.next;
      if (next.phase === 'mechanism') next = balanceApi.finishBalanceMechanism(next);
      const destination = key(next);
      if (next.stage > initial.stage) {
        const path = [{ block, direction }];
        let trace = source;
        while (moves.has(trace)) { const previous = moves.get(trace); path.push(previous.move); trace = previous.from; }
        return { state: next, path: path.reverse(), explored: seen.size };
      }
      if (!seen.has(destination)) {
        if (seen.size > 200000) throw new Error(`Balance layout ${initial.layout} search exceeded 200,000 states at stage ${initial.stage}.`);
        seen.set(destination, true); moves.set(destination, { from: source, move: { block, direction } }); queue.push(next);
      }
    }
  }
  throw new Error(`Balance layout ${initial.layout} cannot finish stage ${initial.stage + 1}.`);
}

export function solveLayout(layout) {
  let state = { layout, blocks: balanceApi.balanceLayouts[layout].blocks.map(block => block.start), stage: 0, phase: 'routing' };
  const stages = [];
  while (state.stage < 3) { const solved = solveStage(state); stages.push(solved); state = solved.state; }
  return stages;
}

assert.equal(balanceApi.balanceLayoutForSeed('SLICE_0379'), 0);
assert.equal(balanceApi.balanceLayoutForSeed('SLICE_0380'), 2);
assert.equal(balanceApi.balanceLayoutForSeed('BALANCE_TEST_A'), 3);
assert.equal(balanceApi.balanceLayoutForSeed('TEST_RUN_002'), 5);
assert.deepEqual(balanceApi.initialBalancePuzzle('SLICE_0379'), balanceApi.initialBalancePuzzle('SLICE_0379'));
assert.notEqual(balanceApi.initialBalancePuzzle('SLICE_0379').layout, balanceApi.initialBalancePuzzle('SLICE_0380').layout);

for (let layout = 0; layout < balanceApi.balanceLayouts.length; layout++) {
  const config = balanceApi.balanceLayouts[layout], weight = ids => ids.reduce((sum, id) => sum + config.blocks[id].weight, 0);
  assert.equal(weight(config.solution.first), config.targets.A);
  assert.equal(weight(config.solution.second), config.targets.B);
  assert.equal(weight(config.solution.finalA), config.targets.A);
  assert.equal(weight(config.solution.finalC), config.targets.C);
  assert.equal(weight(config.solution.finalA) + weight(config.solution.finalC), weight(config.blocks.map((_, id) => id)));
  assert.ok(config.solution.first.some(id => config.solution.second.includes(id)), 'Stage II must reuse a Stage I block.');
  const stages = solveLayout(layout);
  assert.deepEqual(stages.map(stage => stage.state.stage), [1, 2, 3]);
  console.log(`Balance layout ${layout}: solvable in ${stages.map(stage => stage.path.length).join(' + ')} grid pushes.`);
}

const initial = { layout: 0, blocks: balanceApi.balanceLayouts[0].blocks.map(block => block.start), stage: 0, phase: 'routing' };
assert.equal(balanceApi.pushBalanceBlock({ ...initial, blocks: [[-3, 0], ...initial.blocks.slice(1)] }, 0, { x: -1, row: 0 }).result, 'boundary');
assert.equal(balanceApi.pushBalanceBlock({ ...initial, blocks: [[0, 2], [0, 3], initial.blocks[2]] }, 0, { x: 0, row: 1 }).result, 'occupied');
assert.equal(balanceApi.pushBalanceBlock({ ...initial, phase: 'mechanism' }, 0, { x: 1, row: 0 }).result, 'locked');
assert.equal(balanceApi.balanceWalkable(initial, 0, -2), false);
assert.equal(balanceApi.balanceWalkable({ ...initial, phase: 'shard-ready' }, 0, -2), true);
const partial = balanceApi.pushBalanceBlock(initial, 1, { x: 1, row: 0 }).next;
assert.deepEqual(balanceApi.resetBalancePuzzle(partial), initial);
assert.deepEqual(balanceApi.resetBalancePuzzle({ ...partial, phase: 'mechanism' }), initial);
const journey = balanceApi.createInitialGameState('BALANCE_TEST_A');
const reentered = balanceApi.enterPortal(balanceApi.returnToIsland({ ...journey, scene: 'TEMPLE_BALANCE', balance: partial, completedPortals: [1, 2] }), 3);
assert.deepEqual(reentered.balance, partial);
const completed = { ...reentered, balance: { ...reentered.balance, stage: 3, phase: 'shard-ready' } };
const claimed = balanceApi.claimBalanceShard(completed);
assert.deepEqual(claimed.completedPortals, [1, 2, 3]);
assert.equal(balanceApi.claimBalanceShard(claimed), claimed);
assert.equal(balanceApi.portalStatus(claimed, 4), 'active');
console.log('Balance collision, reset, re-entry, duplicate claim and Portal IV progression verified.');
