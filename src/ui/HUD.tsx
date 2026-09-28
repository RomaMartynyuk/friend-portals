import type { SceneId } from '../game/GameState';
export function HUD({ friend, scene, nearby, onInteract, muted, onToggleMute, shards, seals, canReset, onReset, intro, banner, portalStatuses }: {
  friend: string; scene: SceneId; nearby: string | null; onInteract: () => void; muted: boolean; onToggleMute: () => void;
  shards: number; seals: number; canReset: boolean; onReset: () => void; intro: boolean; banner: string | null; portalStatuses: readonly string[];
}) {
  return <div className="hud">
    <p className="sr-only" role="status" data-testid="portal-status">{portalStatuses.map((status, index) => `Portal ${index + 1} ${status}`).join('. ')}</p>
    <div className="hud-top"><div className="brand"><strong>FRIEND PORTALS</strong><span>THE FOUR SHRINES</span></div>
      <div className="hud-right"><span className="shards" data-testid="shard-count">SHARDS {shards} / 4 <b>{Array.from({ length: 4 }, (_, i) => i < shards ? '◆' : '◇').join(' ')}</b></span><span className="friend-label">{friend}</span><button className="sound-button" onClick={onToggleMute}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button></div></div>
    <div className={`scene-title ${scene === 'TEMPLE_LIGHT' ? 'temple-title' : ''}`}><span>{scene === 'ISLAND' ? 'THE FLOATING ISLE' : 'TEMPLE OF LIGHT'}</span><small>{scene === 'ISLAND' ? (shards ? 'The Echo Garden awakens' : 'Find the first portal') : `LIGHT SEALS  ${seals} / 3`}</small></div>
    {scene === 'TEMPLE_LIGHT' && canReset && <button className="puzzle-reset" onClick={onReset}>R · RESET PUZZLE</button>}
    {intro && <div className="puzzle-intro"><strong>TEMPLE OF LIGHT</strong><span>Redirect the light into all three seals.</span></div>}
    {banner && <div className="acquired-banner" role="status">{banner}</div>}
    {nearby && <button className="interaction" onClick={onInteract}><kbd>E</kbd> {nearby}</button>}
    <div className="controls-hint">WASD / ARROWS TO MOVE · E TO INTERACT</div>
  </div>;
}
