import type { SceneId } from '../game/GameState';
import type { EchoPuzzleState } from '../portals/echo/EchoPuzzleState';
import { plateWeights, type BalancePuzzleState } from '../portals/balance/BalancePuzzleState';
import { balanceLayouts } from '../portals/balance/balanceLayouts';
import type { CelestialPuzzleState } from '../portals/celestial/CelestialPuzzleState';
import { constellations, ringNames } from '../portals/celestial/celestialConfig';
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
export function HUD({ friend, scene, nearby, onInteract, muted, onToggleMute, shards, seals, canReset, onReset, intro, banner, portalStatuses, echo, echoCallout, balance, balanceCallout, celestial, celestialCallout }: {
  friend: string; scene: SceneId; nearby: string | null; onInteract: () => void; muted: boolean; onToggleMute: () => void;
  shards: number; seals: number; canReset: boolean; onReset: () => void; intro: boolean; banner: string | null; portalStatuses: readonly string[];
  echo: EchoPuzzleState; echoCallout: string | null; balance: BalancePuzzleState; balanceCallout: string | null; celestial: CelestialPuzzleState; celestialCallout: string | null;
}) {
  const title = scene === 'ISLAND' ? 'THE FLOATING ISLE' : scene === 'TEMPLE_LIGHT' ? 'TEMPLE OF LIGHT' : scene === 'ECHO_GARDEN' ? 'ECHO GARDEN' : scene === 'TEMPLE_BALANCE' ? 'TEMPLE OF BALANCE' : 'CELESTIAL OBSERVATORY';
  const subtitle = scene === 'ISLAND' ? shards === 0 ? 'Find the first portal' : shards === 1 ? 'The Echo Garden awakens' : shards === 2 ? 'The Balance Temple awakens' : shards === 3 ? 'The Celestial Observatory awakens' : 'THE MONUMENT IS READY'
    : scene === 'TEMPLE_LIGHT' ? `LIGHT SEALS  ${seals} / 3` : scene === 'ECHO_GARDEN' ? echoLabel(echo)
      : scene === 'TEMPLE_BALANCE' ? balance.stage === 0 ? 'I · LEARN WEIGHT' : balance.stage === 1 ? 'II · REDISTRIBUTE' : balance.stage === 2 ? 'III · RESTORE BOTH SIDES' : 'BALANCE RESTORED'
        : celestial.phase === 'claimed' ? 'THE STARS ARE ALIGNED' : celestial.phase === 'shard-ready' ? 'CLAIM THE FINAL SHARD' : `RINGS ALIGNED  ${celestial.lockedCount} / 3`;
  const balanceWeights = plateWeights(balance), balanceTargets = balanceLayouts[balance.layout].targets;
  return <div className="hud">
    <p className="sr-only" role="status" data-testid="portal-status">{portalStatuses.map((status, index) => `Portal ${index + 1} ${status}`).join('. ')}</p>
    {scene === 'ECHO_GARDEN' && <p className="sr-only" role="status" data-testid="echo-phase">{echo.phase}; round {Math.min(echo.round + 1, 3)}; completed {echo.completedRounds}; input {echo.inputIndex}</p>}
    {scene === 'TEMPLE_BALANCE' && <p className="sr-only" role="status" data-testid="balance-state">layout {balance.layout}; stage {balance.stage}; phase {balance.phase}; blocks {balance.blocks.map(cell => cell.join(',')).join('|')}; A {balanceWeights.A}/{balanceTargets.A}; B {balanceWeights.B}/{balanceTargets.B}; C {balanceWeights.C}/{balanceTargets.C}</p>}
    {scene === 'CELESTIAL_OBSERVATORY' && <p className="sr-only" role="status" data-testid="celestial-state">constellation {celestial.constellation}; phase {celestial.phase}; locked {celestial.lockedCount}; retry {celestial.retryRing ?? 'none'}</p>}
    <div className="hud-top"><div className="brand"><strong>FRIEND PORTALS</strong><span>THE FOUR SHRINES</span></div>
      <div className="hud-right"><span className="shards" data-testid="shard-count">SHARDS {shards} / 4 <b>{Array.from({ length: 4 }, (_, i) => i < shards ? '◆' : '◇').join(' ')}</b></span><span className="friend-label">{friend}</span><button className="sound-button" onClick={onToggleMute}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button></div></div>
    <div className={`scene-title ${scene !== 'ISLAND' ? 'temple-title' : ''}`}><span>{title}</span><small>{subtitle}</small></div>
    {scene === 'TEMPLE_BALANCE' && <div className="balance-readout">{(['A', 'B', 'C'] as const).map(id => <span key={id} className={balanceWeights[id] === balanceTargets[id] ? 'balanced' : balanceWeights[id] > balanceTargets[id] ? 'over' : ''}>{id} {balanceWeights[id]} / {balanceTargets[id]}</span>)}</div>}
    {scene === 'CELESTIAL_OBSERVATORY' && <div className="celestial-readout" aria-label="Ring alignment">{ringNames.map((name, index) => <span key={name} className={index < celestial.lockedCount ? 'aligned' : index === celestial.lockedCount && celestial.phase === 'running' ? 'active' : ''}>{index < celestial.lockedCount ? '✦' : '◇'} {name}</span>)}</div>}
    {(scene === 'TEMPLE_LIGHT' || scene === 'TEMPLE_BALANCE' || scene === 'CELESTIAL_OBSERVATORY') && canReset && <button className="puzzle-reset" onClick={onReset}>R · {scene === 'TEMPLE_BALANCE' ? 'RESET TEMPLE' : scene === 'CELESTIAL_OBSERVATORY' ? 'RESET OBSERVATORY' : 'RESET PUZZLE'}</button>}
    {intro && <div className={`puzzle-intro ${scene === 'ECHO_GARDEN' ? 'echo-intro' : scene === 'TEMPLE_BALANCE' ? 'balance-intro' : scene === 'CELESTIAL_OBSERVATORY' ? 'celestial-intro' : ''}`}><strong>{title}</strong><span>{scene === 'TEMPLE_LIGHT' ? 'Redirect the light into all three seals.' : scene === 'ECHO_GARDEN' ? 'Listen. Remember. Repeat.' : scene === 'TEMPLE_BALANCE' ? 'Push weights onto marked plates. Reuse them.' : 'Read the constellation. Lock each symbol at the star marker.'}</span></div>}
    {echoCallout && <div className="echo-callout" role="status">{echoCallout}</div>}
    {balanceCallout && <div className="balance-callout" role="status">{balanceCallout}</div>}
    {celestialCallout && <div className="celestial-callout" role="status">{celestialCallout}{celestial.phase === 'clue' && <small>{constellations[celestial.constellation].name}</small>}</div>}
    {banner && <div className={`acquired-banner ${scene === 'ECHO_GARDEN' ? 'echo-banner' : scene === 'TEMPLE_BALANCE' ? 'balance-banner' : scene === 'CELESTIAL_OBSERVATORY' ? 'celestial-banner' : ''}`} role="status">{banner}</div>}
    {nearby && <button className="interaction" onClick={onInteract}><kbd>E</kbd> {nearby}</button>}
    <div className="controls-hint">WASD / ARROWS TO MOVE · E TO INTERACT</div>
  </div>;
}
