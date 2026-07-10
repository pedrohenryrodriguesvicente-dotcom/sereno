'use client';
import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import TextReveal from '@/components/ui/TextReveal';

const features = [
  {
    img: '/assets/preview-dashboard.jpg',
    alt: 'Tablero de monitoreo con gráficas del flujo de energía en tiempo real',
    width: 4810,
    height: 3207,
    label: 'Monitorea el flujo de energía',
    badge: null,
  },
  {
    img: '/assets/preview-tablet.jpg',
    alt: 'Persona configurando sus preferencias de energía en una tableta',
    width: 6000,
    height: 4000,
    label: 'Personaliza tus preferencias',
    badge: null,
  },
  {
    img: '/assets/preview-soon.jpg',
    alt: 'Vista previa difuminada de la función de alertas urgentes, disponible próximamente',
    width: 7680,
    height: 4320,
    label: 'Recibe alertas urgentes',
    badge: 'Próximamente',
  },
];

export default function PowerOn() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} id="caracteristicas" className="mx-auto max-w-5xl px-6 py-28 text-center sm:px-8">
      <span className="inline-block rounded-full border border-line bg-surface px-4 py-1.5 text-xs text-muted">
        Poniendo en marcha
      </span>

      <TextReveal
        as="p"
        mode="words"
        step={20}
        text="Con miles de instalaciones hasta la fecha, SERENO se encarga de cada detalle por ti, desde el pedido hasta la puesta en marcha. Agenda una consulta virtual con un asesor SERENO para saber más."
        className="mx-auto mt-8 max-w-3xl font-display text-3xl font-light leading-snug text-ink sm:text-[2.6rem]"
      />

      <div className="mx-auto mt-14 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.label}
            className={`transition-all duration-700 ${
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
            style={{ transitionDelay: `${150 + i * 120}ms` }}
          >
            <div className="card-hover relative aspect-[4/3] overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.img}
                alt={f.alt}
                width={f.width}
                height={f.height}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              {f.badge && (
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-ink backdrop-blur">
                  {f.badge}
                </span>
              )}
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <span className="text-amber">✦</span> {f.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
