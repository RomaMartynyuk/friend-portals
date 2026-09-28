import { testGame } from '@rarefriends/friendsdk/testing';
import { solveLayout } from './verify-balance.mjs';
const sliceSeed = 'SLICE_0379';
async function setRunSeed(page, game) {
  await page.locator('iframe').evaluate((frame, seed) => { frame.src = `./game.html?runSeed=${encodeURIComponent(seed)}`; }, sliceSeed);
  await game.locator(`main.game-shell[data-run-seed="${sliceSeed}"]`).waitFor();
}
const echoRunes = [[0, -3.65], [3.1, -1.25], [2.55, 2.6], [-2.55, 2.6], [-3.1, -1.25]];
const echoSequences = [[0, 3, 1], [4, 1, 3, 0], [2, 4, 0, 3, 1]];
async function move(page, keys, milliseconds) {
  for (const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  for (const key of keys) await page.keyboard.up(key);
}
async function promptText(game) { const prompt = game.locator('.interaction'); return await prompt.count() ? await prompt.textContent() : ''; }
async function moveUntil(page, locator, keys, steps = 18) {
  for (let i = 0; i < steps; i++) {
    if (await locator.isVisible()) return;
    await move(page, keys, 130);
  }
  await page.screenshot({ path: './artifacts/failed-reach.png' });
  throw new Error(`Could not reach ${await locator.count()} target with ${keys.join('+')}`);
}
async function position(game) {
  const shell = game.locator('main.game-shell');
  return [Number(await shell.getAttribute('data-player-x')), Number(await shell.getAttribute('data-player-z'))];
}
async function moveTo(page, game, x, z, camera = 'echo', tolerance = 0.52) {
  const angle = camera === 'echo' ? [7, 13] : camera === 'balance' ? [8, 15] : camera === 'celestial' ? [8, 16] : camera === 'temple' ? [7.5, 13] : [10, 18];
  const length = Math.hypot(...angle), right = [angle[1] / length, -angle[0] / length], back = [angle[0] / length, angle[1] / length];
  for (let step = 0; step < 100; step++) {
    const [px, pz] = await position(game), dx = x - px, dz = z - pz;
    if (Math.hypot(dx, dz) < tolerance) return;
    const horizontal = dx * right[0] + dz * right[1], vertical = dx * back[0] + dz * back[1];
    const keys = [];
    if (Math.abs(horizontal) > 0.18) keys.push(horizontal > 0 ? 'd' : 'a');
    if (Math.abs(vertical) > 0.18) keys.push(vertical > 0 ? 's' : 'w');
    if (!keys.length) keys.push(Math.abs(horizontal) > Math.abs(vertical) ? horizontal > 0 ? 'd' : 'a' : vertical > 0 ? 's' : 'w');
    await move(page, keys, camera === 'balance' ? 45 : 75);
  }
  throw new Error(`Could not move to ${x}, ${z}; last position ${await position(game)}`);
}
async function echoStatus(game) { return (await game.getByTestId('echo-phase').textContent()) ?? ''; }
async function stepRune(page, game, rune) {
  await moveTo(page, game, 0, 0, 'echo', 0.7);
  await moveTo(page, game, ...echoRunes[rune]);
}
async function playEchoRound(page, game, round) {
  await game.getByTestId('echo-phase').filter({ hasText: new RegExp(`input; round ${round + 1};`) }).waitFor({ timeout: 15000 });
  for (let i = 0; i < echoSequences[round].length; i++) {
    await stepRune(page, game, echoSequences[round][i]);
    if (i < echoSequences[round].length - 1 && !(await echoStatus(game)).includes(`input ${i + 1}`)) throw new Error(`Round ${round + 1} lost step ${i + 1}`);
  }
}
async function balanceStatus(game) {
  const text = (await game.getByTestId('balance-state').textContent()) ?? '';
  const match = text.match(/layout (\d+); stage (\d+); phase ([^;]+); blocks ([^;]+); A (\d+)\/(\d+); B (\d+)\/(\d+); C (\d+)\/(\d+)/);
  if (!match) throw new Error(`Could not parse Balance status: ${text}`);
  return { layout: Number(match[1]), stage: Number(match[2]), phase: match[3], blocks: match[4].split('|').map(pair => pair.split(',').map(Number)), weights: [Number(match[5]), Number(match[7]), Number(match[9])], targets: [Number(match[6]), Number(match[8]), Number(match[10])] };
}
async function celestialStatus(game) {
  const text = (await game.getByTestId('celestial-state').textContent()) ?? '';
  const match = text.match(/constellation (\d+); phase ([^;]+); locked (\d+); retry (\w+)/);
  if (!match) throw new Error(`Could not parse Celestial status: ${text}`);
  return { constellation: Number(match[1]), phase: match[2], locked: Number(match[3]), retry: match[4] };
}
const celestialControls = [[-5.3, 1.5], [0, 4.65], [5.3, 1.5]];
async function lockCelestial(page, game, ring, mobile = false) {
  const name = ['OUTER', 'MIDDLE', 'INNER'][ring];
  await moveTo(page, game, ...celestialControls[ring], 'celestial', 0.72);
  const prompt = game.getByRole('button', { name: `E LOCK ${name} RING` });
  if (!mobile) await prompt.waitFor();
  if (mobile && !(await promptText(game))?.includes(`LOCK ${name} RING`)) throw new Error(`Mobile ${name} control prompt is not active.`);
  for (let attempt = 0; attempt < 650; attempt++) {
    const value = Number(await game.locator('main.game-shell').getAttribute(`data-celestial-error${ring}`));
    if (Number.isFinite(value) && value < 0.12) {
      if (mobile) await game.getByRole('button', { name: 'ACTION' }).click();
      else await prompt.click();
      const result = await celestialStatus(game);
      if (result.locked !== ring + 1) throw new Error(`Ring ${name} missed inside test timing window: ${JSON.stringify(result)}, sampled error ${value}`);
      return;
    }
    await page.waitForTimeout(45);
  }
  throw new Error(`No alignment window appeared for ${name}.`);
}
async function pushBalance(page, game, block, direction, { mobile = false, rapid = false, settle = true } = {}) {
  const before = await balanceStatus(game), cell = before.blocks[block];
  const bx = cell[0] * 1.3, bz = 1.6 + cell[1] * 1.3;
  await moveTo(page, game, bx - direction.x * 0.7, bz - direction.row * 0.7, 'balance', 0.29);
  const prompt = game.getByRole('button', { name: new RegExp(`PUSH BLOCK ${String.fromCharCode(65 + block)}`) });
  if (!mobile) await prompt.waitFor();
  if (mobile) await game.getByRole('button', { name: 'ACTION' }).click();
  else if (rapid) { await page.keyboard.press('e'); await page.keyboard.press('e'); }
  else await prompt.click();
  const expected = [cell[0] + direction.x, cell[1] + direction.row];
  for (let attempt = 0; attempt < 20; attempt++) {
    const current = await balanceStatus(game);
    if (current.blocks[block][0] === expected[0] && current.blocks[block][1] === expected[1]) {
      if (settle && current.phase === 'mechanism') await game.getByTestId('balance-state').filter({ hasText: /phase routing/ }).waitFor({ timeout: 10000 });
      return current;
    }
    await page.waitForTimeout(80);
  }
  throw new Error(`Block ${block} did not move ${direction.x}, ${direction.row}. Status: ${JSON.stringify(await balanceStatus(game))}`);
}
await testGame('.', {
  screenshot: './artifacts/island-complete.png',
  check: async ({ page, game }) => {
    await setRunSeed(page, game);
    await game.getByText('THE FLOATING ISLE').waitFor();
    await game.locator('canvas').click({ position: { x: 300, y: 250 } });
    await moveUntil(page, game.getByRole('button', { name: /ENTER PORTAL I/ }), ['w'], 7);
    await game.getByRole('button', { name: /ENTER PORTAL I/ }).click();
    await game.locator('.scene-title').getByText('TEMPLE OF LIGHT').waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: './artifacts/temple-unsolved.png' });
    await moveUntil(page, game.getByRole('button', { name: /ROTATE CRYSTAL A/ }), ['w'], 12);
    await game.getByRole('button', { name: /ROTATE CRYSTAL A/ }).click();
    await game.getByText('LIGHT SEALS  1 / 3').waitFor();
    await page.waitForTimeout(370);
    await moveUntil(page, game.getByRole('button', { name: /LEAVE TEMPLE/ }), ['s'], 18);
    await game.getByRole('button', { name: /LEAVE TEMPLE/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    await moveUntil(page, game.getByRole('button', { name: /ENTER PORTAL I/ }), ['w'], 7);
    await game.getByRole('button', { name: /ENTER PORTAL I/ }).click();
    await game.getByText('LIGHT SEALS  1 / 3').waitFor();
    await moveUntil(page, game.getByRole('button', { name: /ROTATE CRYSTAL A/ }), ['w'], 12);
    await game.getByRole('button', { name: /ROTATE CRYSTAL A/ }).click();
    await page.keyboard.press('r');
    await game.getByText('LIGHT SEALS  0 / 3').waitFor();
    await page.waitForTimeout(350);
    await game.getByRole('button', { name: /ROTATE CRYSTAL A/ }).click();
    await game.getByText('LIGHT SEALS  1 / 3').waitFor();
    await page.waitForTimeout(370);
    await moveUntil(page, game.getByRole('button', { name: /ROTATE CRYSTAL B/ }), ['s'], 12);
    for (let i = 0; i < 3; i++) { await game.getByRole('button', { name: /ROTATE CRYSTAL B/ }).click(); await page.waitForTimeout(370); }
    await game.getByText('LIGHT SEALS  2 / 3').waitFor();
    await moveUntil(page, game.getByRole('button', { name: /ROTATE CRYSTAL C/ }), ['d'], 12);
    await game.getByRole('button', { name: /ROTATE CRYSTAL C/ }).click();
    await game.getByText('LIGHT SEALS  3 / 3').waitFor();
    await page.waitForTimeout(2200);
    await page.screenshot({ path: './artifacts/temple-solved.png' });
    await moveUntil(page, game.getByRole('button', { name: /CLAIM SHARD/ }), ['d', 's'], 12);
    await game.getByRole('button', { name: /CLAIM SHARD/ }).click();
    await game.getByText('PORTAL SHARD I ACQUIRED').waitFor();
    if (!(await game.getByTestId('shard-count').textContent())?.includes('SHARDS 1 / 4')) throw new Error('Shard count did not advance.');
    if (await game.getByRole('button', { name: /CLAIM SHARD/ }).count()) throw new Error('Duplicate shard prompt remained available.');
    await moveTo(page, game, 0, 5.35, 'temple', 1.25);
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).waitFor();
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    if ((await game.getByTestId('portal-status').textContent()) !== 'Portal 1 complete. Portal 2 active. Portal 3 locked. Portal 4 locked') throw new Error('Portal progression is incorrect.');
    await page.waitForTimeout(3100);
    await page.screenshot({ path: './artifacts/island-complete.png' });
    await moveUntil(page, game.getByRole('button', { name: /ENTER PORTAL I/ }), ['w'], 7);
    await game.getByRole('button', { name: /ENTER PORTAL I/ }).click();
    await game.locator('.scene-title').getByText('TEMPLE OF LIGHT').waitFor();
    if (await game.getByRole('button', { name: /RESET PUZZLE/ }).count()) throw new Error('Completed puzzle became resettable.');
    await page.waitForTimeout(150);
    await moveUntil(page, game.getByRole('button', { name: /RETURN TO ISLAND/ }), ['s'], 8);
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).click();
    if (!(await game.getByTestId('shard-count').textContent())?.includes('SHARDS 1 / 4')) throw new Error('Shard count did not advance.');
    await moveTo(page, game, 6.4, 0, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL II/ }).waitFor();
    await game.getByRole('button', { name: /ENTER PORTAL II/ }).click();
    await game.locator('.scene-title').getByText('ECHO GARDEN').waitFor();
    await moveTo(page, game, 0, 6.25);
    await game.getByRole('button', { name: /LEAVE GARDEN/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    await page.waitForTimeout(3500);
    await moveTo(page, game, 6.4, 0, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL II/ }).click();
    if (!(await echoStatus(game)).includes('playback; round 1; completed 0; input 0')) throw new Error('Early exit did not restart the current Echo round.');
    await page.setViewportSize({ width: 360, height: 800 });
    const pad = game.getByRole('group', { name: 'Movement joystick' });
    await pad.waitFor({ state: 'visible' });
    const beforeStick = await position(game), box = await pad.boundingBox();
    if (!box) throw new Error('Mobile joystick has no bounds.');
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 20, cy, { steps: 3 });
    await page.waitForTimeout(300); await page.mouse.up();
    if (Math.hypot(...(await position(game)).map((value, index) => value - beforeStick[index])) < 0.15) throw new Error('Echo Garden joystick did not move the Friend.');
    await page.screenshot({ path: './artifacts/echo-mobile.png' });
    await page.setViewportSize({ width: 960, height: 800 });
    await moveTo(page, game, ...echoRunes[2]);
    if (!(await echoStatus(game)).includes('playback; round 1; completed 0; input 0')) throw new Error('Rune registered during sequence playback.');
    await page.waitForTimeout(6800);
    if (!(await echoStatus(game)).includes('input; round 1; completed 0; input 0')) throw new Error('Standing on a rune submitted an input or playback never ended.');
    await page.screenshot({ path: './artifacts/echo-garden.png' });
    await playEchoRound(page, game, 0);
    if (!(await echoStatus(game)).includes('completed 1')) throw new Error('Round 1 did not complete.');
    await game.getByTestId('echo-phase').filter({ hasText: /input; round 2;/ }).waitFor({ timeout: 15000 });
    await stepRune(page, game, 0);
    if (!(await echoStatus(game)).includes('retry; round 2; completed 1; input 0')) throw new Error('Wrong input reset completed rounds.');
    await game.getByTestId('echo-phase').filter({ hasText: /input; round 2; completed 1; input 0/ }).waitFor({ timeout: 15000 });
    await playEchoRound(page, game, 1);
    if (!(await echoStatus(game)).includes('completed 2')) throw new Error('Round 2 did not complete.');
    await playEchoRound(page, game, 2);
    await game.getByTestId('echo-phase').filter({ hasText: /shard-ready; round 3; completed 3/ }).waitFor({ timeout: 15000 });
    await moveTo(page, game, 0, 0);
    await game.getByRole('button', { name: /CLAIM SHARD/ }).waitFor();
    await page.screenshot({ path: './artifacts/echo-shard.png' });
    await page.setViewportSize({ width: 360, height: 800 });
    await game.getByRole('button', { name: 'ACTION' }).click();
    await game.getByText('PORTAL SHARD II ACQUIRED').waitFor();
    await page.setViewportSize({ width: 960, height: 800 });
    if (!(await game.getByTestId('shard-count').textContent())?.includes('SHARDS 2 / 4')) throw new Error('Shard II not counted.');
    await game.getByRole('button', { name: /CLAIM SHARD/ }).waitFor({ state: 'hidden' });
    await moveTo(page, game, 0, 6.25);
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    if ((await game.getByTestId('portal-status').textContent()) !== 'Portal 1 complete. Portal 2 complete. Portal 3 active. Portal 4 locked') throw new Error('Portal III did not unlock.');
    await page.waitForTimeout(3100);
    await page.screenshot({ path: './artifacts/island-two-shards.png' });
    await moveTo(page, game, 6.4, 0, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL II/ }).click();
    if (!(await echoStatus(game)).includes('claimed; round 3; completed 3')) throw new Error('Completed Echo Garden lost its state.');
    if (await game.getByRole('button', { name: /CLAIM SHARD/ }).count()) throw new Error('Duplicate Shard II claim on re-entry.');
    await moveTo(page, game, 0, 6.25);
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    await moveTo(page, game, 0, 6.4, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL III/ }).waitFor();
    await game.getByRole('button', { name: /ENTER PORTAL III/ }).click();
    await game.locator('.scene-title').getByText('TEMPLE OF BALANCE').waitFor();
    if ((await balanceStatus(game)).layout !== 0) throw new Error('Fixed seed did not select Balance layout 0.');
    await page.screenshot({ path: './artifacts/balance-unsolved.png' });
    await page.setViewportSize({ width: 360, height: 800 });
    await game.getByRole('group', { name: 'Movement joystick' }).waitFor({ state: 'visible' });
    if (!(await game.locator('.balance-readout').isVisible())) throw new Error('Balance readout is hidden at phone width.');
    const balancePad = await game.getByRole('group', { name: 'Movement joystick' }).boundingBox();
    if (!balancePad) throw new Error('Balance joystick has no bounds.');
    const startPosition = await position(game), stickX = balancePad.x + balancePad.width / 2, stickY = balancePad.y + balancePad.height / 2;
    await page.mouse.move(stickX, stickY); await page.mouse.down(); await page.mouse.move(stickX + 20, stickY, { steps: 3 }); await page.waitForTimeout(250); await page.mouse.up();
    if (Math.hypot(...(await position(game)).map((value, index) => value - startPosition[index])) < 0.12) throw new Error('Balance joystick did not move the Friend.');
    await pushBalance(page, game, 0, { x: 0, row: -1 }, { mobile: true });
    if ((await balanceStatus(game)).weights[0] !== 1) throw new Error('Underweight plate did not register one mark.');
    await page.screenshot({ path: './artifacts/balance-mobile.png' });
    await page.setViewportSize({ width: 960, height: 800 });
    await moveTo(page, game, 0, 7.2, 'balance', 0.3);
    await game.getByRole('button', { name: /LEAVE TEMPLE/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    await moveTo(page, game, 0, 6.4, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL III/ }).click();
    if ((await balanceStatus(game)).weights[0] !== 1) throw new Error('Balance state changed on early exit.');
    await game.getByRole('button', { name: /RESET TEMPLE/ }).click();
    if ((await balanceStatus(game)).weights[0] !== 0 || (await balanceStatus(game)).layout !== 0) throw new Error('Balance reset changed the seeded layout.');
    await pushBalance(page, game, 0, { x: -1, row: 0 });
    const beforeBoundary = await balanceStatus(game);
    await moveTo(page, game, -3 * 1.3 + 0.7, 1.6 + 2 * 1.3, 'balance', 0.29);
    await game.getByRole('button', { name: /PUSH BLOCK A/ }).click();
    if (JSON.stringify((await balanceStatus(game)).blocks) !== JSON.stringify(beforeBoundary.blocks)) throw new Error('Block crossed grid boundary.');
    for (let i = 0; i < 4; i++) await pushBalance(page, game, 2, { x: -1, row: 0 });
    await pushBalance(page, game, 2, { x: 0, row: -1 });
    if ((await balanceStatus(game)).weights[0] !== 3) throw new Error('Overweight plate did not register heavy block.');
    await page.keyboard.press('r');
    if ((await balanceStatus(game)).weights[0] !== 0) throw new Error('Keyboard reset did not clear overweight plate.');
    await pushBalance(page, game, 1, { x: -1, row: 0 }, { rapid: true });
    if ((await balanceStatus(game)).blocks[1][0] !== -1) throw new Error('Rapid interaction moved a block more than once.');
    await page.waitForTimeout(150);
    await pushBalance(page, game, 1, { x: -1, row: 0 });
    const beforeCollision = await balanceStatus(game);
    await moveTo(page, game, -2 * 1.3, 1.6 + 3 * 1.3 + 0.7, 'balance', 0.29);
    await game.getByRole('button', { name: /PUSH BLOCK B/ }).click();
    if (JSON.stringify((await balanceStatus(game)).blocks) !== JSON.stringify(beforeCollision.blocks)) throw new Error('Blocks overlapped after collision.');
    await page.keyboard.press('r');
    const stages = solveLayout(0);
    for (let index = 0; index < stages[0].path.length; index++) {
      const move = stages[0].path[index];
      await pushBalance(page, game, move.block, move.direction, { settle: index !== stages[0].path.length - 1 });
    }
    if ((await balanceStatus(game)).phase !== 'mechanism') throw new Error('First mechanism animation did not start.');
    await page.keyboard.press('r');
    if ((await balanceStatus(game)).stage !== 0 || (await balanceStatus(game)).phase !== 'routing') throw new Error('Reset during mechanism animation failed.');
    for (const stage of stages) for (const step of stage.path) await pushBalance(page, game, step.block, step.direction);
    await game.getByTestId('balance-state').filter({ hasText: /stage 3; phase shard-ready/ }).waitFor({ timeout: 12000 });
    await page.screenshot({ path: './artifacts/balance-solved.png' });
    await moveTo(page, game, 0, 0.7, 'balance', 0.45);
    await moveTo(page, game, 0, -6.1, 'balance', 1.2);
    await game.getByRole('button', { name: /CLAIM SHARD/ }).click();
    await game.getByText('PORTAL SHARD III ACQUIRED').waitFor();
    if (!(await game.getByTestId('shard-count').textContent())?.includes('SHARDS 3 / 4')) throw new Error('Shard III was not counted.');
    await game.getByRole('button', { name: /CLAIM SHARD/ }).waitFor({ state: 'hidden' });
    await moveTo(page, game, 0, 7.2, 'balance', 0.3);
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    if ((await game.getByTestId('portal-status').textContent()) !== 'Portal 1 complete. Portal 2 complete. Portal 3 complete. Portal 4 active') throw new Error('Portal IV did not unlock.');
    await page.waitForTimeout(3100);
    await page.screenshot({ path: './artifacts/island-three-shards.png' });
    await moveTo(page, game, 0, 6.4, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL III/ }).click();
    if ((await balanceStatus(game)).phase !== 'claimed') throw new Error('Completed Balance Temple lost its restored state.');
    if (await game.getByRole('button', { name: /CLAIM SHARD/ }).count()) throw new Error('Duplicate Shard III claim on re-entry.');
    await moveTo(page, game, 0, 7.2, 'balance', 0.3);
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    await moveTo(page, game, -6.4, 0, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL IV/ }).click();
    await game.locator('.scene-title').getByText('CELESTIAL OBSERVATORY').waitFor();
    if ((await celestialStatus(game)).constellation !== 4) throw new Error('Fixed seed did not select The Voyager.');
    await page.waitForTimeout(2050);
    await page.screenshot({ path: './artifacts/celestial-observatory.png' });
    await game.getByTestId('celestial-state').filter({ hasText: /phase running/ }).waitFor({ timeout: 12000 });
    await moveTo(page, game, 0, 2.95, 'celestial', 0.6);
    await game.getByRole('button', { name: /VIEW CONSTELLATION/ }).click();
    if ((await celestialStatus(game)).phase !== 'clue') throw new Error('Observation pedestal did not reveal the clue.');
    if ((await celestialStatus(game)).constellation !== 4) throw new Error('Viewing the clue changed the constellation.');
    await game.getByTestId('celestial-state').filter({ hasText: /phase running/ }).waitFor({ timeout: 12000 });
    await moveTo(page, game, ...celestialControls[0], 'celestial', 0.72);
    const outerPrompt = game.getByRole('button', { name: /LOCK OUTER RING/ });
    await outerPrompt.waitFor();
    for (let attempt = 0; attempt < 100; attempt++) {
      const error = Number(await game.locator('main.game-shell').getAttribute('data-celestial-error0'));
      if (error > 0.7) break;
      await page.waitForTimeout(45);
    }
    await outerPrompt.click();
    if ((await celestialStatus(game)).phase !== 'retry' || (await celestialStatus(game)).locked !== 0) throw new Error('Miss reset more than the current ring.');
    await game.getByTestId('celestial-state').filter({ hasText: /phase running/ }).waitFor();
    await lockCelestial(page, game, 0);
    await game.getByRole('button', { name: /RESET OBSERVATORY/ }).click();
    if ((await celestialStatus(game)).locked !== 0 || (await celestialStatus(game)).constellation !== 4) throw new Error('Observatory reset changed the run configuration.');
    await page.waitForTimeout(150);
    if (Math.abs(Number(await game.locator('main.game-shell').getAttribute('data-celestial-angle0')) - 119 * Math.PI / 180) > 0.02) throw new Error('Reset did not restore the seeded Outer starting angle.');
    await moveTo(page, game, 0, 7.38, 'celestial', 0.32);
    await game.getByRole('button', { name: /LEAVE OBSERVATORY/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    for (let attempt = 0; attempt < 10 && (await game.locator('main.game-shell').getAttribute('data-celestial-voices')) !== '0'; attempt++) await page.waitForTimeout(80);
    if ((await game.locator('main.game-shell').getAttribute('data-celestial-voices')) !== '0') throw new Error('Celestial audio continued after leaving.');
    if ((await game.getByTestId('portal-status').textContent()) !== 'Portal 1 complete. Portal 2 complete. Portal 3 complete. Portal 4 active') throw new Error('Early Observatory exit changed progression.');
    await moveTo(page, game, -6.4, 0, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL IV/ }).click();
    if ((await celestialStatus(game)).constellation !== 4 || (await celestialStatus(game)).locked !== 0) throw new Error('Observatory re-entry changed seeded state.');
    await game.getByTestId('celestial-state').filter({ hasText: /phase running/ }).waitFor({ timeout: 12000 });
    await lockCelestial(page, game, 0);
    await page.setViewportSize({ width: 360, height: 800 });
    if (!(await game.locator('.celestial-readout').isVisible())) throw new Error('Celestial HUD hidden on phone.');
    const celestialPad = await game.getByRole('group', { name: 'Movement joystick' }).boundingBox();
    if (!celestialPad) throw new Error('Celestial joystick missing.');
    const beforeCelestialStick = await position(game), starX = celestialPad.x + celestialPad.width / 2, starY = celestialPad.y + celestialPad.height / 2;
    await page.mouse.move(starX, starY); await page.mouse.down(); await page.mouse.move(starX + 20, starY, { steps: 3 }); await page.waitForTimeout(260); await page.mouse.up();
    if (Math.hypot(...(await position(game)).map((value, index) => value - beforeCelestialStick[index])) < 0.1) throw new Error('Celestial joystick did not move the Friend.');
    await lockCelestial(page, game, 1, true);
    await page.screenshot({ path: './artifacts/celestial-mobile.png' });
    await page.setViewportSize({ width: 960, height: 800 });
    await lockCelestial(page, game, 2);
    await game.getByTestId('celestial-state').filter({ hasText: /phase finale/ }).waitFor();
    await game.getByTestId('celestial-state').filter({ hasText: /phase shard-ready/ }).waitFor({ timeout: 12000 });
    await page.screenshot({ path: './artifacts/celestial-complete.png' });
    await moveTo(page, game, 0, -1.3, 'celestial', 0.9);
    await game.getByRole('button', { name: /CLAIM FINAL SHARD/ }).click();
    await game.getByText('FINAL PORTAL SHARD ACQUIRED').waitFor();
    if (!(await game.getByTestId('shard-count').textContent())?.includes('SHARDS 4 / 4')) throw new Error('Final shard not counted.');
    await game.getByRole('button', { name: /CLAIM FINAL SHARD/ }).waitFor({ state: 'hidden' });
    await moveTo(page, game, 0, 7.38, 'celestial', 0.32);
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
    if ((await game.getByTestId('portal-status').textContent()) !== 'Portal 1 complete. Portal 2 complete. Portal 3 complete. Portal 4 complete') throw new Error('Four-portal completion is incorrect.');
    await page.waitForTimeout(3100);
    await game.getByText('THE MONUMENT IS READY').waitFor();
    await page.screenshot({ path: './artifacts/island-four-shards.png' });
    await moveTo(page, game, -6.4, 0, 'island', 1.8);
    await game.getByRole('button', { name: /ENTER PORTAL IV/ }).click();
    if ((await celestialStatus(game)).phase !== 'claimed') throw new Error('Completed Observatory did not remain aligned.');
    if (await game.getByRole('button', { name: /CLAIM FINAL SHARD/ }).count()) throw new Error('Duplicate final shard claim on re-entry.');
  },
});
await testGame('.', { width: 360, screenshot: './artifacts/mobile.png', check: async ({ page, game }) => {
  await setRunSeed(page, game);
  await game.getByRole('group', { name: 'Movement joystick' }).waitFor();
  await game.locator('canvas').click({ position: { x: 150, y: 70 } });
  for (let i = 0; i < 7; i++) { if ((await promptText(game))?.includes('ENTER PORTAL I')) break; await move(page, ['w'], 130); }
  if (!(await promptText(game))?.includes('ENTER PORTAL I')) throw new Error('Mobile portal prompt missing.');
  await game.getByRole('button', { name: 'ACTION' }).click();
  await game.locator('.scene-title').getByText('TEMPLE OF LIGHT').waitFor();
  for (let i = 0; i < 12; i++) { if ((await promptText(game))?.includes('ROTATE CRYSTAL A')) break; await move(page, ['w'], 130); }
  if (!(await promptText(game))?.includes('ROTATE CRYSTAL A')) throw new Error('Mobile crystal prompt missing.');
  await game.getByRole('button', { name: 'ACTION' }).click();
  if (!(await game.locator('.scene-title small').textContent())?.includes('1 / 3')) throw new Error('Mobile ACTION did not rotate Crystal A.');
} });
