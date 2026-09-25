import {
  lampPose,
  maxRayPoints,
  prismVertices,
  refractiveIndex,
  screenX,
  spectrumCount,
  traceRay,
  wavelength,
} from "@/lib/prism"

const centerX = 235,
  centerY = 125
// An approximate visible-spectrum colour for each traced wavelength.
const spectrum = Array.from({ length: spectrumCount }, (_, i) => {
  const w = wavelength(i)
  const [r, g, b] =
    w < 440
      ? [(440 - w) / 60, 0, 1]
      : w < 490
        ? [0, (w - 440) / 50, 1]
        : w < 510
          ? [0, 1, (510 - w) / 20]
          : w < 580
            ? [(w - 510) / 70, 1, 0]
            : w < 645
              ? [1, (645 - w) / 65, 0]
              : [1, 0, 0]
  const channel = (v: number) => Math.round(255 * v ** 0.8)
  return `rgb(${channel(r)}, ${channel(g)}, ${channel(b)})`
})
const middle = Math.floor(spectrumCount / 2)
function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string
) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

export function createPrismRenderer() {
  const vertices = new Float64Array(6),
    points = new Float64Array(maxRayPoints * 2),
    lamp = { x: 0, y: 0, angle: 0 }
  function drawPrism(
    ctx: CanvasRenderingContext2D,
    time: number,
    apex: number,
    guides: boolean
  ) {
    prismVertices(apex, centerX, centerY, vertices)
    lampPose(apex, time, vertices, lamp)
    const ox = lamp.x,
      oy = lamp.y,
      dx = Math.cos(lamp.angle),
      dy = Math.sin(lamp.angle)
    ctx.save()
    ctx.strokeStyle = "#9a9a9a"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(screenX, 30)
    ctx.lineTo(screenX, 410)
    ctx.stroke()
    traceRay(vertices, refractiveIndex(550), ox, oy, dx, dy, points)
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 4
    ctx.shadowColor = "#00000030"
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.moveTo(points[0], points[1])
    ctx.lineTo(points[2], points[3])
    ctx.stroke()
    ctx.shadowBlur = 0
    for (let i = 0; i < spectrumCount; i++) {
      const count = traceRay(
        vertices,
        refractiveIndex(wavelength(i)),
        ox,
        oy,
        dx,
        dy,
        points
      )
      const last = (count - 1) * 2
      // The colours part as soon as the light enters: a thin wedge inside
      // the glass, a broad band once the second face bends them again.
      ctx.strokeStyle = spectrum[i]
      ctx.globalAlpha = 0.9
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.moveTo(points[2], points[3])
      for (let k = 2; k < count - 1; k++)
        ctx.lineTo(points[k * 2], points[k * 2 + 1])
      ctx.stroke()
      ctx.globalAlpha = 0.85
      ctx.lineWidth = 3.2
      ctx.beginPath()
      ctx.moveTo(points[last - 2], points[last - 1])
      ctx.lineTo(points[last], points[last + 1])
      ctx.stroke()
      if (Math.abs(points[last] - screenX) < 1e-6) {
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.moveTo(screenX + 3, points[last + 1])
        ctx.lineTo(screenX + 9, points[last + 1])
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.moveTo(vertices[0], vertices[1])
    ctx.lineTo(vertices[2], vertices[3])
    ctx.lineTo(vertices[4], vertices[5])
    ctx.closePath()
    ctx.fillStyle = "#ffffff38"
    ctx.fill()
    ctx.strokeStyle = "#7d7d7d"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.save()
    ctx.translate(ox, oy)
    ctx.rotate(lamp.angle)
    circle(ctx, 0, 0, 14, "#ffffff55")
    ctx.fillStyle = "#555555"
    ctx.fillRect(-26, -8, 22, 16)
    ctx.fillStyle = "#6f6f6f"
    ctx.fillRect(-30, -5, 4, 10)
    ctx.fillStyle = "#f4f1e4"
    ctx.fillRect(-4, -8, 4, 16)
    ctx.restore()
    if (guides) {
      // Surface normals where the middle wavelength enters and leaves.
      const count = traceRay(
        vertices,
        refractiveIndex(wavelength(middle)),
        ox,
        oy,
        dx,
        dy,
        points
      )
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = "#8f8f8f"
      ctx.lineWidth = 0.8
      for (let k = 1; k < Math.min(count - 1, 3); k++) {
        const edge = k === 1 ? 4 : 2
        const ex = vertices[edge] - vertices[0],
          ey = vertices[edge + 1] - vertices[1],
          length = Math.hypot(ex, ey)
        const x = points[k * 2],
          y = points[k * 2 + 1]
        // A totally reflected ray meets another face; it has no normal here.
        if (Math.abs((x - vertices[0]) * ey - (y - vertices[1]) * ex) > length)
          continue
        ctx.beginPath()
        ctx.moveTo(x - (ey / length) * 45, y + (ex / length) * 45)
        ctx.lineTo(x + (ey / length) * 45, y - (ex / length) * 45)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.font = "9px monospace"
      ctx.fillStyle = "#858585"
      ctx.textAlign = "center"
      ctx.fillText("n₁ sin θ₁ = n₂ sin θ₂", 250, 382)
      ctx.fillText("n(λ) = A + B / λ²", 250, 396)
      ctx.textAlign = "start"
    }
    ctx.restore()
  }
  return { drawPrism }
}
