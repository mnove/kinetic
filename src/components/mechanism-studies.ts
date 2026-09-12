import { artAccents } from "@/lib/art-palette"
import {
  irisOpening,
  irisBladeCount,
  irisPivotRadius,
  updateIrisGeometry,
  trammelSpacing,
  updateTrammel,
} from "@/lib/mechanism-studies"

const tau = Math.PI * 2
const bladeColors = [
  "#aaaaaa",
  "#999999",
  "#b5b5b5",
  "#a1a1a1",
  "#bcbcbc",
  "#9b9b9b",
  "#aeaeae",
  "#969696",
  "#b6b6b6",
]
const irisGeometry = new Float64Array(irisBladeCount * 4)
const trammel = { ax: 0, by: 0, px: 0, py: 0 }
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
export function drawIris(
  ctx: CanvasRenderingContext2D,
  time: number,
  maximum: number,
  guides: boolean
) {
  const opening = irisOpening(time, maximum)
  const step = tau / irisBladeCount
  updateIrisGeometry(irisGeometry, opening)
  ctx.save()
  ctx.translate(300, 210)
  // A shared boundary for each pair of leaves eliminates the cyclic painter's
  // seam. The unpainted center is a real opening through to the backdrop.
  for (let i = 0; i < irisBladeCount; i++) {
    const current = i * 4
    const next = ((i + 1) % irisBladeCount) * 4
    const angle = i * step - 0.5
    ctx.beginPath()
    ctx.moveTo(irisGeometry[current], irisGeometry[current + 1])
    ctx.arc(0, 0, irisPivotRadius, angle, angle + step)
    ctx.lineTo(irisGeometry[next + 2], irisGeometry[next + 3])
    ctx.lineTo(irisGeometry[current + 2], irisGeometry[current + 3])
    ctx.closePath()
    ctx.fillStyle = bladeColors[i]
    ctx.fill()
  }
  // Draw all exposed edges after the leaves so the accent cannot be covered
  // by a later blade. Every edge terminates at its own aperture corner.
  for (let i = 0; i < irisBladeCount; i++) {
    const index = i * 4
    ctx.beginPath()
    ctx.moveTo(irisGeometry[index], irisGeometry[index + 1])
    ctx.lineTo(irisGeometry[index + 2], irisGeometry[index + 3])
    ctx.strokeStyle = i === 0 ? artAccents.blue : "#737373"
    ctx.lineWidth = i === 0 ? 2 : 0.8
    ctx.stroke()
  }
  ctx.beginPath()
  for (let i = 0; i < irisBladeCount; i++) {
    const index = i * 4
    if (i === 0) ctx.moveTo(irisGeometry[index + 2], irisGeometry[index + 3])
    else ctx.lineTo(irisGeometry[index + 2], irisGeometry[index + 3])
  }
  ctx.closePath()
  ctx.strokeStyle = "#686868"
  ctx.lineWidth = 1
  ctx.stroke()
  // Paint only the housing annulus, never a disc underneath the aperture.
  ctx.beginPath()
  ctx.arc(0, 0, 153, 0, tau)
  ctx.moveTo(irisPivotRadius, 0)
  ctx.arc(0, 0, irisPivotRadius, 0, tau)
  ctx.fillStyle = "#666666"
  ctx.fill("evenodd")
  ctx.beginPath()
  ctx.arc(0, 0, 145, 0, tau)
  ctx.strokeStyle = "#bcbcbc"
  ctx.lineWidth = 8
  ctx.stroke()
  if (guides) {
    for (let i = 0; i < irisBladeCount; i++) {
      const a = i * step - 0.5
      dot(ctx, 145 * Math.cos(a), 145 * Math.sin(a), 2, "#666666")
    }
    ctx.beginPath()
    ctx.arc(0, 0, 159, 0, tau)
    ctx.strokeStyle = "#9a9a9a"
    ctx.lineWidth = 0.7
    ctx.stroke()
  }
  ctx.restore()
}
export function drawTrammel(
  ctx: CanvasRenderingContext2D,
  time: number,
  reach: number,
  guides: boolean
) {
  const angle = time * 0.6
  updateTrammel(trammel, angle, reach)
  ctx.save()
  ctx.translate(300, 210)
  ctx.fillStyle = "#dedede"
  ctx.fillRect(-164, -164, 328, 328)
  ctx.fillStyle = "#c2c2c2"
  ctx.fillRect(-152, -5, 304, 10)
  ctx.fillRect(-5, -152, 10, 304)
  ctx.strokeStyle = "#999999"
  ctx.lineWidth = 0.7
  ctx.strokeRect(-152, -5, 304, 10)
  ctx.strokeRect(-5, -152, 10, 304)
  if (guides) {
    ctx.strokeStyle = "#b1b1b1"
    ctx.strokeRect(-164, -164, 328, 328)
    for (let p = -140; p <= 140; p += 20) {
      ctx.beginPath()
      ctx.moveTo(p, 9)
      ctx.lineTo(p, 13)
      ctx.moveTo(9, p)
      ctx.lineTo(13, p)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.ellipse(0, 0, reach, trammelSpacing + reach, 0, 0, tau)
    ctx.strokeStyle = "#348b8530"
    ctx.stroke()
  }
  // Analytic ellipse sampling avoids allocating a trail buffer every frame.
  for (let i = 0; i < 220; i++) {
    const a = angle - tau * (1 - i / 220),
      b = angle - tau * (1 - (i + 1) / 220)
    ctx.beginPath()
    ctx.moveTo(-reach * Math.cos(a), -(trammelSpacing + reach) * Math.sin(a))
    ctx.lineTo(-reach * Math.cos(b), -(trammelSpacing + reach) * Math.sin(b))
    ctx.strokeStyle = artAccents.teal
    ctx.globalAlpha = 0.12 + (0.75 * i) / 220
    ctx.lineWidth = 1.7
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = "#797979"
  ctx.fillRect(trammel.ax - 12, -7, 24, 14)
  ctx.fillRect(-7, -trammel.by - 12, 14, 24)
  ctx.beginPath()
  ctx.moveTo(trammel.ax, 0)
  ctx.lineTo(trammel.px, -trammel.py)
  ctx.lineWidth = 8
  ctx.strokeStyle = "#5b5b5b"
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.strokeStyle = "#b6b6b6"
  ctx.stroke()
  dot(ctx, trammel.ax, 0, 4, "#e5e5e5")
  dot(ctx, 0, -trammel.by, 4, "#e5e5e5")
  dot(ctx, trammel.px, -trammel.py, 5, artAccents.teal)
  ctx.restore()
}
