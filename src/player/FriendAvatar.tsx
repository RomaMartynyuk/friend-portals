import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, DoubleSide, NearestFilter, Quaternion, type Group, type MeshBasicMaterial } from 'three';
import { spriteFrame, type GenerationSprites, type SpriteFacing } from '@rarefriends/friendsdk/sprites';
import { outlinedPixels, SPRITE_PIXELS } from './spritePixels';

export const FRIEND_IDLE_FPS = 4.5;
export const FRIEND_WALK_FPS = 9;
const familyColors: Record<GenerationSprites['familyName'], string> = {
  Skeleton: '#e5e9da', Mask: '#d5d9db', Family: '#f4d6a6', Cellular: '#9fd7b8',
  Asymmetry: '#d5a8e4', Hoverer: '#a5dcef', Colossus: '#cab6a2', Sparkling: '#fff4ba', Hollow: '#c3d9e2',
};

export function FriendAvatar({ sprites, moving, facing, lastSide, reducedMotion, celebrate = false, reaction = 0, departing = false }: {
  sprites: GenerationSprites; moving: React.RefObject<boolean>; facing: React.RefObject<SpriteFacing>;
  lastSide: React.RefObject<'left' | 'right'>; reducedMotion: boolean; celebrate?: boolean; reaction?: number; departing?: boolean;
}) {
  const body = useRef<Group>(null);
  const billboard = useRef<Group>(null);
  const material = useRef<MeshBasicMaterial>(null);
  const celebrationStarted = useRef<number | null>(null);
  const reactionStarted = useRef<number | null>(null);
  const seenReaction = useRef(reaction);
  const drawn = useRef<bigint | null>(null);
  const born = useRef<number | null>(null);
  const departureStarted = useRef<number | null>(null);
  const parentWorld = useRef(new Quaternion());
  const { texture, context, frames } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_PIXELS; canvas.height = SPRITE_PIXELS;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Canvas 2D is required for canonical Friend artwork.');
    context.imageSmoothingEnabled = false;
    const texture = new CanvasTexture(canvas);
    texture.magFilter = NearestFilter; texture.minFilter = NearestFilter; texture.generateMipmaps = false;
    return { texture, context, frames: new Map<bigint, Uint8ClampedArray>() };
  }, [sprites.cacheKey]);
  useEffect(() => { drawn.current = null; born.current = null; return () => texture.dispose(); }, [texture]);
  useFrame(({ camera, clock }) => {
    if (!body.current || !billboard.current) return;
    const t = clock.elapsedTime;
    born.current ??= t;
    body.current.parent?.getWorldQuaternion(parentWorld.current);
    billboard.current.quaternion.copy(parentWorld.current.invert().multiply(camera.quaternion));
    const walking = moving.current;
    const frameIndex = Math.floor(t * (walking ? FRIEND_WALK_FPS : FRIEND_IDLE_FPS)) % 8;
    const selected = spriteFrame(sprites, facing.current, walking, frameIndex, lastSide.current);
    if (drawn.current !== selected.frame.bitmap) {
      let pixels = frames.get(selected.frame.bitmap);
      if (!pixels) { pixels = outlinedPixels(selected.frame); frames.set(selected.frame.bitmap, pixels); }
      context.putImageData(new ImageData(new Uint8ClampedArray(pixels), SPRITE_PIXELS, SPRITE_PIXELS), 0, 0);
      texture.needsUpdate = true; drawn.current = selected.frame.bitmap;
    }
    if (celebrate && celebrationStarted.current === null) celebrationStarted.current = t;
    if (!celebrate) celebrationStarted.current = null;
    if (seenReaction.current !== reaction) { seenReaction.current = reaction; reactionStarted.current = t; }
    if (departing && departureStarted.current === null) departureStarted.current = t;
    if (!departing) departureStarted.current = null;
    const pulseAge = reactionStarted.current === null ? 99 : t - reactionStarted.current;
    const arrivalAge = t - born.current;
    const departureOpacity = departureStarted.current === null ? 1 : Math.max(0, 1 - (t - departureStarted.current) / 0.13);
    if (material.current) material.current.opacity = reducedMotion ? 1 : Math.min(1, Math.max(0, arrivalAge / 0.26)) * departureOpacity;
    if (reducedMotion) { body.current.position.y = 0; body.current.rotation.z = 0; body.current.scale.setScalar(1); return; }
    if (celebrationStarted.current !== null && t - celebrationStarted.current < 1.65) {
      const elapsed = t - celebrationStarted.current;
      body.current.position.y = Math.abs(Math.sin(elapsed * Math.PI * 2.4)) * (1 - elapsed / 1.65) * 0.38;
      body.current.rotation.z = Math.sin(elapsed * Math.PI * 2) * 0.12;
    } else {
      body.current.position.y = walking ? Math.abs(Math.sin(t * 9)) * 0.045 : Math.sin(t * 2) * 0.025;
      body.current.rotation.z = 0;
    }
    body.current.scale.setScalar(pulseAge < 0.32 ? 1 + Math.sin((pulseAge / 0.32) * Math.PI) * 0.14 : 1);
  });
  return <group ref={body}>
    <group ref={billboard} position={[0, 1.02, 0]}>
      <mesh><planeGeometry args={[1.92, 1.92]} /><meshBasicMaterial ref={material} map={texture} transparent alphaTest={0.08} depthWrite={false} side={DoubleSide} /></mesh>
    </group>
    {!reducedMotion && <FriendParticles color={familyColors[sprites.familyName]} family={sprites.familyName} moving={moving} reaction={reaction} departing={departing} />}
  </group>;
}

function FriendParticles({ color, family, moving, reaction, departing }: {
  color: string; family: GenerationSprites['familyName']; moving: React.RefObject<boolean>; reaction: number; departing: boolean;
}) {
  const particles = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const lastReaction = useRef(reaction);
  const burst = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!particles.current) return;
    const t = clock.elapsedTime;
    start.current ??= t;
    if (lastReaction.current !== reaction) { lastReaction.current = reaction; burst.current = t; }
    particles.current.children.forEach((child, index) => {
      const age = t - start.current!;
      const familySpeed = family === 'Colossus' ? 1.3 : family === 'Hoverer' ? 2.1 : 1.7;
      const event = departing || (burst.current !== null && t - burst.current < 0.55) || age < 0.32;
      const ambient = family === 'Sparkling' || family === 'Hoverer' || family === 'Hollow';
      child.visible = event || (moving.current || ambient) && Math.floor(t * 4 + index * 2.3) % 4 === 0;
      child.position.set(Math.sin(age * familySpeed + index * 2.4) * (event ? 0.45 : 0.31),
        event ? 0.3 + (age * 2 + index * 0.19) % 1.25 : moving.current ? 0.06 + (index % 2) * 0.08 : 0.6 + Math.sin(age * 2 + index) * 0.22,
        Math.cos(age * 1.3 + index * 2.1) * 0.23);
    });
  });
  return <group ref={particles}>{Array.from({ length: 5 }, (_, i) => <mesh key={i}>
    <boxGeometry args={[0.055, 0.055, 0.055]} /><meshBasicMaterial color={i === 0 ? '#ffffff' : color} transparent opacity={i === 0 ? 0.8 : 0.55} depthWrite={false} />
  </mesh>)}</group>;
}
