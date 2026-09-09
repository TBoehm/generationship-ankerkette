// Design reference: CLAUDE.md, colour palette and mobile-first rules
import { useEffect, useRef } from 'react';
import { useScene } from '../hooks/useScene.js';
import './SceneCanvas.css';

/**
 * An empty host that React renders no children into. The scene owns what is
 * inside it, so React must never diff against it. The element sits above the
 * routes in the tree, which is what keeps one context alive across navigation.
 */
export default function SceneCanvas({ onReady, reducedMotion }) {
  const hostRef = useRef(null);
  const stageRef = useScene({ hostRef, onReady, reducedMotion });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const resize = () => {
      const stage = stageRef.current;
      if (stage) stage.resize(host.clientWidth, host.clientHeight);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => observer.disconnect();
  }, [stageRef]);

  return <div className="scene-canvas" ref={hostRef} aria-hidden="true" />;
}
