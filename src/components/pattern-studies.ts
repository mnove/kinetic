import { artAccents } from "@/lib/art-palette"
import { mirrorSector, rollingPolygon } from "@/lib/pattern-studies"

export function drawKaleidoscope(
  ctx: CanvasRenderingContext2D,
  t: number,
  pairs: number,
  guides: boolean
) {
  const radius = 151
  const colors = [
    artAccents.teal,
    artAccents.orange,
    artAccents.violet,
    artAccents.gold,
    artAccents.blue,
    artAccents.red,
  ]
  ctx.save()
  ctx.translate(300, 210)
  for (let sector = 0; sector < pairs * 2; sector++) {
    const { rotation, reflection, wedge } = mirrorSector(sector, pairs)
    ctx.save()
    ctx.rotate(rotation)
    ctx.scale(1, reflection)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, 0, wedge)
    ctx.closePath()
    ctx.clip()
    ctx.fillStyle = "#dbdbdb"
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2)
    for (let i = 0; i < 10; i++) {
      const phase = t * 0.24 + i * 1.37
      const r = 22 + i * 13 + Math.sin(phase) * 17
      const a = wedge * (0.5 + 0.65 * Math.sin(phase * 0.8 + i))
      const x = r * Math.cos(a),
        y = r * Math.sin(a)
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(phase * 0.7)
      ctx.globalAlpha = 0.84
      ctx.fillStyle = colors[i % colors.length]
      ctx.beginPath()
      if (i % 3 === 0)
        ctx.ellipse(0, 0, 24 + 7 * Math.cos(phase), 11, 0, 0, Math.PI * 2)
      else {
        const size = 21 + (i % 4) * 5
        ctx.moveTo(-size, 0)
        ctx.lineTo(0, -size * 0.7)
        ctx.lineTo(size, 0)
        ctx.lineTo(0, size * 0.7)
        ctx.closePath()
      }
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = "#ededed66"
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()
  }
  if (guides) {
    ctx.strokeStyle = "#6b6b6b4a"
    ctx.lineWidth = 0.6
    for (let i = 0; i < pairs * 2; i++) {
      const a = (i * Math.PI) / pairs
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(radius * Math.cos(a), radius * Math.sin(a))
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, 0, radius + 5, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}
export function drawRollingPolygons(
  ctx: CanvasRenderingContext2D,
  t: number,
  sides: number,
  guides: boolean
) {
  const model = rollingPolygon(t, sides),
    floor = 291
  ctx.strokeStyle = "#979797"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(78, floor)
  ctx.lineTo(522, floor)
  ctx.stroke()
  // Ground markings move with the camera, making forward travel visible.
  ctx.save()
  ctx.beginPath()
  ctx.rect(78, floor, 444, 20)
  ctx.clip()
  const offset = ((model.distance % 28) + 28) % 28
  for (let x = 78 - offset; x < 550; x += 28) {
    ctx.beginPath()
    ctx.moveTo(x, floor + 5)
    ctx.lineTo(x - 5, floor + 10)
    ctx.strokeStyle = "#acacac88"
    ctx.stroke()
  }
  ctx.restore()
  if (guides) {
    ctx.beginPath()
    ctx.arc(300, floor - model.centerY, 72, 0, Math.PI * 2)
    ctx.strokeStyle = "#a1a1a166"
    ctx.setLineDash([3, 5])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    for (let i = 0; i <= 120; i++) {
      const past = rollingPolygon(Math.max(0, t - i * 0.02), sides)
      const point = past.vertices[0]
      const x = 300 + point.x + past.distance - model.distance,
        y = floor - point.y
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = artAccents.lime
    ctx.lineWidth = 1.6
    ctx.stroke()
  }
  ctx.beginPath()
  model.vertices.forEach((p, i) =>
    i ? ctx.lineTo(300 + p.x, floor - p.y) : ctx.moveTo(300 + p.x, floor - p.y)
  )
  ctx.closePath()
  ctx.fillStyle = "#a5a5a560"
  ctx.fill()
  ctx.strokeStyle = "#646464"
  ctx.lineWidth = 2
  ctx.stroke()
  if (guides) {
    const marked = model.vertices[0]
    ctx.beginPath()
    ctx.moveTo(300, floor - model.centerY)
    ctx.lineTo(300 + marked.x, floor - marked.y)
    ctx.strokeStyle = "#808080"
    ctx.lineWidth = 0.9
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(300 + model.pivotX, floor, 3, 0, Math.PI * 2)
    ctx.fillStyle = "#646464"
    ctx.fill()
  }
  const marked = model.vertices[0]
  ctx.beginPath()
  ctx.arc(300 + marked.x, floor - marked.y, 4, 0, Math.PI * 2)
  ctx.fillStyle = artAccents.lime
  ctx.fill()
}
