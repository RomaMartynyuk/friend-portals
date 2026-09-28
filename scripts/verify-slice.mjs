import { testGame } from '@rarefriends/friendsdk/testing';
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
  const angle = camera === 'echo' ? [7, 13] : [10, 18];
  const length = Math.hypot(...angle), right = [angle[1] / length, -angle[0] / length], back = [angle[0] / length, angle[1] / length];
  for (let step = 0; step < 100; step++) {
    const [px, pz] = await position(game), dx = x - px, dz = z - pz;
    if (Math.hypot(dx, dz) < tolerance) return;
    const horizontal = dx * right[0] + dz * right[1], vertical = dx * back[0] + dz * back[1];
    const keys = [];
    if (Math.abs(horizontal) > 0.18) keys.push(horizontal > 0 ? 'd' : 'a');
    if (Math.abs(vertical) > 0.18) keys.push(vertical > 0 ? 's' : 'w');
    if (!keys.length) keys.push(Math.abs(horizontal) > Math.abs(vertical) ? horizontal > 0 ? 'd' : 'a' : vertical > 0 ? 's' : 'w');
    await move(page, keys, 75);
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
await testGame('.', {
  screenshot: './artifacts/island-complete.png',
  check: async ({ page, game }) => {
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
    await moveUntil(page, game.getByRole('button', { name: /RETURN TO ISLAND/ }), ['a', 's'], 22);
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
    if (await game.getByRole('button', { name: /CLAIM SHARD/ }).count()) throw new Error('Duplicate Shard II claim prompt remained.');
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
  },
});
await testGame('.', { width: 360, screenshot: './artifacts/mobile.png', check: async ({ page, game }) => {
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
