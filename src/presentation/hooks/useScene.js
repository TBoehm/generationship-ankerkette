import { useEffect, useRef } from 'react';

/**
 * The single place where React touches the scene. The canvas is mounted above
 * the routes, so navigating never tears the context down, and this effect runs
 * once for the life of the page.
 *
 * The cancelled flag is not defensive noise. React runs mount, cleanup and
 * mount again in strict mode, and the scene arrives through a dynamic import
 * that can resolve after the cleanup. Without the flag the second mount adds a
 * second WebGL context; browsers cap contexts and drop the oldest without an
 * error, which surfaces much later as a view that went black for no reason.
 */
const loadStageModule = () => import('../../infrastructure/scene/stage.js');

export function useScene({ hostRef, loadStage = loadStageModule, onReady, reducedMotion }) {
  const stageRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let stage = null;

    loadStage()
      .then((module) => {
        if (cancelled || !hostRef.current) return;
        stage = module.createStage({
          host: hostRef.current,
          reducedMotion,
        });
        stageRef.current = stage;
        stage.start();
        if (onReady) onReady(stage);
      })
      .catch(() => {
        // A missing chunk must not take the page down with it.
      });

    return () => {
      cancelled = true;
      if (stage) {
        stage.dispose();
        stage = null;
      }
      stageRef.current = null;
    };
    // The scene owns its own state for the life of the page. Re-running this
    // effect would mean a second context, which is the one thing it must not do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return stageRef;
}
