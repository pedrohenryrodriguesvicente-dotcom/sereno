'use client';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useScrollFrame } from '@/hooks/useScrollFrame';

interface FrameContextValue {
  frame: number;
  totalFrames: number;
  progress: number; // 0..1
}

const FrameContext = createContext<FrameContextValue>({
  frame: 0,
  totalFrames: 1,
  progress: 0,
});

/** Consumido por los overlays para reaccionar al progreso del scroll. */
export const useFrameProgress = () => useContext(FrameContext);

interface FrameSequenceProps {
  framesPath: string;
  framePrefix?: string;
  zeroPad?: number;
  ext?: string;
  totalFrames: number;
  height?: string;
  children?: React.ReactNode;
  id?: string;
}

/** Geometría de dibujo cover-fit, cacheada; se recalcula solo en resize. */
interface CoverGeometry {
  w: number;  // ancho del canvas (px físicos)
  h: number;  // alto del canvas
  dw: number; // ancho de dibujo de la imagen
  dh: number; // alto de dibujo
  ox: number; // offset X
  oy: number; // offset Y
}

// Ventana de precarga prioritaria alrededor del frame actual.
const PRELOAD_AHEAD = 16;
const PRELOAD_BEHIND = 4;

export default function FrameSequence({
  framesPath,
  framePrefix = 'frame_',
  zeroPad = 4,
  ext = 'webp',
  totalFrames,
  height = '600vh',
  children,
  id,
}: FrameSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const requestedRef = useRef<boolean[]>([]);
  const isReadyRef = useRef(false);
  const lastDrawnRef = useRef(-1);
  const prevFrameRef = useRef(0);
  const coverRef = useRef<CoverGeometry | null>(null);

  const { frame, progress } = useScrollFrame(containerRef, totalFrames);

  const getFrameUrl = (index: number) => {
    const padded = String(index + 1).padStart(zeroPad, '0');
    return `${framesPath}/${framePrefix}${padded}.${ext}`;
  };

  // Sincroniza el tamaño del canvas y cachea la geometría cover-fit.
  // Todos los frames comparten dimensiones, así que basta una imagen cargada.
  const computeCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(rect.width * dpr);
    const ch = Math.round(rect.height * dpr);
    canvas.width = cw;
    canvas.height = ch;

    const img = imagesRef.current.find((im) => im && im.naturalWidth > 0);
    if (!img) {
      coverRef.current = null;
      return;
    }
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    let dw: number, dh: number, ox = 0, oy = 0;
    if (imgRatio > canvasRatio) {
      dh = ch;
      dw = ch * imgRatio;
      ox = (cw - dw) / 2;
    } else {
      dw = cw;
      dh = cw / imgRatio;
      oy = (ch - dh) / 2;
    }
    coverRef.current = { w: cw, h: ch, dw, dh, ox, oy };
  };

  // Contexto 2D cacheado y opaco (alpha:false): el canvas cubre pantalla
  // completa sobre fondo negro, así el navegador compone sin transparencia.
  const getCtx = () => {
    if (!ctxRef.current && canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d', { alpha: false });
    }
    return ctxRef.current;
  };

  // Dibuja usando la geometría cacheada; evita redibujar el mismo frame.
  // Sin clearRect: el cover-fit siempre cubre el canvas entero, cada
  // drawImage sobrescribe el frame anterior por completo.
  const drawFrame = (frameIndex: number, force = false) => {
    if (!force && frameIndex === lastDrawnRef.current) return;
    const canvas = canvasRef.current;
    const img = imagesRef.current[frameIndex];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    if (!coverRef.current) computeCover();
    const cover = coverRef.current;
    if (!cover) return;

    const ctx = getCtx();
    if (!ctx) return;

    ctx.drawImage(img, cover.ox, cover.oy, cover.dw, cover.dh);
    lastDrawnRef.current = frameIndex;
  };

  // Solicita la carga de un frame una sola vez, con decodificación asíncrona.
  const loadImage = (i: number, onload?: () => void) => {
    if (i < 0 || i >= totalFrames || requestedRef.current[i]) return;
    requestedRef.current[i] = true;
    const img = imagesRef.current[i];
    img.decoding = 'async';
    img.onload = () => {
      onload?.();
      // Si el frame que faltaba es el visible, píntalo en cuanto llegue.
      if (i === prevFrameRef.current) {
        requestAnimationFrame(() => drawFrame(i));
      }
    };
    img.src = getFrameUrl(i);
  };

  // Precarga prioritaria: frames cercanos al actual, sesgada a la dirección
  // del movimiento del scroll.
  const ensureWindow = (current: number, dir: 1 | -1) => {
    loadImage(current);
    for (let k = 1; k <= PRELOAD_AHEAD; k++) loadImage(current + k * dir);
    for (let k = 1; k <= PRELOAD_BEHIND; k++) loadImage(current - k * dir);
  };

  // Inicialización: primer lote crítico + resto en tiempo ocioso.
  useEffect(() => {
    imagesRef.current = Array.from({ length: totalFrames }, () => new Image());
    requestedRef.current = Array(totalFrames).fill(false);
    lastDrawnRef.current = -1;
    coverRef.current = null;
    isReadyRef.current = false;

    const BATCH1_END = Math.min(24, totalFrames);
    let loaded = 0;

    for (let i = 0; i < BATCH1_END; i++) {
      loadImage(i, () => {
        loaded++;
        if (loaded === 1) {
          computeCover();
          drawFrame(0, true);
        }
        if (loaded === BATCH1_END) {
          isReadyRef.current = true;
          drawFrame(prevFrameRef.current, true);
        }
      });
    }

    const loadRest = () => {
      for (let i = BATCH1_END; i < totalFrames; i++) loadImage(i);
    };

    if ('requestIdleCallback' in window) {
      (window as Window & typeof globalThis).requestIdleCallback(loadRest);
    } else {
      setTimeout(loadRest, 200);
    }

    return () => {
      imagesRef.current.forEach((img) => (img.onload = null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalFrames, framesPath]);

  // Reacciona al cambio de frame: precarga direccional + dibujo.
  useEffect(() => {
    const dir: 1 | -1 = frame >= prevFrameRef.current ? 1 : -1;
    prevFrameRef.current = frame;
    ensureWindow(frame, dir);
    if (!isReadyRef.current) return;
    requestAnimationFrame(() => drawFrame(frame));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame]);

  // Resize: único punto donde se recalcula la geometría.
  useEffect(() => {
    const onResize = () => {
      computeCover();
      drawFrame(Math.max(lastDrawnRef.current, 0), true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={containerRef} id={id} style={{ height }} className="relative w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <FrameContext.Provider value={{ frame, totalFrames, progress }}>
          {children}
        </FrameContext.Provider>
      </div>
    </section>
  );
}
