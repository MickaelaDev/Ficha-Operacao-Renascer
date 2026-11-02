import { useEffect, useRef } from 'react';

const EMBERS = Array.from({ length: 24 }, (_, index) => {
  const left = (index * 37 + 11) % 100;
  const bottom = (index * 19 + 4) % 96;
  const delay = ((index * 1.9) % 18).toFixed(2);
  const duration = 14 + (index % 8) * 1.7;
  const drift = (index % 2 === 0 ? 1 : -1) * (16 + (index % 6) * 9);
  const size = 2 + (index % 3);
  const opacity = (0.18 + (index % 4) * 0.08).toFixed(2);

  return {
    left: `${left}%`,
    bottom: `${bottom}%`,
    size: `${size}px`,
    delay: `-${delay}s`,
    duration: `${duration.toFixed(2)}s`,
    drift: `${drift}px`,
    opacity,
  };
});

export default function Atmosphere() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame = 0;
    let x = 50;
    let y = 36;

    const apply = () => {
      frame = 0;
      root.style.setProperty('--spot-x', `${x}%`);
      root.style.setProperty('--spot-y', `${y}%`);
    };

    const onMove = (event) => {
      x = (event.clientX / window.innerWidth) * 100;
      y = (event.clientY / window.innerHeight) * 100;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className="atmosphere" aria-hidden="true">
      <div className="atmosphere__grid" />
      <div className="atmosphere__veins" />
      <div className="atmosphere__pulse" />
      <div className="atmosphere__fog atmosphere__fog--a" />
      <div className="atmosphere__fog atmosphere__fog--b" />
      <div className="atmosphere__embers">
        {EMBERS.map((ember, index) => (
          <span
            key={index}
            className="atmosphere__ember"
            style={{
              left: ember.left,
              bottom: ember.bottom,
              width: ember.size,
              height: ember.size,
              animationDelay: ember.delay,
              animationDuration: ember.duration,
              '--ember-drift': ember.drift,
              '--ember-opacity': ember.opacity,
            }}
          />
        ))}
      </div>
      <div className="atmosphere__spot" />
      <div className="atmosphere__scan" />
      <div className="atmosphere__noise" />
      <div className="atmosphere__vignette" />
    </div>
  );
}
