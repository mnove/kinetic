import { mobiusPoint, sampleOrbit } from "@/lib/kinetic-math"
import { markerPatches, clipSurfacePatch } from "@/lib/surface-marker"
import type { Vector3 } from "@/lib/kinetic-math"

const colors = ["#b26948", "#557c83", "#77734e"]
function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}
export function drawThreeBody(
  ctx: CanvasRenderingContext2D,
  t: number,
  trail: number,
  guides: boolean
) {
  const position = (time: number, body: number) => {
    const p = sampleOrbit(time)
    return { x: 300 + p[body * 2] * 153, y: 210 + p[body * 2 + 1] * 153 }
  }
  const time = t * 0.45
  if (guides) {
    ctx.setLineDash([3, 5])
    ctx.strokeStyle = "#a6a692"
    ctx.lineWidth = 0.7
    ctx.beginPath()
    ctx.moveTo(95, 210)
    ctx.lineTo(505, 210)
    ctx.moveTo(300, 95)
    ctx.lineTo(300, 325)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
      const p = position(time, i)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.closePath()
    ctx.strokeStyle = "#9b9b8955"
    ctx.stroke()
  }
  for (let body = 0; body < 3; body++) {
    for (let i = 0; i < trail; i++) {
      const a = position(time - (trail - i) * 0.014, body),
        b = position(time - (trail - i - 1) * 0.014, body)
      ctx.globalAlpha = 0.08 + (0.72 * i) / trail
      ctx.strokeStyle = colors[body]
      ctx.lineWidth = 1.7
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    const p = position(time, body)
    dot(ctx, p.x, p.y, 14, colors[body] + "15")
    dot(ctx, p.x, p.y, 7, colors[body])
    dot(ctx, p.x - 2, p.y - 2, 2, "#ffffff88")
  }
  if (guides) {
    ctx.font = "9px monospace"
    ctx.fillStyle = "#858773"
    ctx.textAlign = "center"
    ctx.fillText("m₁ = m₂ = m₃", 300, 355)
    ctx.textAlign = "start"
  }
}
export function drawMobius(
  ctx: CanvasRenderingContext2D,
  t: number,
  width: number,
  guides: boolean
) {
  const rotation = t * 0.18 + 0.3,
    tilt = 0.92
  const project = (p: Vector3) => {
    const x = p.x * Math.cos(rotation) - p.y * Math.sin(rotation)
    const y = p.x * Math.sin(rotation) + p.y * Math.cos(rotation)
    const z = y * Math.sin(tilt) + p.z * Math.cos(tilt)
    const scale = 650 / (650 - z)
    return {
      x: 300 + x * scale,
      y: 210 + (y * Math.cos(tilt) - p.z * Math.sin(tilt)) * scale,
      z,
    }
  }
  if (guides) {
    ctx.strokeStyle = "#a698ab66"
    ctx.lineWidth = 0.7
    ctx.setLineDash([3, 5])
    ctx.beginPath()
    ctx.ellipse(300, 210, 112, 112 * Math.cos(tilt), 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
  const patches = markerPatches(t * 0.65, width)
  const segments = 112,
    strips = 8
  const items: Array<{ depth: number; draw: () => void }> = []
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < strips; j++) {
      const u = (i / segments) * Math.PI * 2,
        next = ((i + 1) / segments) * Math.PI * 2
      const v = (j / strips - 0.5) * width,
        vn = ((j + 1) / strips - 0.5) * width
      const points = [
        mobiusPoint(u, v),
        mobiusPoint(next, v),
        mobiusPoint(next, vn),
        mobiusPoint(u, vn),
      ].map(project)
      const markings = patches
        .map((patch) => clipSurfacePatch(patch, u, next, v, vn))
        .filter((patch) => patch.length >= 3)
        .map((patch) => patch.map((p) => project(mobiusPoint(p.u, p.v))))
      const shade = 64 + 13 * Math.cos(u + rotation) + (5 * j) / strips
      items.push({
        depth: points.reduce((sum, p) => sum + p.z, 0) / 4,
        draw: () => {
          ctx.beginPath()
          points.forEach((p, k) =>
            k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
          )
          ctx.closePath()
          ctx.fillStyle = `hsl(278 13% ${shade}%)`
          ctx.fill()
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = 0.5
          ctx.stroke()
          if (guides && i % 4 === 0) {
            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            ctx.lineTo(points[3].x, points[3].y)
            ctx.strokeStyle = "#5c496544"
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
          // Paint the marking with its owning surface panel. Clip to the
          // rendered panel as well: the curved patch and planar mesh differ
          // slightly, especially when the ribbon is viewed edge-on.
          if (markings.length) {
            ctx.save()
            ctx.beginPath()
            points.forEach((p, k) =>
              k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
            )
            ctx.closePath()
            ctx.clip()
            for (const marking of markings) {
              ctx.beginPath()
              marking.forEach((p, k) =>
                k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
              )
              ctx.closePath()
              ctx.fillStyle = "#e8c08b"
              ctx.fill()
              ctx.strokeStyle = "#e8c08b"
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
            ctx.restore()
          }
          if (j === 0 || j === strips - 1) {
            const a = j === 0 ? points[0] : points[3],
              b = j === 0 ? points[1] : points[2]
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = "#62536e"
            ctx.lineWidth = 1.3
            ctx.stroke()
          }
        },
      })
    }
  }
  items.sort((a, b) => a.depth - b.depth).forEach((item) => item.draw())
}
