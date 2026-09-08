"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

const W = 520;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const GUIDE_R = 104;
const GUIDE_DX = GUIDE_R * 2;
const GUIDE_DY = GUIDE_R * 2;
const BASE_SPEED = 0.000_22;
const RIGHT_ANGLE = Math.PI / 2;

const CENTERS = [
  { x: CX - GUIDE_DX / 2, y: CY - GUIDE_DY / 2 },
  { x: CX + GUIDE_DX / 2, y: CY - GUIDE_DY / 2 },
  { x: CX - GUIDE_DX / 2, y: CY + GUIDE_DY / 2 },
  { x: CX + GUIDE_DX / 2, y: CY + GUIDE_DY / 2 },
];

const INNER_PHASES = [
  Math.PI / 4,
  (Math.PI * 3) / 4,
  -Math.PI / 4,
  (-Math.PI * 3) / 4,
];
const OUTER_DIRECTIONS = [-1, 1, 1, -1];
const POINTS = Array.from({ length: 8 }, () => ({ x: 0, y: 0 }));

// Points are grouped by guide circle: TL(0,1), TR(2,3), BL(4,5), BR(6,7).
// Even indexes are inner pivots. They stay connected as the central square;
// odd indexes form the surrounding articulated frame.
const RODS: [number, number][] = [
  // central square
  [0, 2],
  [2, 6],
  [6, 4],
  [4, 0],

  // local bars on each construction circle
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],

  // outer rails and diagonals
  [1, 3],
  [5, 7],
  [1, 2],
  [1, 4],
  [3, 6],
  [5, 6],
  [5, 0],
  [7, 2],
];

const DOT_COUNT = 8;

function updatePoints(theta: number) {
  for (let i = 0; i < CENTERS.length; i++) {
    const c = CENTERS[i];
    const inner = theta + INNER_PHASES[i];
    const outer = inner + OUTER_DIRECTIONS[i] * RIGHT_ANGLE;
    const pointIndex = i * 2;

    POINTS[pointIndex].x = c.x + GUIDE_R * Math.cos(inner);
    POINTS[pointIndex].y = c.y + GUIDE_R * Math.sin(inner);
    POINTS[pointIndex + 1].x = c.x + GUIDE_R * Math.cos(outer);
    POINTS[pointIndex + 1].y = c.y + GUIDE_R * Math.sin(outer);
  }

  return POINTS;
}

function getCanvasColors(canvas: HTMLCanvasElement) {
  const styles = getComputedStyle(canvas);

  return {
    background: styles.getPropertyValue("--color-background").trim(),
    border: styles.getPropertyValue("--color-border").trim(),
    foreground: styles.getPropertyValue("--color-foreground").trim(),
    muted: styles.getPropertyValue("--color-muted-foreground").trim(),
  };
}

export function HeroKinetic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!(canvas && ctx)) {
      return;
    }

    let colors = getCanvasColors(canvas);
    let frameId = 0;
    let startTime: number | null = null;

    const syncCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(W * dpr);
      const height = Math.round(H * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawLine = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      stroke: string,
      width: number,
      alpha: number
    ) => {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    };

    type Colors = ReturnType<typeof getCanvasColors>;

    const drawGuides = (c: Colors) => {
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(52, 2, 416, 416);

      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = c.muted;
      ctx.lineWidth = 1;
      for (const center of CENTERS) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, GUIDE_R, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawRods = (c: Colors, points: Point[]) => {
      for (let i = 0; i < RODS.length; i++) {
        const [from, to] = RODS[i];
        const primary = i < 4;
        drawLine(
          points[from],
          points[to],
          primary ? c.foreground : c.muted,
          primary ? 3 : 2,
          primary ? 1 : 0.7
        );
      }
    };

    const drawDots = (c: Colors, points: Point[]) => {
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = c.background;
      ctx.strokeStyle = c.foreground;
      ctx.lineWidth = 3;
      for (let i = 0; i < DOT_COUNT; i++) {
        const p = points[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    };

    const drawFrame = (theta: number) => {
      syncCanvasSize();
      colors = getCanvasColors(canvas);

      const points = updatePoints(theta);

      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      drawGuides(colors);
      drawRods(colors, points);
      drawDots(colors, points);

      ctx.globalAlpha = 1;
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotion.matches) {
      drawFrame(0);
      return;
    }

    const tick = (time: number) => {
      startTime ??= time;
      drawFrame((time - startTime) * BASE_SPEED);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="flex items-center justify-center">
      <canvas
        aria-hidden
        className="fade-in h-72 w-auto animate-in duration-1000 sm:h-90"
        height={H}
        ref={canvasRef}
        width={W}
      />
    </div>
  );
}
