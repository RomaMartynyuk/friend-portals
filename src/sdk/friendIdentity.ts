export type FriendIdentity = Readonly<{ id: bigint; label: string; accent: string }>;
const accents = ['#f9c66d', '#92d5b1', '#de9f80', '#aaa5ed'];
export function friendIdentity(id: bigint): FriendIdentity {
  return { id, label: `Friend #${id.toString().padStart(4, '0')}`, accent: accents[Number(id % 4n)] };
}
