import { artAccents } from "@/lib/art-palette"
import {
  peaucellierAngle,
  peaucellierCrank,
  peaucellierLine,
  peaucellierPower,
  peaucellierSwing,
  updatePeaucellier,
} from "@/lib/peaucellier"

const tau = Math.PI * 2
const linkage = {
  cx: 0,
  px: 0,
  py: 0,
  ax: 0,
  ay: 0,
  bx: 0,
  by: 0,
  qx: 0,
  qy: 0,
}
const sample = { ...linkage }
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
function bar(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}
function pivot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  dot(ctx, x, y, 4.5, "#555555")
  dot(ctx, x, y, 2.5, "#e8e8e8")
}
function arm(ctx: CanvasRenderingContext2D, x: number, y: number) {
  bar(ctx, 0, 0, x, y, "#5b5b5b", 7)
  bar(ctx, 0, 0, x, y, "#b6b6b6", 2.5)
}
function ground(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - 9, y + 15)
  ctx.lineTo(x + 9, y + 15)
  ctx.closePath()
  ctx.fillStyle = "#c2c2c2"
  ctx.fill()
  ctx.strokeStyle = "#999999"
  ctx.lineWidth = 0.7
  ctx.stroke()
  for (let i = -12; i <= 8; i += 5)
    bar(ctx, x + i, y + 21, x + i + 4, y + 16, "#a5a5a5", 0.7)
  dot(ctx, x, y, 6, "#666666")
  dot(ctx, x, y, 2.5, "#e8e8e8")
}
export function drawPeaucellier(
  ctx: CanvasRenderingContext2D,
  time: number,
  offset: number,
  guides: boolean
) {
  updatePeaucellier(linkage, peaucellierAngle(time), offset)
  ctx.save()
  ctx.translate(190, 210)
  if (guides) {
    ctx.lineWidth = 0.7
    ctx.strokeStyle = "#b0b0b0"
    ctx.setLineDash([3, 5])
    ctx.beginPath()
    ctx.arc(linkage.cx, 0, peaucellierCrank, 0, tau)
    ctx.moveTo(peaucellierLine, -185)
    ctx.lineTo(peaucellierLine, 185)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.arc(0, 0, Math.sqrt(peaucellierPower), -1.1, 1.1)
    ctx.strokeStyle = "#a5a5a54d"
    ctx.stroke()
    bar(ctx, 0, 0, linkage.qx, linkage.qy, "#b8b8b8", 0.7)
  }
  // The reachable path is sampled analytically, so no trail buffer is kept.
  ctx.beginPath()
  for (let i = 0; i <= 80; i++) {
    updatePeaucellier(sample, peaucellierSwing * (i / 40 - 1), offset)
    if (i) ctx.lineTo(sample.qx, sample.qy)
    else ctx.moveTo(sample.qx, sample.qy)
  }
  ctx.strokeStyle = artAccents.blue + "33"
  ctx.lineWidth = 1
  ctx.stroke()
  for (let i = 0; i < 90; i++) {
    updatePeaucellier(sample, peaucellierAngle(time - 3 * (1 - i / 90)), offset)
    const x = sample.qx,
      y = sample.qy
    updatePeaucellier(
      sample,
      peaucellierAngle(time - 3 * (1 - (i + 1) / 90)),
      offset
    )
    ctx.globalAlpha = 0.1 + (0.8 * i) / 90
    bar(ctx, x, y, sample.qx, sample.qy, artAccents.blue, 2)
  }
  ctx.globalAlpha = 1
  ground(ctx, 0, 0)
  ground(ctx, linkage.cx, 0)
  arm(ctx, linkage.ax, linkage.ay)
  arm(ctx, linkage.bx, linkage.by)
  bar(ctx, linkage.ax, linkage.ay, linkage.px, linkage.py, "#8d8d8d", 2.5)
  bar(ctx, linkage.px, linkage.py, linkage.bx, linkage.by, "#8d8d8d", 2.5)
  bar(ctx, linkage.bx, linkage.by, linkage.qx, linkage.qy, "#8d8d8d", 2.5)
  bar(ctx, linkage.qx, linkage.qy, linkage.ax, linkage.ay, "#8d8d8d", 2.5)
  bar(ctx, linkage.cx, 0, linkage.px, linkage.py, artAccents.orange, 3)
  pivot(ctx, linkage.ax, linkage.ay)
  pivot(ctx, linkage.bx, linkage.by)
  pivot(ctx, linkage.px, linkage.py)
  dot(ctx, linkage.qx, linkage.qy, 5.5, artAccents.blue)
  dot(ctx, linkage.qx - 1.5, linkage.qy - 1.5, 1.6, "#ffffff88")
  if (guides) {
    ctx.font = "9px monospace"
    ctx.fillStyle = "#858585"
    ctx.textAlign = "center"
    ctx.fillText("O", -14, -10)
    ctx.fillText("P", linkage.px - 10, linkage.py - 10)
    ctx.fillText("Q", linkage.qx + 14, linkage.qy - 8)
    ctx.fillText("OP · OQ = L² − s²", 110, 192)
    ctx.textAlign = "start"
  }
  ctx.restore()
}
