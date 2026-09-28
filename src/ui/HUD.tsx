import type { SceneId } from '../game/GameState';
export function HUD({ friend, scene, nearby, onInteract, onReturn, muted, onToggleMute }: {
  friend: string; scene: SceneId; nearby: string | null; onInteract: () => void; onReturn: () => void; muted: boolean; onToggleMute: () => void;
}) {
  return <div className="hud">
    <div className="hud-top"><div className="brand"><strong>FRIEND PORTALS</strong><span>THE FOUR SHRINES</span></div>
      <div className="hud-right"><span className="shards">SHARDS <b>◇ ◇ ◇ ◇</b></span><span className="friend-label">{friend}</span><button className="sound-button" onClick={onToggleMute}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button></div></div>
    {scene === 'PORTAL_1_TEST' && <button className="room-return" onClick={onReturn}>← RETURN TO ISLAND</button>}
    <div className="scene-title"><span>{scene === 'ISLAND' ? 'THE FLOATING ISLE' : 'TEMPLE OF LIGHT'}</span><small>{scene === 'ISLAND' ? 'Find the first portal' : 'A test chamber · puzzle arrives in Phase 2'}</small></div>
    {nearby && <button className="interaction" onClick={onInteract}><kbd>E</kbd> {nearby}</button>}
    <div className="controls-hint">WASD / ARROWS TO MOVE · E TO INTERACT</div>
  </div>;
}
