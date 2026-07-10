import { RefObject, useEffect, useState } from 'react';

/**
 * true la primera vez que el elemento entra en viewport (de una sola
 * activación). El observer se desconecta en cuanto dispara: no queda
 * observando de por vida.
 */
export function useInView(ref: RefObject<HTMLElement | null>, threshold = 0.15) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}
