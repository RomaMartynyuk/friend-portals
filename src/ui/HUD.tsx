import type { SceneId } from '../game/GameState';
import type { EchoPuzzleState } from '../portals/echo/EchoPuzzleState';
function echoLabel(echo: EchoPuzzleState) {
  const round = Math.min(echo.round + 1, 3);
  if (echo.phase === 'input') return `ROUND ${round} · ECHO  ${echo.inputIndex} / ${echo.sequences[echo.round].length}`;
  if (echo.phase === 'playback') return `ROUND ${round} · LISTEN`;
  if (echo.phase === 'retry') return `ROUND ${round} · LISTEN AGAIN`;
  if (echo.phase === 'round-complete') return `ECHO ${['I', 'II', 'III'][echo.completedRounds - 1]} RESTORED`;
  if (echo.phase === 'finale') return 'GARDEN RESTORED';
  if (echo.phase === 'shard-ready') return 'SHARD II AWAITS';
  if (echo.phase === 'claimed') return 'ECHO GARDEN RESTORED';
  return 'LISTEN · REMEMBER · REPEAT';
}
export function HUD({ friend, scene, nearby, onInteract, muted, onToggleMute, shards, seals, canReset, onReset, intro, banner, portalStatuses, echo, echoCallout }: {
  friend: string; scene: SceneId; nearby: string | null; onInteract: () => void; muted: boolean; onToggleMute: () => void;
  shards: number; seals: number; canReset: boolean; onReset: () => void; intro: boolean; banner: string | null; portalStatuses: readonly string[];
  echo: EchoPuzzleState; echoCallout: string | null;
}) {
  const title = scene === 'ISLAND' ? 'THE FLOATING ISLE' : scene === 'TEMPLE_LIGHT' ? 'TEMPLE OF LIGHT' : 'ECHO GARDEN';
  const subtitle = scene === 'ISLAND' ? shards === 0 ? 'Find the first portal' : shards === 1 ? 'The Echo Garden awakens' : 'The Balance Temple awakens'
    : scene === 'TEMPLE_LIGHT' ? `LIGHT SEALS  ${seals} / 3` : echoLabel(echo);
  return <div className="hud">
    <p className="sr-only" role="status" data-testid="portal-status">{portalStatuses.map((status, index) => `Portal ${index + 1} ${status}`).join('. ')}</p>
    {scene === 'ECHO_GARDEN' && <p className="sr-only" role="status" data-testid="echo-phase">{echo.phase}; round {Math.min(echo.round + 1, 3)}; completed {echo.completedRounds}; input {echo.inputIndex}</p>}
    <div className="hud-top"><div className="brand"><strong>FRIEND PORTALS</strong><span>THE FOUR SHRINES</span></div>
      <div className="hud-right"><span className="shards" data-testid="shard-count">SHARDS {shards} / 4 <b>{Array.from({ length: 4 }, (_, i) => i < shards ? '◆' : '◇').join(' ')}</b></span><span className="friend-label">{friend}</span><button className="sound-button" onClick={onToggleMute}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button></div></div>
    <div className={`scene-title ${scene === 'TEMPLE_LIGHT' || scene === 'ECHO_GARDEN' ? 'temple-title' : ''}`}><span>{title}</span><small>{subtitle}</small></div>
    {scene === 'TEMPLE_LIGHT' && canReset && <button className="puzzle-reset" onClick={onReset}>R · RESET PUZZLE</button>}
    {intro && <div className={`puzzle-intro ${scene === 'ECHO_GARDEN' ? 'echo-intro' : ''}`}><strong>{title}</strong><span>{scene === 'TEMPLE_LIGHT' ? 'Redirect the light into all three seals.' : 'Listen. Remember. Repeat.'}</span></div>}
    {echoCallout && <div className="echo-callout" role="status">{echoCallout}</div>}
    {banner && <div className={`acquired-banner ${scene === 'ECHO_GARDEN' ? 'echo-banner' : ''}`} role="status">{banner}</div>}
    {nearby && <button className="interaction" onClick={onInteract}><kbd>E</kbd> {nearby}</button>}
    <div className="controls-hint">WASD / ARROWS TO MOVE · E TO INTERACT</div>
  </div>;
}
