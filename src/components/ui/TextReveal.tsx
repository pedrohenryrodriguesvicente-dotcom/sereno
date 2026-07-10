'use client';
import {
  CSSProperties,
  createElement,
  ElementType,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

interface TextRevealProps {
  /** Texto a revelar; usa '\n' para saltos de línea. */
  text: string;
  /** 'letters' para títulos cortos, 'words' para párrafos largos. */
  mode?: 'letters' | 'words';
  /** Etiqueta semántica del elemento raíz (p, h2, span...). */
  as?: ElementType;
  className?: string;
  /** Retardo inicial en ms. */
  baseDelay?: number;
  /** Stagger entre unidades en ms. */
  step?: number;
  threshold?: number;
}

/**
 * Fases del revelado:
 * - 'ssr': texto plenamente visible (lo que emite el servidor). GARANTÍA:
 *   sin JS, con observer roto o con cualquier fallo, el texto se ve.
 * - 'armed': tras montar (solo si hay IntersectionObserver y no hay
 *   prefers-reduced-motion) las unidades se ocultan vía estilos inline.
 * - 'revealed': al entrar en viewport, doble requestAnimationFrame para
 *   asegurar que el estado oculto se PINTÓ al menos un frame antes del
 *   cambio — así la transición CSS se dispara siempre (sin esto, ocultado
 *   y revelado pueden consolidarse en el mismo repintado y el texto
 *   aparece "de golpe", sin animación).
 */
type Phase = 'ssr' | 'armed' | 'revealed';

// Salvaguarda absoluta: pase lo que pase, el texto nunca queda oculto.
const SAFETY_REVEAL_MS = 15000;

const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

export default function TextReveal({
  text,
  mode = 'letters',
  as = 'span',
  className = '',
  baseDelay = 0,
  step = 30,
  threshold = 0.3,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>('ssr');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Sin animación (correcto, no es fallo): texto visible completo.
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setPhase('revealed');
      return;
    }

    // Si ya está a la vista al montar, no lo ocultes (evita el parpadeo
    // texto visible → oculto → revelado).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setPhase('revealed');
      return;
    }

    setPhase('armed');
    let raf1 = 0;
    let raf2 = 0;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // Doble rAF: el frame oculto queda pintado antes de la transición.
        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => setPhase('revealed'));
        });
      },
      { threshold },
    );
    io.observe(el);

    const safety = setTimeout(() => setPhase('revealed'), SAFETY_REVEAL_MS);

    return () => {
      io.disconnect();
      clearTimeout(safety);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [threshold]);

  // Estilos inline por unidad: solo transform/opacity (composited, sin
  // recálculo de layout). En 'armed' sin transición (ocultado instantáneo,
  // sin fade-out); en 'revealed' con transición + stagger.
  const unitStyle = (delay: number): CSSProperties => {
    if (phase === 'ssr') return {};
    const hidden = phase === 'armed';
    return {
      display: 'inline-block',
      opacity: hidden ? 0 : 1,
      transform: hidden ? 'translateY(0.55em)' : 'none',
      transition: hidden
        ? 'none'
        : `opacity 0.55s ${EASE}, transform 0.55s ${EASE}`,
      transitionDelay: hidden ? '0ms' : `${delay}ms`,
    };
  };

  let unit = 0;
  const nextDelay = () => baseDelay + unit++ * step;

  const renderLine = (line: string, li: number): ReactNode => {
    const words = line.split(' ');
    return (
      <span key={li} className="block" aria-hidden>
        {words.map((word, wi) => (
          <span key={wi}>
            {mode === 'words' ? (
              <span style={unitStyle(nextDelay())}>{word}</span>
            ) : (
              // Las letras van agrupadas por palabra (inline-block) para
              // que el salto de línea natural no parta palabras.
              <span className="inline-block">
                {Array.from(word).map((ch, ci) => (
                  <span key={ci} style={unitStyle(nextDelay())}>
                    {ch}
                  </span>
                ))}
              </span>
            )}
            {wi < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    );
  };

  return createElement(
    as,
    {
      ref,
      className,
      'aria-label': text.replace(/\n/g, ' '),
    } as Record<string, unknown>,
    text.split('\n').map(renderLine),
  );
}
