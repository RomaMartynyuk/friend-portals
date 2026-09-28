import type { SceneId } from '../game/GameState';
import type { EchoPuzzleState } from '../portals/echo/EchoPuzzleState';
import { plateWeights, type BalancePuzzleState } from '../portals/balance/BalancePuzzleState';
import { balanceLayouts } from '../portals/balance/balanceLayouts';
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
export function HUD({ friend, scene, nearby, onInteract, muted, onToggleMute, shards, seals, canReset, onReset, intro, banner, portalStatuses, echo, echoCallout, balance, balanceCallout }: {
  friend: string; scene: SceneId; nearby: string | null; onInteract: () => void; muted: boolean; onToggleMute: () => void;
  shards: number; seals: number; canReset: boolean; onReset: () => void; intro: boolean; banner: string | null; portalStatuses: readonly string[];
  echo: EchoPuzzleState; echoCallout: string | null; balance: BalancePuzzleState; balanceCallout: string | null;
}) {
  const title = scene === 'ISLAND' ? 'THE FLOATING ISLE' : scene === 'TEMPLE_LIGHT' ? 'TEMPLE OF LIGHT' : scene === 'ECHO_GARDEN' ? 'ECHO GARDEN' : 'TEMPLE OF BALANCE';
  const subtitle = scene === 'ISLAND' ? shards === 0 ? 'Find the first portal' : shards === 1 ? 'The Echo Garden awakens' : shards === 2 ? 'The Balance Temple awakens' : 'The Celestial Mechanism awakens'
    : scene === 'TEMPLE_LIGHT' ? `LIGHT SEALS  ${seals} / 3` : scene === 'ECHO_GARDEN' ? echoLabel(echo)
      : balance.stage === 0 ? 'I · LEARN WEIGHT' : balance.stage === 1 ? 'II · REDISTRIBUTE' : balance.stage === 2 ? 'III · RESTORE BOTH SIDES' : 'BALANCE RESTORED';
  const balanceWeights = plateWeights(balance), balanceTargets = balanceLayouts[balance.layout].targets;
  return <div className="hud">
    <p className="sr-only" role="status" data-testid="portal-status">{portalStatuses.map((status, index) => `Portal ${index + 1} ${status}`).join('. ')}</p>
    {scene === 'ECHO_GARDEN' && <p className="sr-only" role="status" data-testid="echo-phase">{echo.phase}; round {Math.min(echo.round + 1, 3)}; completed {echo.completedRounds}; input {echo.inputIndex}</p>}
    {scene === 'TEMPLE_BALANCE' && <p className="sr-only" role="status" data-testid="balance-state">layout {balance.layout}; stage {balance.stage}; phase {balance.phase}; blocks {balance.blocks.map(cell => cell.join(',')).join('|')}; A {balanceWeights.A}/{balanceTargets.A}; B {balanceWeights.B}/{balanceTargets.B}; C {balanceWeights.C}/{balanceTargets.C}</p>}
    <div className="hud-top"><div className="brand"><strong>FRIEND PORTALS</strong><span>THE FOUR SHRINES</span></div>
      <div className="hud-right"><span className="shards" data-testid="shard-count">SHARDS {shards} / 4 <b>{Array.from({ length: 4 }, (_, i) => i < shards ? '◆' : '◇').join(' ')}</b></span><span className="friend-label">{friend}</span><button className="sound-button" onClick={onToggleMute}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button></div></div>
    <div className={`scene-title ${scene !== 'ISLAND' ? 'temple-title' : ''}`}><span>{title}</span><small>{subtitle}</small></div>
    {scene === 'TEMPLE_BALANCE' && <div className="balance-readout">{(['A', 'B', 'C'] as const).map(id => <span key={id} className={balanceWeights[id] === balanceTargets[id] ? 'balanced' : balanceWeights[id] > balanceTargets[id] ? 'over' : ''}>{id} {balanceWeights[id]} / {balanceTargets[id]}</span>)}</div>}
    {(scene === 'TEMPLE_LIGHT' || scene === 'TEMPLE_BALANCE') && canReset && <button className="puzzle-reset" onClick={onReset}>R · {scene === 'TEMPLE_BALANCE' ? 'RESET TEMPLE' : 'RESET PUZZLE'}</button>}
    {intro && <div className={`puzzle-intro ${scene === 'ECHO_GARDEN' ? 'echo-intro' : scene === 'TEMPLE_BALANCE' ? 'balance-intro' : ''}`}><strong>{title}</strong><span>{scene === 'TEMPLE_LIGHT' ? 'Redirect the light into all three seals.' : scene === 'ECHO_GARDEN' ? 'Listen. Remember. Repeat.' : 'Push weights onto marked plates. Reuse them.'}</span></div>}
    {echoCallout && <div className="echo-callout" role="status">{echoCallout}</div>}
    {balanceCallout && <div className="balance-callout" role="status">{balanceCallout}</div>}
    {banner && <div className={`acquired-banner ${scene === 'ECHO_GARDEN' ? 'echo-banner' : scene === 'TEMPLE_BALANCE' ? 'balance-banner' : ''}`} role="status">{banner}</div>}
    {nearby && <button className="interaction" onClick={onInteract}><kbd>E</kbd> {nearby}</button>}
    <div className="controls-hint">WASD / ARROWS TO MOVE · E TO INTERACT</div>
  </div>;
}
