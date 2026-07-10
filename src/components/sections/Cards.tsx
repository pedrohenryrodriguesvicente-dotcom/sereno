'use client';
import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';

// Reutiliza un frame del vídeo como fotografía decorativa.
const PHOTO = '/frames/loop/frame_0120.webp';

export default function Cards() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const consumed = useCountUp(72, inView);

  return (
    <section
      ref={ref}
      id="producto"
      className="mx-auto max-w-6xl px-6 pb-10 sm:px-8"
    >
      {/* etiquetas superiores */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="text-amber">✦</span> Monitoreo 24/7
        </span>
        <span className="flex items-center gap-1.5">
          Máximo control <span className="text-amber">✦</span>
        </span>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 transition-all duration-700 md:grid-cols-3 ${
          inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Tarjeta oscura */}
        <div className="card-hover flex min-h-[240px] flex-col justify-between rounded-3xl bg-dark p-6 text-paper">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-paper">
                <path d="M12 13v8M12 12 12 4M12 12l6.9 4M12 12 5.1 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="1.3" fill="currentColor" />
              </svg>
            </span>
            <div className="flex -space-x-2">
              {['#d68a45', '#7e8e6e', '#c96a4a'].map((c) => (
                <span key={c} className="h-6 w-6 rounded-full border-2 border-dark" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[15px] leading-snug">
              Diseña tu sistema de energía{' '}
              <span className="text-paper/50">o agenda una consulta virtual con SERENO.</span>
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-sage px-0.5">
                <span className="ml-auto h-4 w-4 rounded-full bg-white" />
              </span>
              <span className="text-xs text-paper/70">Modo energía IA</span>
            </div>
          </div>
        </div>

        {/* Tarjeta con foto */}
        <div className="card-hover relative min-h-[240px] overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHOTO}
            alt="Aerogeneradores al atardecer"
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/85 px-4 py-1.5 text-xs font-medium text-ink backdrop-blur">
            Energía eólica
          </span>
        </div>

        {/* Tarjeta con gráfico */}
        <div className="card-hover flex min-h-[240px] flex-col justify-between rounded-3xl bg-surface p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-5xl font-light text-ink">{consumed}%</p>
              <p className="mt-1 text-sm text-muted">Energía consumida</p>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">
              <span className="text-amber">⚡</span> Últimas 3h
            </span>
          </div>
          <DotChart />
          <div className="flex justify-between text-[10px] text-muted">
            <span>00:00</span>
            <span>02:00</span>
            <span>04:00</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function DotChart() {
  const cols = 16;
  const rows = 6;
  // altura pseudoaleatoria pero estable por columna
  const heights = [2, 3, 2, 4, 3, 5, 4, 6, 5, 4, 3, 4, 2, 3, 4, 2];
  return (
    <div className="my-2 flex items-end justify-between gap-[3px]">
      {Array.from({ length: cols }).map((_, c) => (
        <div key={c} className="flex flex-col-reverse gap-[3px]">
          {Array.from({ length: rows }).map((_, r) => (
            <span
              key={r}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: r < heights[c] ? '#d68a45' : '#e4dfd6',
                opacity: r < heights[c] ? 1 - r * 0.08 : 1,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
