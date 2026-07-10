'use client';

const columns = [
  {
    title: 'Compañía',
    items: [
      { label: 'Nosotros', href: '#nosotros' },
      { label: 'Carreras', href: '#contacto' },
      { label: 'Contacto', href: '#contacto' },
    ],
  },
  {
    title: 'Producto',
    items: [
      { label: 'Eólica', href: '#producto' },
      { label: 'Almacenamiento', href: '#especificaciones' },
    ],
  },
  {
    title: 'Recursos',
    items: [
      { label: 'Noticias', href: '#novedades' },
      { label: 'Prensa', href: '#novedades' },
    ],
  },
];

const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com' },
  { label: 'Facebook', href: 'https://www.facebook.com' },
  { label: 'Twitter', href: 'https://x.com' },
  { label: 'Youtube', href: 'https://www.youtube.com' },
];

export default function Footer() {
  return (
    <footer id="contacto" className="mx-4 mb-4 rounded-3xl bg-dark px-6 py-14 text-paper sm:mx-6 sm:px-12">
      <div className="mx-auto max-w-6xl">
        {/* CTA superior */}
        <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-12 md:flex-row md:items-end">
          <p className="max-w-md font-display text-2xl font-light leading-snug sm:text-[1.9rem]">
            Diseña tu sistema de energía o agenda una consulta virtual con un
            asesor SERENO para saber más.
          </p>
          <div className="flex flex-col items-start gap-5">
            <a
              href="#producto"
              className="rounded-full border border-white/25 px-6 py-2.5 text-sm transition-colors hover:bg-white/10"
            >
              Ordenar ahora
            </a>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-paper/50">Síguenos</span>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs text-paper/80 transition-colors hover:bg-white/20"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columnas */}
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="font-display text-3xl">SERENO</span>
            <p className="mt-3 max-w-xs text-sm text-paper/50">
              Energía limpia que fluye contigo, del viento a tu hogar.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs uppercase tracking-wider text-paper/50">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <a href={it.href} className="text-sm text-paper/80 transition-colors hover:text-paper">
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div id="novedades" className="flex scroll-mt-24 flex-col gap-3 border-t border-white/10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-paper/60">Recibe novedades de SERENO</span>
          <form
            className="flex w-full max-w-sm items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Correo electrónico"
              className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:border-white/50 focus:outline-none"
            />
            <button className="whitespace-nowrap rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90">
              Enviar
            </button>
          </form>
        </div>

        {/* Base */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-paper/50 sm:flex-row sm:justify-between">
          <span>© 2026 SERENO. Todos los derechos reservados.</span>
          <a href="#inicio" className="hover:text-paper/80">Política de Privacidad</a>
        </div>
      </div>
    </footer>
  );
}
