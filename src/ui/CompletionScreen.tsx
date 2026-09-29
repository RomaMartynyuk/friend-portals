import { useState } from 'react';
import { JourneySigilEmblem } from '../finale/JourneySigil';
import type { JourneySigilConfig } from '../finale/JourneySigilConfig';

export function CompletionScreen({ friend, sigil, onExplore, onNewJourney }: { friend: string; sigil: JourneySigilConfig; onExplore: () => void; onNewJourney: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return <div className="completion-scrim" role="dialog" aria-modal="true" aria-label="Journey restored">
    <section className="completion-card">
      <span className="completion-eyebrow">FRIEND PORTALS</span>
      <h1>JOURNEY RESTORED</h1>
      <JourneySigilEmblem config={sigil} />
      <p className="completion-identity">{friend}</p>
      <p className="completion-count">4 / 4 PORTALS RESTORED</p>
      <p className="completion-id">JOURNEY {sigil.id}</p>
      {confirm ? <div className="completion-confirm">
        <p>Begin a new journey?<br /><small>The current session will restart.</small></p>
        <div className="completion-actions"><button onClick={() => setConfirm(false)}>CANCEL</button><button className="primary" onClick={onNewJourney}>BEGIN</button></div>
      </div> : <div className="completion-actions"><button className="primary" onClick={onExplore}>EXPLORE RESTORED ISLAND</button><button onClick={() => setConfirm(true)}>NEW JOURNEY</button></div>}
    </section>
  </div>;
}
