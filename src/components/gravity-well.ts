import { artAccents } from "@/lib/art-palette"
import {
  createWell,
  wellBodies,
  wellDepth,
  wellRadius,
} from "@/lib/gravity-well"

const tau = Math.PI * 2
const colors = [artAccents.gold, artAccents.blue, artAccents.violet]
const trail = 110
function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string
) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, tau)
  ctx.fillStyle = fill
  ctx.fill()
}

export function createGravityWellRenderer() {
  const well = createWell()
  const current = { x: 0, y: 0, r: 0 },
    previous = { x: 0, y: 0, r: 0 }
  let mass = 0
  // An oblique view from above: the plane is foreshortened and depth drops
  // straight down the screen, so the well reads as a funnel.
  const screenX = (x: number) => 300 + x
  const screenY = (y: number, r: number) => 150 + y * 0.42 + wellDepth(r, mass)
  function ring(ctx: CanvasRenderingContext2D, r: number) {
    ctx.beginPath()
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * tau
      const x = screenX(r * Math.cos(a)),
        y = screenY(r * Math.sin(a), r)
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.stroke()
  }
  function drawGravityWell(
    ctx: CanvasRenderingContext2D,
    time: number,
    parameter: number,
    guides: boolean
  ) {
    mass = parameter
    well.prepare(parameter)
    ctx.save()
    ctx.strokeStyle = "#b3b3b3"
    ctx.lineWidth = 0.7
    for (let k = 1; k <= 10; k++) ring(ctx, (k / 10) * wellRadius)
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * tau,
        c = Math.cos(a),
        s = Math.sin(a)
      ctx.beginPath()
      for (let i = 0; i <= 32; i++) {
        // Samples crowd towards the centre, where the surface bends fastest.
        const r = wellRadius * (i / 32) ** 1.6
        const x = screenX(r * c),
          y = screenY(r * s, r)
        if (i) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      }
      ctx.stroke()
    }
    const bottom = screenY(0, 0)
    circle(ctx, 300, bottom, 4 + mass * 0.07, "#4d4d4d")
    circle(ctx, 298, bottom - 2, 1.6 + mass * 0.02, "#ffffff55")
    if (guides) {
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = colors[0]
      ctx.lineWidth = 0.9
      ring(ctx, wellBodies[0].radius)
      ring(ctx, well.periapses[0])
      ctx.strokeStyle = "#a5a5a5"
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(300, 150)
      ctx.lineTo(300, bottom)
      ctx.stroke()
      ctx.setLineDash([])
    }
    for (let body = 0; body < wellBodies.length; body++) {
      ctx.strokeStyle = colors[body]
      ctx.lineWidth = 1.6
      well.sample(body, time - trail * 0.03, previous)
      for (let i = 1; i <= trail; i++) {
        well.sample(body, time - (trail - i) * 0.03, current)
        ctx.globalAlpha = 0.06 + (0.74 * i) / trail
        ctx.beginPath()
        ctx.moveTo(screenX(previous.x), screenY(previous.y, previous.r))
        ctx.lineTo(screenX(current.x), screenY(current.y, current.r))
        ctx.stroke()
        previous.x = current.x
        previous.y = current.y
        previous.r = current.r
      }
      ctx.globalAlpha = 1
      const x = screenX(current.x),
        y = screenY(current.y, current.r)
      if (guides && body === 0) {
        well.sample(body, time + 0.25, previous)
        ctx.strokeStyle = colors[0]
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(screenX(previous.x), screenY(previous.y, previous.r))
        ctx.stroke()
      }
      circle(ctx, x, y, 12, colors[body] + "18")
      circle(ctx, x, y, 6, colors[body])
      circle(ctx, x - 1.8, y - 1.8, 1.8, "#ffffff88")
    }
    if (guides) {
      ctx.font = "9px monospace"
      ctx.fillStyle = "#858585"
      ctx.textAlign = "center"
      ctx.fillText("Φ = −GM / √(r² + ε²)", 300, 382)
      ctx.textAlign = "start"
    }
    ctx.restore()
  }
  return { drawGravityWell }
}
