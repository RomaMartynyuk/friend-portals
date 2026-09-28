import { testGame } from '@rarefriends/friendsdk/testing';
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
