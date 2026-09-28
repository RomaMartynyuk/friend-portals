import { testGame } from '@rarefriends/friendsdk/testing';
await testGame('.', {
  screenshot: './artifacts/vertical-slice.png',
  check: async ({ page, game }) => {
    await game.getByText('THE FLOATING ISLE').waitFor();
    await game.locator('canvas').click({ position: { x: 300, y: 250 } });
    await page.keyboard.down('w');
    await page.waitForTimeout(700);
    await page.keyboard.up('w');
    await game.getByRole('button', { name: /ENTER PORTAL I/ }).click();
    await game.getByText('TEMPLE OF LIGHT').waitFor();
    await page.waitForTimeout(600);
    await page.screenshot({ path: './artifacts/test-room.png' });
    await game.getByRole('button', { name: /RETURN TO ISLAND/ }).click();
    await game.getByText('THE FLOATING ISLE').waitFor();
  },
});

await testGame('.', { width: 360, screenshot: './artifacts/mobile.png', check: async ({ game }) => { await game.getByRole('group', { name: 'Movement joystick' }).waitFor(); } });
