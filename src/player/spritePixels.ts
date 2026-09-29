import type { SpriteFrame } from '@rarefriends/friendsdk/sprites';

export const SPRITE_PIXELS = 18;

/** White pixel-neighbour silhouette behind the unmodified canonical bitmap. */
export function outlinedPixels(frame: SpriteFrame): Uint8ClampedArray {
  const data = new Uint8ClampedArray(SPRITE_PIXELS * SPRITE_PIXELS * 4);
  const occupied = (x: number, y: number) => x >= 0 && x < 16 && y >= 0 && y < 16 && frame.rows[y]?.[x] === '#';
  const write = (x: number, y: number, color: number) => {
    const offset = ((y + 1) * SPRITE_PIXELS + x + 1) * 4;
    data[offset] = color; data[offset + 1] = color; data[offset + 2] = color; data[offset + 3] = 255;
  };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!occupied(x, y)) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!occupied(x + dx, y + dy)) write(x + dx, y + dy, 255);
    }
  }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (occupied(x, y)) write(x, y, 0);
  return data;
}
