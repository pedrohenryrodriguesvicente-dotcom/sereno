'use client';
import { useRef, useState } from 'react';
import { useInView } from '@/hooks/useInView';
import TextReveal from '@/components/ui/TextReveal';

const previews = [
  {
    src: '/assets/product-1.jpg',
    alt: 'Primer plano del rotor y las aspas de un aerogenerador contra el cielo azul',
    width: 2958,
    height: 1960,
  },
  {
    src: '/assets/product-2.jpg',
    alt: 'Parque eólico con aerogeneradores en silueta al atardecer',
    width: 4623,
    height: 2600,
  },
];

const warrantySlides = [
  'Garantía de 25 años',
  'Instalación llave en mano',
  'Monitoreo remoto 24/7',
];

export default function Specs() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const [slide, setSlide] = useState(0);

  return (
    <section
      ref={ref}
      id="especificaciones"
      className={`mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-6 py-24 transition-all duration-700 sm:px-8 md:grid-cols-2 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      {/* Columna izquierda */}
      <div>
        <span className="inline-block rounded-full border border-line bg-surface px-4 py-1.5 text-xs text-muted">
          Más sobre
        </span>
        <TextReveal
          as="h2"
          mode="letters"
          step={32}
          text={'Especificaciones\ndel sistema'}
          className="mt-6 font-display text-4xl font-light leading-tight text-ink sm:text-5xl"
        />
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
          SERENO utiliza aerogeneradores de perfil bajo, silenciosos y de diseño
          moderno. Con nuestro sistema de montaje propietario, se integran de
          forma discreta en cualquier terreno.
        </p>

        <p className="mt-8 flex items-center gap-1.5 text-xs text-muted">
          <span className="text-amber">✦</span> Vista previa del producto
        </p>
        <div id="vista-previa" className="mt-4 grid grid-cols-2 gap-4 scroll-mt-28">
          {previews.map((p) => (
            <div key={p.src} className="card-hover aspect-[4/3] w-full overflow-hidden rounded-2xl sm:aspect-[5/4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.alt}
                width={p.width}
                height={p.height}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Columna derecha — tarjeta oscura */}
      <div className="card-hover rounded-3xl bg-dark p-7 text-paper">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-2xl font-light leading-tight">
            Diseño de
            <br />
            energía
          </h3>
          <a
            href="#vista-previa"
            className="rounded-full border border-white/25 px-4 py-1.5 text-xs text-paper transition-colors hover:bg-white/10"
          >
            Ver modelo
          </a>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-5 text-xs">
          {[
            ['Altura del rotor', '1,80 m'],
            ['Diámetro', '1,20 m'],
            ['Materiales', 'Fibra · acero'],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="flex items-center gap-1 text-paper/50">
                <span className="text-amber">◇</span> {k}
              </p>
              <p className="mt-1 text-paper">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
          <span className="text-sm text-paper/80">Características de energía</span>
          <a
            href="#caracteristicas"
            className="rounded-full bg-paper px-4 py-1.5 text-xs font-medium text-ink transition-opacity hover:opacity-90"
          >
            Ver características
          </a>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
          <span className="text-sm text-paper/80">{warrantySlides[slide]}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSlide((slide - 1 + warrantySlides.length) % warrantySlides.length)}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/25 text-paper hover:bg-white/10"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              onClick={() => setSlide((slide + 1) % warrantySlides.length)}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/25 text-paper hover:bg-white/10"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
