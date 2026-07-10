'use client';
import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import VaporizeHeading from '@/components/ui/VaporizeHeading';
import { Tag } from '@/components/ui/vapour-text-effect';
import { fraunces } from '@/lib/fonts';

/**
 * Firma del estudio que diseñó el sitio. Franja dedicada de ancho completo,
 * con presencia propia pero sin competir con la marca SERENO.
 */
export default function Signature() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, 0.25);

  return (
    <section ref={ref} className="border-t border-line bg-paper px-6 py-24 sm:px-8 sm:py-36">
      <div
        className={`mx-auto max-w-6xl text-center transition-all duration-700 ${
          inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <p className="mb-6 flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.4em] text-muted">
          <span className="inline-block h-px w-10 bg-amber" aria-hidden />
          Diseñado por
          <span className="inline-block h-px w-10 bg-amber" aria-hidden />
        </p>

        <VaporizeHeading
          text="Vertex Web Design"
          tag={Tag.P}
          fontFamily={fraunces.style.fontFamily}
          fontWeight={400}
          maxFontSize={110}
          alignment="center"
          color="rgb(26, 26, 24)"
          fallbackClassName="font-display text-[11vw] font-light leading-none tracking-tight text-ink sm:text-6xl md:text-7xl lg:text-8xl"
        />

        <p className="mt-7 text-sm text-muted">
          Estudio de diseño y desarrollo web
          <span className="text-amber"> ✳</span>
        </p>
      </div>
    </section>
  );
}
