import { useRef, useState } from 'react';
import type { InputVector } from '../input/useMovementInput';
export function MobileControls({ onMove, onInteract, canInteract, paused }: {
  onMove: (value: InputVector) => void; onInteract: () => void; canInteract: boolean; paused: boolean;
}) {
  const pad = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<InputVector>({ x: 0, z: 0 });
  const move = (clientX: number, clientY: number) => {
    const rect = pad.current?.getBoundingClientRect(); if (!rect || paused) return;
    const x = Math.max(-1, Math.min(1, (clientX - rect.left - rect.width / 2) / (rect.width * 0.35)));
    const z = Math.max(-1, Math.min(1, (clientY - rect.top - rect.height / 2) / (rect.height * 0.35)));
    setKnob({ x, z }); onMove({ x, z });
  };
  const stop = () => { setKnob({ x: 0, z: 0 }); onMove({ x: 0, z: 0 }); };
  return <div className="mobile-controls">
    <div ref={pad} className="joystick" role="group" aria-label="Movement joystick"
      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(event.clientX, event.clientY); }}
      onPointerMove={event => { if (event.buttons) move(event.clientX, event.clientY); }} onPointerUp={stop} onPointerCancel={stop}>
      <span className="joystick-knob" style={{ transform: `translate(${knob.x * 21}px, ${knob.z * 21}px)` }} />
    </div>
    <button className="touch-action" disabled={!canInteract || paused} onClick={onInteract}>ACTION</button>
  </div>;
}
