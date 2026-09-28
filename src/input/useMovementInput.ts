import { useEffect, useRef } from 'react';
export type InputVector = { x: number; z: number };
export function useMovementInput(paused: boolean, interact: () => void) {
  const keys = useRef(new Set<string>());
  const touch = useRef<InputVector>({ x: 0, z: 0 });
  const action = useRef(interact); action.current = interact;
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
      keys.current.add(event.key.toLowerCase());
      if (!event.repeat && (event.key.toLowerCase() === 'e' || event.key === ' ')) action.current();
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); };
  }, []);
  useEffect(() => { if (paused) { keys.current.clear(); touch.current = { x: 0, z: 0 }; } }, [paused]);
  return {
    vector: () => {
      if (paused) return { x: 0, z: 0 };
      const k = keys.current;
      const x = Number(k.has('d') || k.has('arrowright')) - Number(k.has('a') || k.has('arrowleft')) + touch.current.x;
      const z = Number(k.has('s') || k.has('arrowdown')) - Number(k.has('w') || k.has('arrowup')) + touch.current.z;
      const length = Math.hypot(x, z);
      return length > 1 ? { x: x / length, z: z / length } : { x, z };
    },
    setTouch: (value: InputVector) => { touch.current = value; },
  };
}
