import { useEffect, useState } from 'react';

/**
 * Cuenta de 0 hasta `target` cuando `start` es true, con easing suave.
 * Si prefers-reduced-motion está activo, salta directo al valor final.
 */
export function useCountUp(target: number, start: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min((t - t0) / duration, 1);
      // ease-out cúbico
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);

  return value;
}
