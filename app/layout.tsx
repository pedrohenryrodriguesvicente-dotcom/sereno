import type { Metadata } from 'next';
import { fraunces, inter } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'SERENO — Energía limpia para tu hogar',
  description:
    'Genera tu propia energía limpia y renovable. Diseña tu sistema o agenda una consulta virtual con un asesor SERENO.',
  openGraph: {
    title: 'SERENO — Energía limpia para tu hogar',
    description:
      'Genera tu propia energía limpia y renovable. Diseña tu sistema o agenda una consulta virtual con un asesor SERENO.',
    siteName: 'SERENO',
    type: 'website',
    locale: 'es',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="grain">{children}</body>
    </html>
  );
}
