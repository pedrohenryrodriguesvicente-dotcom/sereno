'use client';
import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import TextReveal from '@/components/ui/TextReveal';

export default function Intro() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section
      ref={ref}
      id="nosotros"
      className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-24 sm:px-8 md:grid-cols-[16rem_1fr] md:gap-14 md:py-32"
    >
      {/* Rótulo editorial: alineado por arriba con la primera línea del
          párrafo (md:pt-2 compensa la altura de línea del display) y en
          columna fija de 16rem para quedar cerca del texto, no flotando. */}
      <div
        className={`flex items-start gap-2.5 transition-all duration-700 md:pt-2 ${
          inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <span className="mt-0.5 text-lg leading-none text-amber">✳</span>
        <span className="text-base font-medium leading-snug text-muted md:text-lg">
          Ahorra con energía
          <br />a lo largo del tiempo
        </span>
      </div>

      <TextReveal
        as="p"
        mode="words"
        step={26}
        text="Genera tu propia energía limpia a partir del viento, de forma gratuita y renovable. Almacena lo que produces y utilízala en cualquier momento que la necesites."
        className="font-display text-2xl font-light leading-snug text-ink sm:text-[2rem] md:text-[2.4rem]"
      />
    </section>
  );
}
