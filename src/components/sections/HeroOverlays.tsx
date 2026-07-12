'use client';
import { useEffect, useState } from 'react';
import { useFrameProgress } from '@/components/ui/FrameSequence';
import { fraunces } from '@/lib/fonts';

/** Fundido de entrada/salida por rango de progreso (0..100). */
function fade(p: number, start: number, end: number, ramp = 8) {
  if (p < start - ramp || p > end + ramp) return 0;
  if (p >= start && p <= end) return 1;
  if (p < start) return (p - (start - ramp)) / ramp;
  return 1 - (p - end) / ramp;
}

/**
 * Side bearing izquierdo de la "S" de Fraunces, en em. La tinta del glifo no
 * empieza en el borde de su caja; compensamos el wordmark con un margen
 * negativo equivalente para que la "S" quede a plomo, píxel a píxel, con el
 * rótulo "Energía renovable" (en em: escala sola en todos los breakpoints).
 */
function useSerifBearingEm() {
  const [bearingEm, setBearingEm] = useState(0);

  useEffect(() => {
    const measure = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const BASE = 100;
      ctx.font = `400 ${BASE}px ${fraunces.style.fontFamily}`;
      const m = ctx.measureText('S');
      // actualBoundingBoxLeft es negativo cuando la tinta empieza a la
      // derecha del origen (side bearing): margen negativo en em.
      if (typeof m.actualBoundingBoxLeft === 'number') {
        setBearingEm(m.actualBoundingBoxLeft / BASE);
      }
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure);
    } else {
      measure();
    }
  }, []);

  return bearingEm;
}

export default function HeroOverlays() {
  const { progress } = useFrameProgress();
  const p = progress * 100;
  const bearingEm = useSerifBearingEm();

  // Pista de scroll: visible durante todo el scrubbing del hero; solo se
  // desvanece cuando el scroll está completamente terminado (96→100%).
  const hintOpacity = fade(p, 0, 96, 4);
  // Wordmark grande en la esquina superior izquierda: se revela al final del vídeo.
  const wordmarkOpacity = fade(p, 46, 100, 14);
  // Desplazamiento sutil de entrada del wordmark.
  const wordmarkShift = (1 - Math.min(1, Math.max(0, (p - 40) / 22))) * 28;

  return (
    <>
      {/* Viñeta para legibilidad del texto (más oscura arriba/izquierda) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 15% 12%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 42%, transparent 68%), linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 22%, transparent 62%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Wordmark grande — esquina superior izquierda, con respiro de los bordes */}
      <div
        className="pointer-events-none absolute left-0 top-0 max-w-[92vw] pl-6 pt-28 sm:pl-14 sm:pt-32 lg:pl-20 lg:pt-36"
        style={{
          opacity: wordmarkOpacity,
          transform: `translateY(${wordmarkShift}px)`,
          transition: 'opacity 0.2s linear',
        }}
      >
        <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.35em] text-white/70 sm:text-xs">
          Energía renovable
        </p>
        <h1
          className="font-display font-light leading-[0.86] tracking-tight text-white drop-shadow-[0_2px_30px_rgba(0,0,0,0.45)] text-[19vw] sm:text-[15vw] lg:text-[12rem]"
          // Compensa el side bearing de la "S": su tinta queda alineada con
          // el borde izquierdo del rótulo superior (em → responsive).
          style={{ marginLeft: `${bearingEm.toFixed(4)}em` }}
        >
          SERENO
        </h1>
        {/* Panel de cristal esmerilado detrás del texto */}
        <p className="glass mt-5 inline-block max-w-md rounded-3xl px-6 py-4 font-sans text-base leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.25)] sm:text-lg">
          Energía limpia que fluye contigo, del viento a tu hogar.
        </p>
      </div>

      {/* Insignia inferior izquierda (estilo referencia), con panel de
          cristal. En móvil va más alta para que la barra del navegador no
          la tape y no choque con la flecha centrada. */}
      <div className="glass absolute bottom-28 left-5 flex items-center gap-2.5 rounded-full py-2 pl-2.5 pr-4 sm:bottom-8 sm:left-14 lg:left-20">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
            <path d="M12 13v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.3" fill="currentColor" />
            {/* Aspas: giro continuo centrado en el rotor (centro del viewBox) */}
            <path
              d="M12 12 12 4M12 12l6.9 4M12 12 5.1 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="turbine-spin"
            />
          </svg>
        </span>
        <span className="font-sans text-xs tracking-wide text-white/90 sm:text-sm">
          Energía limpia
        </span>
      </div>

      {/* Pista de scroll — centrada en la parte inferior. En móvil sube
          para quedar cómodamente dentro del viewport visible y lleva
          panel de vidrio (glass-mobile, inerte en desktop). */}
      <div
        className="glass-mobile absolute bottom-44 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 rounded-2xl px-5 py-3 sm:bottom-9 md:rounded-none md:px-0 md:py-0"
        style={{ opacity: hintOpacity }}
      >
        <span className="font-sans text-sm uppercase tracking-[0.3em] text-white/85">
          Desliza
        </span>
        <svg viewBox="0 0 24 24" fill="none" className="scroll-bounce h-12 w-12 text-white/90">
          <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}
