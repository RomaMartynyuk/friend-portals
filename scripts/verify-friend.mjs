import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { decodeGenerationSprites, spriteFrame, GENERATION_FAMILY_NAMES } from '@rarefriends/friendsdk/sprites';

const result = await build({
  entryPoints: ['src/player/spritePixels.ts'], bundle: true, platform: 'node', format: 'esm', write: false,
});
const source = Buffer.from(result.outputFiles[0].contents).toString('base64');
const { outlinedPixels, SPRITE_PIXELS } = await import(`data:text/javascript;base64,${source}`);

const singlePixel = 1n << 0n;
const allFrames = Array.from({ length: 64 }, (_, i) => singlePixel << BigInt(i % 16));
for (let familyId = 0; familyId < GENERATION_FAMILY_NAMES.length; familyId++) {
  const sprites = decodeGenerationSprites(7730n, familyId, 1, allFrames);
  assert.equal(sprites.familyName, GENERATION_FAMILY_NAMES[familyId]);
  for (const walking of [false, true]) for (const facing of ['down', 'up', 'left', 'right']) for (let index = 0; index < 8; index++) {
    const selected = spriteFrame(sprites, facing, walking, index, 'left');
    assert.equal(selected.requestedFacing, facing);
    assert.equal(selected.resolvedFacing, familyId === 6 && (facing === 'up' || facing === 'down') ? 'left' : facing);
    const pixels = outlinedPixels(selected.frame);
    assert.equal(pixels.length, SPRITE_PIXELS * SPRITE_PIXELS * 4);
    const x = selected.frame.bitmap.toString(2).length - 1;
    const sample = (px, py) => Array.from(pixels.slice((py * SPRITE_PIXELS + px) * 4, (py * SPRITE_PIXELS + px) * 4 + 4));
    assert.deepEqual(sample(x + 1, 1), [0, 0, 0, 255], 'Current canonical frame pixel must remain black');
    assert.deepEqual(sample(x + 1, 0), [255, 255, 255, 255], 'White outline must follow the current frame');
  }
}
const pixels = outlinedPixels(decodeGenerationSprites(1n, 0, 1, Array(64).fill(singlePixel)).clips.idle.down[0]);
const rgba = (x, y) => Array.from(pixels.slice((y * SPRITE_PIXELS + x) * 4, (y * SPRITE_PIXELS + x) * 4 + 4));
assert.deepEqual(rgba(1, 1), [0, 0, 0, 255], 'Canonical black pixel is unchanged');
assert.deepEqual(rgba(0, 0), [255, 255, 255, 255], 'Outline extends beyond top-left edge');
assert.deepEqual(rgba(2, 1), [255, 255, 255, 255], 'Outline follows occupied pixel');
assert.deepEqual(rgba(17, 17), [0, 0, 0, 0], 'Background remains transparent');
console.log('PASS canonical Friend frame selection, Colossus fallback, 64-frame outline, transparency and family identity');
