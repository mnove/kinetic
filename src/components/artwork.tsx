import { lazy, Suspense, useEffect, useRef, useState } from "react"
import type { ComponentProps } from "react"
import { drawThreeBody, drawMobius } from "./extra-artworks"
import { drawGyroscope } from "./gyroscope"
import { drawRollingCube } from "./rolling-cube"
import { drawRollingWave } from "./rolling-wave"
import {
  drawTesseract,
  drawImpossibleTriangle,
  drawSpirograph,
} from "./geometric-studies"
import { drawEpicycles, drawChladni } from "./harmonic-studies"
import { drawKaleidoscope, drawRollingPolygons } from "./pattern-studies"
import type { Study } from "@/lib/studies"

type Point = { x: number; y: number }
const tau = Math.PI * 2
const ink = "#34463c"
function line(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  color = ink,
  width = 1.5
) {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}
function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill?: string,
  stroke?: string
) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, tau)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    ctx.stroke()
  }
}
function polygon(ctx: CanvasRenderingContext2D, points: Point[], fill: string) {
  ctx.beginPath()
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = "#796e59"
  ctx.lineWidth = 0.7
  ctx.stroke()
}
function draw(
  ctx: CanvasRenderingContext2D,
  study: Study,
  t: number,
  parameter: number,
  guides: boolean
) {
  ctx.clearRect(0, 0, 600, 420)
  ctx.lineCap = "round"
  if (study.kind === "linkage") {
    const centers = [
      { x: 208, y: 118 },
      { x: 392, y: 118 },
      { x: 208, y: 302 },
      { x: 392, y: 302 },
    ]
    const phases = [
      Math.PI / 4,
      (Math.PI * 3) / 4,
      -Math.PI / 4,
      (-Math.PI * 3) / 4,
    ]
    const directions = [-1, 1, 1, -1]
    const points = centers.flatMap((c, i) =>
      [0, 1].map((j) => ({
        x:
          c.x +
          parameter *
            Math.cos(t * 0.22 + phases[i] + (j * directions[i] * Math.PI) / 2),
        y:
          c.y +
          parameter *
            Math.sin(t * 0.22 + phases[i] + (j * directions[i] * Math.PI) / 2),
      }))
    )
    if (guides) {
      ctx.strokeStyle = "#a5afa0"
      ctx.lineWidth = 0.6
      ctx.strokeRect(116, 26, 368, 368)
      centers.forEach((c) => {
        circle(ctx, c.x, c.y, parameter, undefined, "#aab3a4")
        circle(ctx, c.x, c.y, 2, "#9da794")
      })
    }
    const rods = [
      [0, 2],
      [2, 6],
      [6, 4],
      [4, 0],
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [1, 3],
      [5, 7],
      [1, 2],
      [1, 4],
      [3, 6],
      [5, 6],
      [5, 0],
      [7, 2],
    ]
    rods.forEach(([a, b], i) =>
      line(
        ctx,
        points[a],
        points[b],
        i < 4 ? ink : "#85917c",
        i < 4 ? 2.5 : 1.5
      )
    )
    points.forEach((p) => {
      circle(ctx, p.x, p.y, 5, study.color, ink)
      circle(ctx, p.x, p.y, 1.5, ink)
    })
  } else if (study.kind === "stairs") {
    // Each flight uses a local perspective: every riser ascends, yet the
    // projected ring closes. This is a 2D impossible object, not a 3D model.
    const outer = [
      { x: 300, y: 91 },
      { x: 484, y: 201 },
      { x: 300, y: 311 },
      { x: 116, y: 201 },
    ]
    const inner = [
      { x: 300, y: 150 },
      { x: 386, y: 201 },
      { x: 300, y: 252 },
      { x: 214, y: 201 },
    ]
    const mix = (a: Point, b: Point, f: number): Point => ({
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
    })
    const lower = (p: Point, amount: number): Point => ({
      x: p.x,
      y: p.y + amount,
    })
    if (guides) {
      ctx.setLineDash([3, 5])
      line(ctx, { x: 70, y: 352 }, { x: 530, y: 352 }, "#c8bfaf", 0.7)
      line(ctx, { x: 300, y: 60 }, { x: 300, y: 365 }, "#c8bfaf", 0.7)
      ctx.setLineDash([])
    }
    for (const side of [0, 3, 1, 2]) {
      const next = (side + 1) % 4
      polygon(
        ctx,
        [
          outer[side],
          outer[next],
          lower(outer[next], parameter + 8),
          lower(outer[side], parameter + 8),
        ],
        side < 2 ? "#7c836d" : "#a4a58c"
      )
      polygon(
        ctx,
        [
          inner[side],
          inner[next],
          lower(inner[next], parameter + 8),
          lower(inner[side], parameter + 8),
        ],
        "#8b9079"
      )
    }
    const rise = parameter * 0.3
    for (const side of [0, 3, 1, 2]) {
      const next = (side + 1) % 4
      for (let step = 0; step < 7; step++) {
        const a = mix(outer[side], outer[next], step / 7)
        const b = mix(outer[side], outer[next], (step + 1) / 7)
        const c = mix(inner[side], inner[next], (step + 1) / 7)
        const d = mix(inner[side], inner[next], step / 7)
        polygon(
          ctx,
          [a, lower(b, rise), lower(c, rise), d],
          side % 2 ? "#d6d2bb" : "#c6c8ac"
        )
        polygon(ctx, [b, c, lower(c, rise), lower(b, rise)], "#818a71")
      }
    }
    const progress = (t * 2) % 28,
      side = Math.floor(progress / 7),
      f = progress % 1
    const v = mix(
      mix(outer[side], inner[side], 0.5),
      mix(outer[(side + 1) % 4], inner[(side + 1) % 4], 0.5),
      (progress % 7) / 7
    )
    ctx.save()
    ctx.translate(v.x, v.y)
    ctx.scale(1, 0.4)
    circle(ctx, 0, 0, 8, "#666b5c44")
    ctx.restore()
    circle(ctx, v.x, v.y - 10 - Math.sin(f * Math.PI) * 5, 7, "#bd5f3c")
    circle(ctx, v.x - 2, v.y - 12 - Math.sin(f * Math.PI) * 5, 2, "#e4a17c")
  } else if (study.kind === "pendulum") {
    line(ctx, { x: 107, y: 78 }, { x: 493, y: 78 }, "#586876", 2)
    for (let i = 0; i < 15; i++) {
      const origin = { x: 118 + i * 26, y: 78 },
        length = 166 + i * 4.6
      const angle =
        (Math.sin((t * tau * (24 + i)) / 60) * parameter * Math.PI) / 180
      const end = {
        x: origin.x + Math.sin(angle) * length * 0.64,
        y: origin.y + Math.cos(angle) * length,
      }
      if (guides) {
        circle(ctx, origin.x, origin.y, 2, "#72808a")
        line(
          ctx,
          { x: origin.x, y: 340 },
          { x: origin.x, y: 345 },
          "#9aa7b2",
          0.8
        )
      }
      line(ctx, origin, end, "#748696", 1)
      circle(ctx, end.x, end.y, 8, `hsl(${202 + i * 1.6} 19% ${34 + i * 1.6}%)`)
      circle(ctx, end.x - 2, end.y - 2, 2, "#ffffff66")
    }
  } else if (study.kind === "kaleidoscope") {
    drawKaleidoscope(ctx, t, parameter, guides)
  } else if (study.kind === "polygons") {
    drawRollingPolygons(ctx, t, parameter, guides)
  } else if (study.kind === "epicycles") {
    drawEpicycles(ctx, t, parameter, guides)
  } else if (study.kind === "chladni") {
    drawChladni(ctx, t, parameter, guides)
  } else if (study.kind === "tesseract") {
    drawTesseract(ctx, t, parameter, guides)
  } else if (study.kind === "triangle") {
    drawImpossibleTriangle(ctx, t, parameter, guides)
  } else if (study.kind === "spirograph") {
    drawSpirograph(ctx, t, parameter, guides)
  } else if (study.kind === "threebody") {
    drawThreeBody(ctx, t, parameter, guides)
  } else if (study.kind === "rollingcube") {
    drawRollingCube(ctx, t, parameter, guides)
  } else if (study.kind === "rollingwave") {
    drawRollingWave(ctx, t, parameter, guides)
  } else if (study.kind === "gyroscope") {
    drawGyroscope(ctx, t, parameter, guides)
  } else if (study.kind === "mobius") {
    drawMobius(ctx, t, parameter, guides)
  } else {
    for (let layer = 0; layer < 2; layer++) {
      const phase = t * 0.22 + layer * Math.PI,
        x = 300 + Math.cos(phase) * parameter * 0.6,
        y = 210 + Math.sin(phase) * parameter * 0.6
      for (let i = 1; i <= 28; i++)
        circle(ctx, x, y, i * 5.4, undefined, layer ? "#9d6555" : "#594d48")
      if (guides) {
        line(ctx, { x: x - 5, y }, { x: x + 5, y }, "#ad6349", 1)
        line(ctx, { x, y: y - 5 }, { x, y: y + 5 }, "#ad6349", 1)
      }
    }
  }
}
function CanvasArtwork({
  study,
  playing = true,
  speed = 1,
  parameter = study.initial,
  guides = true,
  reset = 0,
}: {
  study: Study
  playing?: boolean
  speed?: number
  parameter?: number
  guides?: boolean
  reset?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const time = useRef(0)
  const settings = useRef({ playing, speed, parameter, guides })
  useEffect(() => {
    settings.current = { playing, speed, parameter, guides }
  }, [playing, speed, parameter, guides])
  useEffect(() => {
    time.current = 0
  }, [reset])
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    let frame = 0,
      last = 0,
      visible = true
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = 600 * dpr
      canvas.height = 420 * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    observer.observe(canvas)
    const tick = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      const s = settings.current
      if (visible) {
        if (s.playing && !motion.matches) time.current += delta * s.speed
        draw(ctx, study, time.current, s.parameter, s.guides)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", resize)
    }
  }, [study])
  return (
    <canvas
      ref={ref}
      width={600}
      height={420}
      className="artwork"
      role="img"
      aria-label={`${study.title}: ${study.subtitle}`}
    />
  )
}

const Artwork3D = lazy(() => import("./three/artwork-3d"))
const spatialKinds = new Set([
  "mobius",
  "gyroscope",
  "rollingwave",
  "rollingcube",
  "tesseract",
  "triangle",
])
export function Artwork(props: ComponentProps<typeof CanvasArtwork>) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const fallback = <CanvasArtwork {...props} />
  if (!mounted || !spatialKinds.has(props.study.kind)) return fallback
  return (
    <Suspense fallback={fallback}>
      <Artwork3D {...props} fallback={fallback} />
    </Suspense>
  )
}
