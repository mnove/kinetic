import { artAccents } from "@/lib/art-palette"
import { rollingCube } from "@/lib/rolling-cube"
import type { Vector3 } from "@/lib/kinetic-math"

export function drawRollingCube(
  ctx: CanvasRenderingContext2D,
  time: number,
  layers: number,
  guides: boolean
) {
  const slices = rollingCube(time, layers)
  const project = (p: Vector3) => ({
    x: 300 + (p.x - p.z) * 57,
    y: 260 + (p.x + p.z) * 30 - p.y * 66,
  })
  const edges: Array<{ a: Vector3; b: Vector3; depth: number }> = []
  const edge = (a: Vector3, b: Vector3) =>
    edges.push({ a, b, depth: (a.x + a.z + b.x + b.z) / 2 })
  slices.forEach((slice, i) => {
    slice.forEach((point, k) => edge(point, slice[(k + 1) % 4]))
    // Connect settled neighbours; each active layer remains a rigid square.
    if (
      i > 0 &&
      slice.every(
        (p, k) =>
          Math.hypot(p.x - slices[i - 1][k].x, p.y - slices[i - 1][k].y) < 1e-7
      )
    ) {
      slice.forEach((p, k) => edge(p, slices[i - 1][k]))
    }
  })
  if (guides) {
    ctx.setLineDash([2, 6])
    ctx.strokeStyle = "#a8a8a855"
    ctx.lineWidth = 0.7
    for (const z of [-1, 1]) {
      const a = project({ x: -2.5, y: 0, z }),
        b = project({ x: 2.5, y: 0, z })
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }
  edges
    .sort((a, b) => a.depth - b.depth)
    .forEach(({ a, b, depth }) => {
      const p = project(a),
        q = project(b)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(q.x, q.y)
      ctx.strokeStyle = depth < 0 ? "#7d7d7d" : "#474747"
      ctx.lineWidth = 1.25
      ctx.stroke()
    })
  const marker = project(slices[0][0])
  ctx.beginPath()
  ctx.arc(marker.x, marker.y, 3.5, 0, Math.PI * 2)
  ctx.fillStyle = artAccents.blue
  ctx.fill()
}
