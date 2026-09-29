import { createFriendReader, type GenerationSprites } from '@rarefriends/friendsdk/sprites';

const reader = createFriendReader();

/** Token ID is supplied by the trusted SDK session, never by a game fallback. */
export async function loadCanonicalFriend(tokenId: bigint): Promise<GenerationSprites> {
  const sprites = await reader.read(tokenId);
  if (sprites.tokenId !== tokenId || sprites.clips.idle.down.length !== 8 || sprites.clips.walk.right.length !== 8) {
    throw new Error('FriendSDK returned incomplete artwork for the selected Friend.');
  }
  return sprites;
}
