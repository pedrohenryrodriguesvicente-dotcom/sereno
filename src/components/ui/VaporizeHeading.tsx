'use client';
import { createElement, useEffect, useRef, useState } from 'react';
import VaporizeTextCycle, { Tag } from '@/components/ui/vapour-text-effect';
import { useInView } from '@/hooks/useInView';

interface VaporizeHeadingProps {
  text: string;
  /** Etiqueta semántica (elemento SEO oculto del canvas y del fallback). */
  tag?: Tag;
  /** Nombre REAL de la familia (p. ej. fraunces.style.fontFamily). */
  fontFamily: string;
  fontWeight?: number;
  /** Tope de tamaño en desktop (px). */
  maxFontSize?: number;
  /** Por debajo de este tamaño se muestra el fallback estático. */
  minFontSize?: number;
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  /** Clases del texto estático (antes y después de la animación). */
  fallbackClassName?: string;
}

type Phase = 'idle' | 'playing' | 'handoff' | 'done';

// Duración del cross-fade canvas→texto al terminar (absorbe cualquier
// diferencia sub-píxel entre el último fotograma y el texto DOM).
const HANDOFF_MS = 120;

// Salvaguarda: si el ensamblado no notifica su fin (canvas bloqueado, pestaña
// en segundo plano...), se fija el texto estático pasado este tiempo.
const SAFETY_TIMEOUT_MS = 5000;

/**
 * Encabezado con efecto de ENSAMBLADO de reproducción única: al entrar en
 * viewport por primera vez, las partículas parten dispersas e invisibles y
 * convergen para FORMAR el texto (sin fase de desintegración); al terminar
 * queda texto DOM real, nítido y seleccionable (cero rAF después).
 * Mide con la fuente cargada para caber siempre en UNA línea; con
 * prefers-reduced-motion o sin canvas se muestra directamente el estático.
 */
export default function VaporizeHeading({
  text,
  tag = Tag.P,
  fontFamily,
  fontWeight = 400,
  maxFontSize = 96,
  minFontSize = 22,
  alignment = 'center',
  color = 'rgb(26, 26, 24)',
  fallbackClassName = '',
}: VaporizeHeadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  // El SSR muestra el texto (SEO/no-JS); tras hidratar se oculta en 'idle'
  // para que el punto de partida visual del ensamblado sea vacío.
  const [hydrated, setHydrated] = useState(false);
  const inView = useInView(containerRef, 0.35);

  useEffect(() => setHydrated(true), []);

  // Ajuste a una línea: mide el texto con la fuente real ya cargada.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    const fit = () => {
      if (cancelled) return;
      const width = el.clientWidth;
      if (!width) return;
      const probe = document.createElement('canvas');
      const ctx = probe.getContext('2d');
      if (!ctx) {
        setFontSize(null);
        return;
      }
      const BASE = 100;
      ctx.font = `${fontWeight} ${BASE}px ${fontFamily}`;
      const measured = ctx.measureText(text).width;
      if (!measured) {
        setFontSize(null);
        return;
      }
      const fitted = Math.floor(
        Math.min(maxFontSize, ((width * 0.98) / measured) * BASE),
      );
      setFontSize(fitted);
    };

    const fontsReady: Promise<unknown> =
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.ready
        : Promise.resolve();
    fontsReady.then(fit);

    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [text, fontFamily, fontWeight, maxFontSize]);

  // Disparo único: solo la primera vez que entra en viewport (useInView es
  // de una sola activación). idle → playing → done; nunca vuelve atrás.
  useEffect(() => {
    if (!inView || phase !== 'idle' || fontSize === null) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || fontSize < minFontSize) {
      setPhase('done');
    } else {
      setPhase('playing');
    }
  }, [inView, phase, fontSize, minFontSize]);

  // Salvaguarda de legibilidad mientras reproduce.
  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setTimeout(() => setPhase('done'), SAFETY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Fin del cross-fade: desmonta el canvas un poco después de que su
  // opacidad llegue a 0.
  useEffect(() => {
    if (phase !== 'handoff') return;
    const t = setTimeout(() => setPhase('done'), HANDOFF_MS + 40);
    return () => clearTimeout(t);
  }, [phase]);

  // Altura común a TODAS las fases: la define siempre el texto en flujo,
  // y el canvas (overlay absoluto) usa exactamente la misma.
  const lineHeightPx = fontSize !== null ? Math.ceil(fontSize * 1.4) : null;
  const canvasMounted =
    (phase === 'playing' || phase === 'handoff') && fontSize !== null;
  // El texto en flujo se oculta mientras el canvas anima (y en idle tras
  // hidratar, para que el ensamblado parta de vacío). Sigue reservando la
  // misma altura: el swap nunca reajusta el layout.
  const textHidden = phase === 'playing' || (phase === 'idle' && hydrated);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Texto estático: SIEMPRE en el flujo (SSR, oculto durante la
          animación, visible desde el handoff). Mismo fontFamily/size/weight
          que el canvas, letter-spacing neutro (el canvas no aplica tracking)
          y una sola línea garantizada. */}
      {createElement(
        tag,
        {
          className: fallbackClassName,
          style: {
            fontFamily,
            fontWeight,
            ...(fontSize !== null && fontSize >= minFontSize
              ? {
                  fontSize: `${fontSize}px`,
                  lineHeight: `${lineHeightPx}px`,
                  letterSpacing: 'normal',
                  whiteSpace: 'nowrap' as const,
                  textAlign: alignment,
                }
              : {}),
            ...(textHidden ? { visibility: 'hidden' as const } : {}),
          },
        },
        text,
      )}

      {/* Canvas: overlay absoluto sobre el texto, misma altura. En el
          handoff se desvanece (~120ms) mientras el texto ya está debajo:
          cross-fade sin corte seco ni salto. */}
      {canvasMounted && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${lineHeightPx}px`,
            opacity: phase === 'handoff' ? 0 : 1,
            transition: `opacity ${HANDOFF_MS}ms linear`,
            pointerEvents: 'none',
          }}
        >
          <VaporizeTextCycle
            texts={[text]}
            font={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
            }}
            color={color}
            spread={5}
            density={5}
            animation={{
              // En appearOnly, vaporizeDuration es la duración del ensamblado.
              // Antes: 2.5s vaporizar + 1s reaparecer = 3.5s; ahora 2.2s (−37%).
              vaporizeDuration: 2.2,
              fadeInDuration: 0.7,
              waitDuration: 0.5,
            }}
            direction="left-to-right"
            alignment={alignment}
            tag={tag}
            playOnce
            appearOnly
            onComplete={() => setPhase('handoff')}
          />
        </div>
      )}
    </div>
  );
}
