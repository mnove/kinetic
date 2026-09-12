import { artAccents } from "@/lib/art-palette"
import {
  branchCount,
  branchDepth,
  createFlock,
  flockCount,
  flockHeight,
  flockWidth,
  genevaState,
  miuraColumns,
  miuraRows,
  neighborRadius,
  updateBranches,
  updateMiura,
  wrappedDelta,
} from "@/lib/new-studies"

const tau = Math.PI * 2
const genevaPose = genevaState(0, 5)
function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill?: string
) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, tau)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  } else ctx.stroke()
}
export function drawGeneva(
  ctx: CanvasRenderingContext2D,
  time: number,
  slots: number,
  guides: boolean
) {
  const state = genevaState(time, slots, genevaPose)
  const wheelRadius = 170 * Math.cos(Math.PI / slots) + 7
  ctx.save()
  ctx.translate(255, 210)
  ctx.strokeStyle = "#aaaaaa"
  ctx.lineWidth = 0.8
  if (guides) {
    ctx.setLineDash([3, 5])
    circle(ctx, -85, 0, state.radius)
    ctx.beginPath()
    ctx.moveTo(-135, 0)
    ctx.lineTo(100 + wheelRadius, 0)
    ctx.stroke()
    ctx.setLineDash([])
  }
  // A slotted output plate exposes the pin engagement and the dwell.
  circle(ctx, 85, 0, wheelRadius, "#c7c7c7")
  ctx.strokeStyle = "#737373"
  ctx.lineWidth = 1
  circle(ctx, 85, 0, wheelRadius)
  ctx.save()
  ctx.translate(85, 0)
  ctx.rotate(state.rotation)
  for (let i = 0; i < slots; i++) {
    const angle = Math.PI + (i * tau) / slots
    ctx.strokeStyle = "#e8e8e8"
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(
      Math.cos(angle) * (170 - state.radius - 8),
      Math.sin(angle) * (170 - state.radius - 8)
    )
    ctx.lineTo(
      Math.cos(angle) * (wheelRadius + 2),
      Math.sin(angle) * (wheelRadius + 2)
    )
    ctx.stroke()
  }
  circle(ctx, wheelRadius * 0.6, 0, 4, artAccents.blue)
  ctx.restore()
  circle(ctx, -85, 0, 22, "#ababab")
  const px = -85 + state.radius * Math.cos(state.angle)
  const py = state.radius * Math.sin(state.angle)
  ctx.strokeStyle = "#555555"
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(-85, 0)
  ctx.lineTo(px, py)
  ctx.stroke()
  circle(ctx, px, py, 5, state.engaged ? artAccents.blue : artAccents.gold)
  circle(ctx, -85, 0, 4, "#e8e8e8")
  circle(ctx, 85, 0, 6, "#555555")
  circle(ctx, 85, 0, 2, "#e8e8e8")
  ctx.restore()
}

export function createNewStudyRenderer() {
  const sheet = new Float32Array((miuraColumns + 1) * (miuraRows + 1) * 3)
  const branches = new Float64Array(branchCount * 5)
  const flock = createFlock()
  let previousTime = 0,
    accumulator = 0,
    previousParameter = NaN
  function drawMiura(
    ctx: CanvasRenderingContext2D,
    time: number,
    parameter: number,
    guides: boolean
  ) {
    updateMiura(sheet, time, parameter)
    ctx.save()
    ctx.translate(300, 210)
    // An oblique view keeps the same rigid geometry readable in gallery cards.
    for (let j = miuraRows - 1; j >= 0; j--)
      for (let i = 0; i < miuraColumns; i++) {
        ctx.beginPath()
        for (let corner = 0; corner < 4; corner++) {
          const x = i + (corner === 1 || corner === 2 ? 1 : 0)
          const y = j + (corner >= 2 ? 1 : 0)
          const k = (y * (miuraColumns + 1) + x) * 3
          const px = sheet[k] + sheet[k + 1] * 0.3
          const py = sheet[k + 1] * 0.65 - sheet[k + 2]
          if (corner === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fillStyle = i % 2 ? "#a5b5bf" : "#d4dce0"
        ctx.fill()
        ctx.lineWidth = guides ? 1 : 0.5
        ctx.strokeStyle = guides
          ? i % 2
            ? artAccents.blue
            : artAccents.gold
          : "#969fa5"
        ctx.stroke()
      }
    ctx.restore()
  }
  function drawBranches(
    ctx: CanvasRenderingContext2D,
    time: number,
    parameter: number,
    guides: boolean
  ) {
    updateBranches(branches, parameter)
    const phase = time % 16
    const growth = Math.min(branchDepth, 0.7 + phase * 0.65)
    ctx.save()
    ctx.translate(300, 350)
    ctx.globalAlpha = phase > 14 ? (16 - phase) / 2 : 1
    for (let i = 0; i < branchCount; i++) {
      const depth = Math.floor(Math.log2(i + 1)),
        k = i * 5
      const amount = Math.max(0, Math.min(1, growth - depth))
      if (!amount) continue
      const x = branches[k] + (branches[k + 2] - branches[k]) * amount
      const y = branches[k + 1] + (branches[k + 3] - branches[k + 1]) * amount
      ctx.strokeStyle = depth === 6 ? artAccents.teal : "#626b68"
      ctx.lineWidth = Math.max(0.8, 4 - depth * 0.55)
      ctx.beginPath()
      ctx.moveTo(branches[k], branches[k + 1])
      ctx.lineTo(x, y)
      ctx.stroke()
      if (guides)
        circle(ctx, x, y, 1.8, depth % 2 ? artAccents.gold : artAccents.teal)
    }
    if (guides) {
      ctx.strokeStyle = "#aaaaaa"
      ctx.lineWidth = 0.7
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(0, 8)
      ctx.lineTo(0, -275)
      ctx.stroke()
      ctx.setLineDash([])
    }
    ctx.restore()
  }
  function drawFlock(
    ctx: CanvasRenderingContext2D,
    time: number,
    parameter: number,
    guides: boolean
  ) {
    if (time < previousTime || parameter !== previousParameter) {
      flock.reset()
      accumulator = 0
      previousTime = time
    }
    accumulator += time - previousTime
    previousTime = time
    previousParameter = parameter
    while (accumulator >= 1 / 60) {
      flock.step(parameter)
      accumulator -= 1 / 60
    }
    const { positions: p, velocities: v } = flock
    ctx.save()
    ctx.translate(80, 75)
    ctx.beginPath()
    ctx.rect(0, 0, flockWidth, flockHeight)
    ctx.clip()
    if (guides) {
      ctx.strokeStyle = "#aaaaaa66"
      ctx.lineWidth = 0.7
      circle(ctx, p[0], p[1], neighborRadius)
      for (let i = 2; i < flockCount * 2; i += 2) {
        const dx = wrappedDelta(p[i] - p[0], flockWidth),
          dy = wrappedDelta(p[i + 1] - p[1], flockHeight)
        if (dx * dx + dy * dy < neighborRadius ** 2) {
          ctx.beginPath()
          ctx.moveTo(p[0], p[1])
          ctx.lineTo(p[0] + dx, p[1] + dy)
          ctx.stroke()
        }
      }
      ctx.strokeStyle = artAccents.teal
      ctx.beginPath()
      ctx.moveTo(p[0], p[1])
      ctx.lineTo(p[0] + v[0] * 0.6, p[1] + v[1] * 0.6)
      ctx.stroke()
    }
    for (let i = 0; i < flockCount * 2; i += 2) {
      ctx.save()
      ctx.translate(p[i], p[i + 1])
      ctx.rotate(Math.atan2(v[i + 1], v[i]))
      ctx.fillStyle = i === 0 ? artAccents.teal : "#656d70"
      ctx.beginPath()
      ctx.moveTo(5, 0)
      ctx.lineTo(-3.5, -2.6)
      ctx.lineTo(-2, 0)
      ctx.lineTo(-3.5, 2.6)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
    ctx.restore()
  }
  return { drawMiura, drawBranches, drawFlock }
}
