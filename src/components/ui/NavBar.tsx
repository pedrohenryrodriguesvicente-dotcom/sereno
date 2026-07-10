'use client';
import { useEffect, useState } from 'react';

const links = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#producto', label: 'Nuestro Producto' },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sobre el vídeo (arriba) el texto es claro; al hacer scroll pasa a oscuro sobre el papel.
  const light = !scrolled;

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-paper/85 backdrop-blur-md border-b border-line'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        {/* Logo */}
        <a
          href="#inicio"
          className={`font-display text-2xl leading-none tracking-tight transition-colors ${
            light ? 'text-white' : 'text-ink'
          }`}
        >
          SERENO
        </a>

        {/* Links desktop */}
        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-[13px] tracking-wide transition-colors ${
                light
                  ? 'text-white/80 hover:text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <span
            className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${
              light ? 'border-white/40 text-white' : 'border-line text-ink'
            }`}
            aria-hidden
          >
            <TurbineIcon className="h-4 w-4" />
          </span>
          <a
            href="#contacto"
            className={`rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
              light
                ? 'bg-white text-ink hover:bg-white/90'
                : 'bg-ink text-paper hover:opacity-90'
            }`}
          >
            Consigue tu SERENO
          </a>
        </div>

        {/* Botón menú móvil */}
        <button
          className="flex w-6 flex-col gap-[5px] md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span
            className={`block h-px transition-all ${light ? 'bg-white' : 'bg-ink'} ${
              menuOpen ? 'translate-y-[6px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px transition-all ${light ? 'bg-white' : 'bg-ink'} ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-px transition-all ${light ? 'bg-white' : 'bg-ink'} ${
              menuOpen ? '-translate-y-[6px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-line bg-paper px-5 py-4 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="py-2 text-sm tracking-wide text-ink/80 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contacto"
            onClick={() => setMenuOpen(false)}
            className="mt-2 rounded-full bg-ink px-5 py-2.5 text-center text-sm font-medium text-paper"
          >
            Consigue tu SERENO
          </a>
        </div>
      )}
    </nav>
  );
}

function TurbineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Poste y rotor estáticos */}
      <path d="M12 13v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      {/* Aspas: giro continuo centrado en el rotor (centro del viewBox) */}
      <path
        d="M12 12 12 4M12 12l6.9 4M12 12 5.1 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="turbine-spin"
      />
    </svg>
  );
}
