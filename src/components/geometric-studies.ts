import { artAccents } from "@/lib/art-palette"
import {
  spirographPeriod,
  spirographPoint,
  tesseractEdges,
  tesseractVertices,
} from "@/lib/geometric-studies"

type Point = { x: number; y: number }
function line(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  color: string,
  width = 1
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
  p: Point,
  r: number,
  color: string,
  fill = false
) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  if (fill) ctx.fill()
  else {
    ctx.lineWidth = 0.8
    ctx.stroke()
  }
}
export function drawTesseract(
  ctx: CanvasRenderingContext2D,
  t: number,
  distance: number,
  guides: boolean
) {
  const points = tesseractVertices(t).map(([x, y, z, w]) => {
    const scale = distance / (distance - w)
    const rx = (x * 0.88 + z * 0.47) * scale,
      rz = (z * 0.88 - x * 0.47) * scale
    const ry = y * scale * 0.94 - rz * 0.34
    const perspective = 6 / (6 - rz)
    return {
      x: 300 + rx * 57 * perspective,
      y: 210 + ry * 48 * perspective,
      z: rz,
      w,
    }
  })
  if (guides) {
    circle(ctx, { x: 300, y: 210 }, 160, "#a7a7a744")
    line(ctx, { x: 294, y: 210 }, { x: 306, y: 210 }, "#a7a7a7")
    line(ctx, { x: 300, y: 204 }, { x: 300, y: 216 }, "#a7a7a7")
  }
  const edges = [...tesseractEdges].sort(
    ([a, b], [c, d]) => points[a].z + points[b].z - points[c].z - points[d].z
  )
  edges.forEach(([a, b]) =>
    line(
      ctx,
      points[a],
      points[b],
      (a ^ b) === 8 ? artAccents.blue : a & 8 ? "#757575" : "#4e4e4e",
      (a ^ b) === 8 ? 1.2 : 1.7
    )
  )
  points.forEach((p) =>
    circle(ctx, p, 2.8, p.w > 0 ? artAccents.blue : "#606060", true)
  )
}
export function drawSpirograph(
  ctx: CanvasRenderingContext2D,
  t: number,
  offset: number,
  guides: boolean
) {
  const angle = t * 0.75
  const screen = (a: number) => {
    const p = spirographPoint(a, offset)
    return { x: 300 + p.x, y: 210 + p.y }
  }
  if (guides) {
    circle(ctx, { x: 300, y: 210 }, 105, "#a9a9a988")
    const center = {
      x: 300 + 63 * Math.cos(angle),
      y: 210 + 63 * Math.sin(angle),
    }
    circle(ctx, center, 42, "#9d9d9d")
    line(ctx, center, screen(angle), "#999999")
    circle(ctx, center, 2, "#818181", true)
  }
  // A faint complete trace keeps the form legible even when motion is paused.
  ctx.beginPath()
  for (let i = 0; i <= 720; i++) {
    const p = screen((i / 720) * spirographPeriod)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.strokeStyle = "#89898944"
  ctx.lineWidth = 0.8
  ctx.stroke()
  for (let i = 0; i < 360; i++) {
    const a = angle - spirographPeriod * (1 - i / 360),
      b = angle - spirographPeriod * (1 - (i + 1) / 360)
    ctx.globalAlpha = 0.12 + (0.88 * i) / 360
    line(ctx, screen(a), screen(b), "#656565", 1.7)
  }
  ctx.globalAlpha = 1
  circle(ctx, screen(angle), 4, artAccents.orange, true)
}
export function drawImpossibleTriangle(
  ctx: CanvasRenderingContext2D,
  t: number,
  maxAngle: number,
  guides: boolean
) {
  // Three disconnected solid beams coincide only in the frontal projection.
  // Turning the assembly exposes their different depths at every joint.
  const yaw = (Math.pow(Math.sin(t * 0.22), 6) * maxAngle * Math.PI) / 180
  const outer = [
    { x: 0, y: -125 },
    { x: 125, y: 91 },
    { x: -125, y: 91 },
  ]
  const inner = [
    { x: 0, y: -66 },
    { x: 74, y: 61 },
    { x: -74, y: 61 },
  ]
  const project = (p: Point, z: number) => ({
    x: 300 + p.x * Math.cos(yaw) + z * Math.sin(yaw),
    y: 218 + p.y,
    depth: z * Math.cos(yaw) - p.x * Math.sin(yaw),
  })
  const faces: Array<{
    points: ReturnType<typeof project>[]
    color: string
    depth: number
  }> = []
  const colors = ["#a4a4a4", artAccents.teal, "#c5c5c5"]
  const add = (points: ReturnType<typeof project>[], color: string) =>
    faces.push({
      points,
      color,
      depth: points.reduce((sum, p) => sum + p.depth, 0) / points.length,
    })
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3
    const shape = [outer[i], outer[j], inner[j], inner[i]]
    const depths = [-45, 45, 45, -45]
    const front = shape.map((p, k) => project(p, depths[k] + 7)),
      back = shape.map((p, k) => project(p, depths[k] - 7))
    add(back, "#616161")
    for (let k = 0; k < 4; k++)
      add([back[k], back[(k + 1) % 4], front[(k + 1) % 4], front[k]], "#6e6e6e")
    add(front, colors[i])
    // A narrow bevel gives each beam a readable thickness in the illusion view.
    const bevel = shape.map((p, k) =>
      k < 2
        ? p
        : {
            x: p.x + (shape[3 - k].x - p.x) * 0.72,
            y: p.y + (shape[3 - k].y - p.y) * 0.72,
          }
    )
    add(
      bevel.map((p, k) => project(p, depths[k] + 7.1)),
      ["#c4c4c4", "#9c9c9c", "#dadada"][i]
    )
  }
  faces
    .sort((a, b) => a.depth - b.depth)
    .forEach(({ points, color }) => {
      ctx.beginPath()
      points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
      )
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 0.6
      ctx.stroke()
    })
  if (guides) {
    ctx.font = "9px monospace"
    ctx.fillStyle = "#7f7f7f"
    ctx.textAlign = "center"
    ctx.fillText(
      yaw < 0.05
        ? "ONE VIEW. AN IMPOSSIBLE CONNECTION."
        : "A TURN REVEALS THREE SEPARATE BEAMS.",
      300,
      361
    )
    ctx.textAlign = "start"
  }
}
