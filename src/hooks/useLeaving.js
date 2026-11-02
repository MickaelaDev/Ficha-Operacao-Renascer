import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Controla a animação de saída de cards antes de removê-los do estado.
 *  - leaving: Set com os ids que estão desaparecendo
 *  - leave(id, commit): anima e chama commit() depois do tempo da animação
 */
export function useLeaving(ms = 340) {
  const [leaving, setLeaving] = useState(() => new Set());
  const timers = useRef(new Map());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const leave = useCallback(
    (id, commit) => {
      setLeaving((prev) => new Set(prev).add(id));
      const timer = window.setTimeout(() => {
        commit();
        setLeaving((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timers.current.delete(id);
      }, ms);
      timers.current.set(id, timer);
    },
    [ms],
  );

  return { leaving, leave };
}
