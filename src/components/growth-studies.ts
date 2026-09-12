import { artAccents } from "@/lib/art-palette"
import {
  hexagonCenters,
  seedCount,
  segmentCrossing,
  updateHexagon,
  updatePhyllotaxis,
} from "@/lib/growth-studies"

const seeds = new Float64Array(seedCount * 2)
const pivots = new Float64Array(12)
const crossings = new Float64Array(6)
const tau = Math.PI * 2
function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, tau)
  ctx.fillStyle = color
  ctx.fill()
}
export function drawPhyllotaxis(
  ctx: CanvasRenderingContext2D,
  time: number,
  offset: number,
  guides: boolean
) {
  updatePhyllotaxis(seeds, time, offset)
  ctx.save()
  ctx.translate(300, 210)
  if (guides) {
    ctx.strokeStyle = "#a5a5a54d"
    ctx.lineWidth = 0.7
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath()
      ctx.arc(0, 0, 148 * Math.sqrt(i / 3), 0, tau)
      ctx.stroke()
    }
  }
  for (let i = 0; i < seedCount; i++)
    dot(
      ctx,
      seeds[i * 2],
      seeds[i * 2 + 1],
      1.25 + 0.75 * Math.sqrt(i / seedCount),
      i % 34 === 0 ? artAccents.gold : "#737373"
    )
  dot(ctx, 0, 0, 2, artAccents.gold)
  ctx.restore()
}
function connection(
  ctx: CanvasRenderingContext2D,
  a: number,
  b: number,
  color: string,
  width: number
) {
  ctx.beginPath()
  ctx.moveTo(pivots[a * 2], pivots[a * 2 + 1])
  ctx.lineTo(pivots[b * 2], pivots[b * 2 + 1])
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}
export function drawArticulatedHexagon(
  ctx: CanvasRenderingContext2D,
  time: number,
  radius: number,
  guides: boolean
) {
  updateHexagon(pivots, time, radius)
  ctx.save()
  ctx.translate(300, 210)
  if (guides) {
    ctx.strokeStyle = "#aaaaaa77"
    ctx.lineWidth = 0.7
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.arc(hexagonCenters[i * 2], hexagonCenters[i * 2 + 1], radius, 0, tau)
      ctx.stroke()
      dot(ctx, hexagonCenters[i * 2], hexagonCenters[i * 2 + 1], 1.5, "#a0a0a0")
    }
  }
  // Alternate-vertex triangles and opposing diagonals expose different
  // intersections as neighbouring pivots move in opposite directions.
  for (let i = 0; i < 6; i++) connection(ctx, i, (i + 2) % 6, "#909090", 1)
  for (let i = 0; i < 3; i++) connection(ctx, i, i + 3, "#aaaaaa", 1)
  for (let i = 0; i < 6; i++)
    connection(ctx, i, (i + 1) % 6, artAccents.teal, 2.5)
  segmentCrossing(crossings, 0, pivots, 0, 3, 1, 4)
  segmentCrossing(crossings, 2, pivots, 1, 4, 2, 5)
  segmentCrossing(crossings, 4, pivots, 2, 5, 0, 3)
  for (let i = 0; i < 3; i++)
    if (Number.isFinite(crossings[i * 2]))
      dot(ctx, crossings[i * 2], crossings[i * 2 + 1], 3, artAccents.gold)
  for (let i = 0; i < 6; i++) {
    dot(ctx, pivots[i * 2], pivots[i * 2 + 1], 4.5, "#555555")
    dot(ctx, pivots[i * 2], pivots[i * 2 + 1], 2.5, "#e8e8e8")
  }
  ctx.restore()
}
