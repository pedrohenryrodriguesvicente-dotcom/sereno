import { Fraunces, Inter } from 'next/font/google';

// Fuentes compartidas: el layout las inyecta como CSS vars y los componentes
// canvas (VaporizeTextCycle) usan `fraunces.style.fontFamily`, que es el
// nombre real de la familia cargada (no la variable CSS).
export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
