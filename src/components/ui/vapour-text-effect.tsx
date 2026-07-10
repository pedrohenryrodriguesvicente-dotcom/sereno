"use client";

import React, { useRef, useEffect, useState, createElement, useMemo, useCallback, memo } from "react";

export enum Tag {
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  P = "p",
}

type VaporizeTextCycleProps = {
  texts: string[];
  font?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: number;
  };
  color?: string;
  spread?: number;
  density?: number;
  animation?: {
    vaporizeDuration?: number;
    fadeInDuration?: number;
    waitDuration?: number;
  };
  direction?: "left-to-right" | "right-to-left";
  alignment?: "left" | "center" | "right";
  tag?: Tag;
  /** If true, plays a single vaporize+fade-in cycle and then stops (no loop). */
  playOnce?: boolean;
  /** Called once when the playOnce cycle finishes (or immediately with reduced motion). */
  onComplete?: () => void;
  /**
   * If true, skips the vaporize phase entirely: particles start scattered
   * and invisible, then converge to assemble the text (single shot, then
   * static). The reverse of the default effect.
   */
  appearOnly?: boolean;
};

type Particle = {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  color: string;
  /** Opaque rgb() cached at creation so render never rebuilds strings. */
  solidColor?: string;
  opacity: number;
  originalAlpha: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  speed: number;
  shouldFadeQuickly?: boolean;
  /** Scattered start position for the appear-only (assemble) mode. */
  scatterX?: number;
  scatterY?: number;
};

type TextBoundaries = {
  left: number;
  right: number;
  width: number;
};

declare global {
  interface HTMLCanvasElement {
    textBoundaries?: TextBoundaries;
  }
}

export default function VaporizeTextCycle({
  texts = ["Next.js", "React"],
  font = {
    fontFamily: "sans-serif",
    fontSize: "50px",
    fontWeight: 400,
  },
  color = "rgb(255, 255, 255)",
  spread = 5,
  density = 5,
  animation = {
    vaporizeDuration: 2,
    fadeInDuration: 1,
    waitDuration: 0.5,
  },
  direction = "left-to-right",
  alignment = "center",
  tag = Tag.P,
  playOnce = false,
  onComplete,
  appearOnly = false,
}: VaporizeTextCycleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isInView = useIsInView(wrapperRef as React.RefObject<HTMLElement>);
  const lastFontRef = useRef<string | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [animationState, setAnimationState] = useState<"static" | "vaporizing" | "fadingIn" | "waiting" | "assembling">("static");
  const vaporizeProgressRef = useRef(0);
  const fadeOpacityRef = useRef(0);
  const completedRef = useRef(false);
  const assembleProgressRef = useRef(0);
  const assembleStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const transformedDensity = transformValue(density, [0, 10], [0.3, 1], true);

  // Calculate device pixel ratio (capped at 2: fewer pixels/particles, same sharpness)
  const globalDpr = useMemo(() => {
    if (typeof window !== "undefined") {
      return Math.min(window.devicePixelRatio || 1, 2);
    }
    return 1;
  }, []);

  // Memoize static styles
  const wrapperStyle = useMemo(() => ({
    width: "100%",
    height: "100%",
    pointerEvents: "none" as const,
  }), []);

  const canvasStyle = useMemo(() => ({
    minWidth: "30px",
    minHeight: "20px",
    pointerEvents: "none" as const,
  }), []);

  // Memoize animation durations
  const animationDurations = useMemo(() => ({
    VAPORIZE_DURATION: (animation.vaporizeDuration ?? 2) * 1000,
    FADE_IN_DURATION: (animation.fadeInDuration ?? 1) * 1000,
    WAIT_DURATION: (animation.waitDuration ?? 0.5) * 1000,
  }), [animation.vaporizeDuration, animation.fadeInDuration, animation.waitDuration]);

  // Memoize font and spread calculations
  const fontConfig = useMemo(() => {
    const fontSize = parseInt(font.fontSize?.replace("px", "") || "50");
    const VAPORIZE_SPREAD = calculateVaporizeSpread(fontSize);
    const MULTIPLIED_VAPORIZE_SPREAD = VAPORIZE_SPREAD * spread;
    return {
      fontSize,
      VAPORIZE_SPREAD,
      MULTIPLIED_VAPORIZE_SPREAD,
      font: `${font.fontWeight ?? 400} ${fontSize * globalDpr}px ${font.fontFamily}`,
    };
  }, [font.fontSize, font.fontWeight, font.fontFamily, spread, globalDpr]);

  // Memoize particle update function
  const memoizedUpdateParticles = useCallback((particles: Particle[], vaporizeX: number, deltaTime: number) => {
    return updateParticles(
      particles,
      vaporizeX,
      deltaTime,
      fontConfig.MULTIPLIED_VAPORIZE_SPREAD,
      animationDurations.VAPORIZE_DURATION,
      direction,
      transformedDensity
    );
  }, [fontConfig.MULTIPLIED_VAPORIZE_SPREAD, animationDurations.VAPORIZE_DURATION, direction, transformedDensity]);

  // Memoize render function
  const memoizedRenderParticles = useCallback((ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    renderParticles(ctx, particles, globalDpr);
  }, [globalDpr]);

  // Start animation cycle when in view
  useEffect(() => {
    if (isInView) {
      // Already finished a playOnce cycle: stay static, never re-animate.
      if (completedRef.current) return;
      // Respect prefers-reduced-motion: show static text, no animation.
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setAnimationState("static");
        if (playOnce && !completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        return;
      }
      const startAnimationTimeout = setTimeout(() => {
        if (appearOnly) {
          // Reverse mode: skip vaporize, assemble from scattered particles.
          assembleStartedRef.current = false;
          assembleProgressRef.current = 0;
          setAnimationState("assembling");
        } else {
          setAnimationState("vaporizing");
        }
      }, 0);
      return () => clearTimeout(startAnimationTimeout);
    } else {
      // When component goes out of view, reset to static state
      setAnimationState("static");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isInView, playOnce, appearOnly]);

  // Animation loop - only run when in view
  useEffect(() => {
    if (!isInView) return;

    let lastTime = performance.now();
    let frameId: number;

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (!canvas || !ctx || !particlesRef.current.length) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas only if we're going to draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // For inert states (static/waiting) draw a single frame and stop
      // scheduling: the effect re-runs when animationState changes.
      let scheduleNext = true;

      // Update based on animation state
      switch (animationState) {
        case "static": {
          // In appear-only mode nothing must be visible before assembly.
          if (!(appearOnly && !completedRef.current)) {
            memoizedRenderParticles(ctx, particlesRef.current);
          }
          scheduleNext = false;
          break;
        }
        case "assembling": {
          // Scatter lazily so it also works if particles arrive late.
          if (!assembleStartedRef.current) {
            scatterParticles(particlesRef.current, fontConfig.MULTIPLIED_VAPORIZE_SPREAD);
            assembleStartedRef.current = true;
          }
          assembleProgressRef.current += deltaTime * 1000 / animationDurations.VAPORIZE_DURATION;
          const t = Math.min(1, assembleProgressRef.current);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cúbico

          for (const particle of particlesRef.current) {
            const sx = particle.scatterX ?? particle.originalX;
            const sy = particle.scatterY ?? particle.originalY;
            particle.x = sx + (particle.originalX - sx) * eased;
            particle.y = sy + (particle.originalY - sy) * eased;
            particle.opacity = particle.originalAlpha * eased;
          }
          memoizedRenderParticles(ctx, particlesRef.current);

          if (t >= 1) {
            // Snap to final text and stop for good.
            resetParticles(particlesRef.current);
            completedRef.current = true;
            setAnimationState("static");
            onCompleteRef.current?.();
          }
          break;
        }
        case "vaporizing": {
          // Calculate progress based on duration
          vaporizeProgressRef.current += deltaTime * 100 / (animationDurations.VAPORIZE_DURATION / 1000);

          // Get text boundaries
          const textBoundaries = canvas.textBoundaries;
          if (!textBoundaries) break;

          // Calculate vaporize position based on text boundaries and direction
          const progress = Math.min(100, vaporizeProgressRef.current);
          const vaporizeX = direction === "left-to-right"
            ? textBoundaries.left + textBoundaries.width * progress / 100
            : textBoundaries.right - textBoundaries.width * progress / 100;

          const allVaporized = memoizedUpdateParticles(particlesRef.current, vaporizeX, deltaTime);
          memoizedRenderParticles(ctx, particlesRef.current);

          // Check if vaporization is complete
          if (vaporizeProgressRef.current >= 100 && allVaporized) {
            setCurrentTextIndex(prevIndex => (prevIndex + 1) % texts.length);
            setAnimationState("fadingIn");
            fadeOpacityRef.current = 0;
          }
          break;
        }
        case "fadingIn": {
          fadeOpacityRef.current += deltaTime * 1000 / animationDurations.FADE_IN_DURATION;

          // Use particles for fade-in (globalAlpha: no per-frame string work)
          ctx.save();
          ctx.scale(globalDpr, globalDpr);
          const fade = Math.min(fadeOpacityRef.current, 1);
          for (const particle of particlesRef.current) {
            particle.x = particle.originalX;
            particle.y = particle.originalY;
            ctx.globalAlpha = fade * particle.originalAlpha;
            ctx.fillStyle = particle.solidColor ?? particle.color;
            ctx.fillRect(particle.x / globalDpr, particle.y / globalDpr, 1, 1);
          }
          ctx.restore();

          if (fadeOpacityRef.current >= 1) {
            if (playOnce) {
              // Single play: freeze on the fully visible text and stop.
              completedRef.current = true;
              setAnimationState("static");
              onCompleteRef.current?.();
            } else {
              setAnimationState("waiting");
              setTimeout(() => {
                setAnimationState("vaporizing");
                vaporizeProgressRef.current = 0;
                resetParticles(particlesRef.current);
              }, animationDurations.WAIT_DURATION);
            }
          }
          break;
        }
        case "waiting": {
          memoizedRenderParticles(ctx, particlesRef.current);
          scheduleNext = false;
          break;
        }
      }

      if (scheduleNext) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [
    animationState,
    isInView,
    texts.length,
    direction,
    globalDpr,
    memoizedUpdateParticles,
    memoizedRenderParticles,
    animationDurations.FADE_IN_DURATION,
    animationDurations.WAIT_DURATION,
    animationDurations.VAPORIZE_DURATION,
    playOnce,
    appearOnly,
    fontConfig.MULTIPLIED_VAPORIZE_SPREAD
  ]);

  useEffect(() => {
    renderCanvas({
      framerProps: {
        texts,
        font,
        color,
        alignment,
      },
      canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
      wrapperSize,
      particlesRef,
      globalDpr,
      currentTextIndex,
    });

    const currentFont = font.fontFamily || "sans-serif";
    return handleFontChange({
      currentFont,
      lastFontRef,
      canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
      wrapperSize,
      particlesRef,
      globalDpr,
      currentTextIndex,
      framerProps: {
        texts,
        font,
        color,
        alignment,
      },
    });
  }, [texts, font, color, alignment, wrapperSize, currentTextIndex, globalDpr]);

  // Handle resize
  useEffect(() => {
    const container = wrapperRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setWrapperSize({ width, height });
      }

      renderCanvas({
        framerProps: {
          texts,
          font,
          color,
          alignment,
        },
        canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
        wrapperSize: { width: container.clientWidth, height: container.clientHeight },
        particlesRef,
        globalDpr,
        currentTextIndex,
      });

      // Static/waiting states no longer run a rAF loop, so paint one frame
      // after re-sampling to avoid a blank canvas on resize. In appear-only
      // mode nothing is painted until the text has been assembled.
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx && particlesRef.current.length && !(appearOnly && !completedRef.current)) {
        renderParticles(ctx, particlesRef.current, globalDpr);
      }
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [wrapperRef.current]);

  // Initial size detection
  useEffect(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setWrapperSize({
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <SeoElement tag={tag} texts={texts} />
    </div>
  );
}

// ------------------------------------------------------------ //
// SEO ELEMENT
// ------------------------------------------------------------ //
const SeoElement = memo(({ tag = Tag.P, texts }: { tag: Tag, texts: string[] }) => {
  const style = useMemo(() => ({
    position: "absolute" as const,
    width: "0",
    height: "0",
    overflow: "hidden",
    userSelect: "none" as const,
    pointerEvents: "none" as const,
  }), []);

  // Ensure tag is a valid HTML element string
  const safeTag = Object.values(Tag).includes(tag) ? tag : "p";

  return createElement(safeTag, { style }, texts?.join(" ") ?? "");
});

// ------------------------------------------------------------ //
// FONT HANDLING
// ------------------------------------------------------------ //
const handleFontChange = ({
  currentFont,
  lastFontRef,
  canvasRef,
  wrapperSize,
  particlesRef,
  globalDpr,
  currentTextIndex,
  framerProps,
}: {
  currentFont: string;
  lastFontRef: React.MutableRefObject<string | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  wrapperSize: { width: number; height: number };
  particlesRef: React.MutableRefObject<Particle[]>;
  globalDpr: number;
  currentTextIndex: number;
  framerProps: VaporizeTextCycleProps;
}) => {
  if (currentFont !== lastFontRef.current) {
    lastFontRef.current = currentFont;

    // Re-render after 1 second to catch the loaded font
    const timeoutId = setTimeout(() => {
      cleanup({ canvasRef, particlesRef }); // Clean up before re-rendering
      renderCanvas({
        framerProps,
        canvasRef,
        wrapperSize,
        particlesRef,
        globalDpr,
        currentTextIndex,
      });
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      cleanup({ canvasRef, particlesRef });
    };
  }

  return undefined;
};

// ------------------------------------------------------------ //
// CLEANUP
// ------------------------------------------------------------ //
const cleanup = ({ canvasRef, particlesRef }: { canvasRef: React.RefObject<HTMLCanvasElement>; particlesRef: React.MutableRefObject<Particle[]> }) => {
  // Clear canvas
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");

  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Clear particles
  if (particlesRef.current) {
    particlesRef.current = [];
  }
};

// ------------------------------------------------------------ //
// RENDER CANVAS
// ------------------------------------------------------------ //
const renderCanvas = ({
  framerProps,
  canvasRef,
  wrapperSize,
  particlesRef,
  globalDpr,
  currentTextIndex,
}: {
  framerProps: VaporizeTextCycleProps;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  wrapperSize: { width: number; height: number };
  particlesRef: React.MutableRefObject<Particle[]>;
  globalDpr: number;
  currentTextIndex: number;
}) => {
  const canvas = canvasRef.current;
  if (!canvas || !wrapperSize.width || !wrapperSize.height) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = wrapperSize;

  // Scale for retina/high DPI displays
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * globalDpr);
  canvas.height = Math.floor(height * globalDpr);

  // Parse font size
  const fontSize = parseInt(framerProps.font?.fontSize?.replace("px", "") || "50");
  const font = `${framerProps.font?.fontWeight ?? 400} ${fontSize * globalDpr}px ${framerProps.font?.fontFamily ?? "sans-serif"}`;
  const color = parseColor(framerProps.color ?? "rgb(153, 153, 153)");

  // Calculate text position
  let textX;
  const textY = canvas.height / 2;
  const currentText = framerProps.texts[currentTextIndex] || "Next.js";

  if (framerProps.alignment === "center") {
    textX = canvas.width / 2;
  } else if (framerProps.alignment === "left") {
    textX = 0;
  } else {
    textX = canvas.width;
  }

  // Create particles from the rendered text and get text boundaries
  const { particles, textBoundaries } = createParticles(ctx, canvas, currentText, textX, textY, font, color, framerProps.alignment || "left");

  // Store particles and text boundaries for animation
  particlesRef.current = particles;
  canvas.textBoundaries = textBoundaries;
};

// ------------------------------------------------------------ //
// PARTICLE SYSTEM
// ------------------------------------------------------------ //
const createParticles = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string,
  textX: number,
  textY: number,
  font: string,
  color: string,
  alignment: "left" | "center" | "right"
) => {
  const particles: Particle[] = [];

  // Clear any previous content
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set text properties for sampling
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = alignment;
  ctx.textBaseline = "middle";
  ctx.imageSmoothingQuality = "high";
  ctx.imageSmoothingEnabled = true;

  if ('fontKerning' in ctx) {
    (ctx as unknown as { fontKerning: string }).fontKerning = "normal";
  }

  if ('textRendering' in ctx) {
    (ctx as unknown as { textRendering: string }).textRendering = "geometricPrecision";
  }

  // Calculate text boundaries
  const metrics = ctx.measureText(text);
  let textLeft;
  const textWidth = metrics.width;

  if (alignment === "center") {
    textLeft = textX - textWidth / 2;
  } else if (alignment === "left") {
    textLeft = textX;
  } else {
    textLeft = textX - textWidth;
  }

  const textBoundaries = {
    left: textLeft,
    right: textLeft + textWidth,
    width: textWidth,
  };

  // Render the text for sampling
  ctx.fillText(text, textX, textY);

  // Sample the rendered text
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate sampling rate based on DPR and density to maintain consistent particle density
  const baseDPR = 3; // Base DPR we're optimizing for
  const currentDPR = canvas.width / parseInt(canvas.style.width);
  const baseSampleRate = Math.max(1, Math.round(currentDPR / baseDPR));
  const sampleRate = Math.max(1, Math.round(baseSampleRate)); // Adjust sample rate by density

  // Sample the text pixels and create particles
  for (let y = 0; y < canvas.height; y += sampleRate) {
    for (let x = 0; x < canvas.width; x += sampleRate) {
      const index = (y * canvas.width + x) * 4;
      const alpha = data[index + 3];

      if (alpha > 0) {
        // Remove density from opacity calculation
        const originalAlpha = alpha / 255 * (sampleRate / currentDPR);
        const particle = {
          x,
          y,
          originalX: x,
          originalY: y,
          color: `rgba(${data[index]}, ${data[index + 1]}, ${data[index + 2]}, ${originalAlpha})`,
          solidColor: `rgb(${data[index]}, ${data[index + 1]}, ${data[index + 2]})`,
          opacity: originalAlpha,
          originalAlpha,
          // Animation properties
          velocityX: 0,
          velocityY: 0,
          angle: 0,
          speed: 0,
        };

        particles.push(particle);
      }
    }
  }

  // Clear the canvas after sampling
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  return { particles, textBoundaries };
};

// Helper functions for particle animation
const updateParticles = (
  particles: Particle[],
  vaporizeX: number,
  deltaTime: number,
  MULTIPLIED_VAPORIZE_SPREAD: number,
  VAPORIZE_DURATION: number,
  direction: string,
  density: number
) => {
  let allParticlesVaporized = true;

  particles.forEach(particle => {
    // Only animate particles that have been "vaporized"
    const shouldVaporize = direction === "left-to-right"
      ? particle.originalX <= vaporizeX
      : particle.originalX >= vaporizeX;

    if (shouldVaporize) {
      // When a particle is first vaporized, determine if it should fade quickly based on density
      if (particle.speed === 0) {
        // Initialize particle motion when first vaporized
        particle.angle = Math.random() * Math.PI * 2;
        particle.speed = (Math.random() * 1 + 0.5) * MULTIPLIED_VAPORIZE_SPREAD;
        particle.velocityX = Math.cos(particle.angle) * particle.speed;
        particle.velocityY = Math.sin(particle.angle) * particle.speed;

        // Determine if particle should fade quickly based on density
        // density of 1 means all particles animate normally
        // density of 0.5 means 50% of particles fade quickly
        particle.shouldFadeQuickly = Math.random() > density;
      }

      if (particle.shouldFadeQuickly) {
        // Quick fade out for particles marked to fade quickly
        particle.opacity = Math.max(0, particle.opacity - deltaTime);
      } else {
        // Apply normal particle physics and animation
        // Apply damping based on distance from original position
        const dx = particle.originalX - particle.x;
        const dy = particle.originalY - particle.y;
        const distanceFromOrigin = Math.sqrt(dx * dx + dy * dy);

        // Damping factor increases with distance, creating a more natural motion
        const dampingFactor = Math.max(0.95, 1 - distanceFromOrigin / (100 * MULTIPLIED_VAPORIZE_SPREAD));

        // Add slight random motion to create a more organic feel
        const randomSpread = MULTIPLIED_VAPORIZE_SPREAD * 3;
        const spreadX = (Math.random() - 0.5) * randomSpread;
        const spreadY = (Math.random() - 0.5) * randomSpread;

        // Update velocities with damping and random motion
        particle.velocityX = (particle.velocityX + spreadX + dx * 0.002) * dampingFactor;
        particle.velocityY = (particle.velocityY + spreadY + dy * 0.002) * dampingFactor;

        // Limit maximum velocity
        const maxVelocity = MULTIPLIED_VAPORIZE_SPREAD * 2;
        const currentVelocity = Math.sqrt(particle.velocityX * particle.velocityX + particle.velocityY * particle.velocityY);

        if (currentVelocity > maxVelocity) {
          const scale = maxVelocity / currentVelocity;
          particle.velocityX *= scale;
          particle.velocityY *= scale;
        }

        // Update position
        particle.x += particle.velocityX * deltaTime * 20;
        particle.y += particle.velocityY * deltaTime * 10;

        // Calculate fade rate based on vaporize duration
        const baseFadeRate = 0.25;
        const durationBasedFadeRate = baseFadeRate * (2000 / VAPORIZE_DURATION);

        // Slower fade out for more persistence, scaled by duration
        particle.opacity = Math.max(0, particle.opacity - deltaTime * durationBasedFadeRate);
      }

      // Check if this particle is still visible
      if (particle.opacity > 0.01) {
        allParticlesVaporized = false;
      }
    } else {
      // If there are any particles not yet reached by the vaporize wave
      allParticlesVaporized = false;
    }
  });

  return allParticlesVaporized;
};

const renderParticles = (ctx: CanvasRenderingContext2D, particles: Particle[], globalDpr: number) => {
  ctx.save();
  ctx.scale(globalDpr, globalDpr);

  // globalAlpha + cached solid color: no string building per particle/frame.
  for (const particle of particles) {
    if (particle.opacity > 0.01) {
      ctx.globalAlpha = Math.min(1, particle.opacity);
      ctx.fillStyle = particle.solidColor ?? particle.color;
      ctx.fillRect(particle.x / globalDpr, particle.y / globalDpr, 1, 1);
    }
  }

  ctx.restore();
};

// Coloca las partículas dispersas e invisibles alrededor de su posición
// final, listas para converger en el modo appear-only.
const scatterParticles = (particles: Particle[], multipliedSpread: number) => {
  const radius = Math.max(40, multipliedSpread * 12);
  for (const particle of particles) {
    const angle = Math.random() * Math.PI * 2;
    const dist = (0.35 + Math.random() * 0.65) * radius;
    particle.scatterX = particle.originalX + Math.cos(angle) * dist;
    particle.scatterY = particle.originalY + Math.sin(angle) * dist;
    particle.x = particle.scatterX;
    particle.y = particle.scatterY;
    particle.opacity = 0;
  }
};

const resetParticles = (particles: Particle[]) => {
  particles.forEach(particle => {
    particle.x = particle.originalX;
    particle.y = particle.originalY;
    particle.opacity = particle.originalAlpha;
    particle.speed = 0;
    particle.velocityX = 0;
    particle.velocityY = 0;
  });
};

// ------------------------------------------------------------ //
// CALCULATE VAPORIZE SPREAD
// ------------------------------------------------------------ //
const calculateVaporizeSpread = (fontSize: number) => {
  // Convert font size string to number if needed
  const size = typeof fontSize === "string" ? parseInt(fontSize) : fontSize;

  // Define our known points for interpolation
  const points = [
    { size: 20, spread: 0.2 },
    { size: 50, spread: 0.5 },
    { size: 100, spread: 1.5 }
  ];

  // Handle edge cases
  if (size <= points[0].size) return points[0].spread;
  if (size >= points[points.length - 1].size) return points[points.length - 1].spread;

  // Find the two points to interpolate between
  let i = 0;
  while (i < points.length - 1 && points[i + 1].size < size) i++;

  // Linear interpolation between the two closest points
  const p1 = points[i];
  const p2 = points[i + 1];

  return p1.spread + (size - p1.size) * (p2.spread - p1.spread) / (p2.size - p1.size);
};

// ------------------------------------------------------------ //
// PARSE COLOR
// ------------------------------------------------------------ //
/**
 * Extracts RGB/RGBA values from a color string format
 * @param color - Color string (e.g. "rgb(12, 250, 163)")
 * @returns Valid RGBA color string
 */
const parseColor = (color: string) => {
  // Try to match rgb/rgba pattern
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);

  if (rgbaMatch) {
    // If RGBA format
    const [, r, g, b, a] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } else if (rgbMatch) {
    // If RGB format
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }

  // Fallback to black if parsing fails
  console.warn("Could not parse color:", color);
  return "rgba(0, 0, 0, 1)";
};

/**
 * Maps a value from one range to another, optionally clamping the result.
 */
function transformValue(input: number, inputRange: number[], outputRange: number[], clamp = false): number {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  const progress = (input - inputMin) / (inputMax - inputMin);
  let result = outputMin + progress * (outputMax - outputMin);

  if (clamp) {
    if (outputMax > outputMin) {
      result = Math.min(Math.max(result, outputMin), outputMax);
    } else {
      result = Math.min(Math.max(result, outputMax), outputMin);
    }
  }

  return result;
}

/**
 * Custom hook to check if an element is in the viewport
 */
function useIsInView(ref: React.RefObject<HTMLElement>) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '50px' }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return isInView;
}

SeoElement.displayName = "SeoElement";
