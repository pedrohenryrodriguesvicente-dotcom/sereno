import { RefObject, useEffect, useState } from 'react';

// Cuantización del progreso: 1/2000 (≈2px de scroll en un hero de 500vh).
// Evita re-renders por movimientos sub-píxel sin efecto visual posible.
const PROGRESS_STEP = 2000;

/**
 * Mapea la posición de scroll del contenedor a (frame, progreso 0..1).
 * El contenedor debe ser más alto que el viewport (p. ej. 500vh) y contener
 * un hijo `sticky` que ocupa toda la pantalla.
 *
 * Rendimiento: la geometría (top del contenedor y rango scrolleable) se
 * cachea y solo se recalcula en resize; el handler de scroll no lee el DOM
 * (nada de getBoundingClientRect por evento) — solo aritmética con scrollY
 * dentro de requestAnimationFrame.
 */
export function useScrollFrame(
  containerRef: RefObject<HTMLElement | null>,
  totalFrames: number,
) {
  const [state, setState] = useState({ frame: 0, progress: 0 });

  useEffect(() => {
    let ticking = false;
    // Geometría cacheada (px de documento).
    let containerTop = 0;
    let scrollable = 1;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      containerTop = rect.top + window.scrollY;
      scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
    };

    const compute = () => {
      ticking = false;
      const scrolled = Math.max(0, window.scrollY - containerTop);
      const raw = Math.min(scrolled / scrollable, 1);
      const progress = Math.round(raw * PROGRESS_STEP) / PROGRESS_STEP;
      const frame = Math.min(
        totalFrames - 1,
        Math.floor(progress * (totalFrames - 1)),
      );
      setState((prev) =>
        prev.frame === frame && prev.progress === progress
          ? prev
          : { frame, progress },
      );
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    measure();
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [containerRef, totalFrames]);

  return state;
}
