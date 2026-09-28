import type { GameComponentProps } from '@rarefriends/friendsdk/runtime';
import { friendIdentity } from './friendIdentity';
export function gameSession(props: GameComponentProps) {
  return { identity: friendIdentity(props.friendId), paused: props.paused, client: props.client };
}
