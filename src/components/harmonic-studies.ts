import { artAccents } from "@/lib/art-palette"
import {
  epicycleChain,
  grainPaths,
  grainCount,
  settleSteps,
  plateModes,
} from "@/lib/harmonic-studies"

export function drawEpicycles(
  ctx: CanvasRenderingContext2D,
  t: number,
  count: number,
  guides: boolean
) {
  const angle = t * 0.55
  const endpoint = (a: number) => epicycleChain(a, count).at(-1)!
  for (let i = 0; i < 420; i++) {
    const a = endpoint(angle - Math.PI * 2 * (1 - i / 420)),
      b = endpoint(angle - Math.PI * 2 * (1 - (i + 1) / 420))
    ctx.globalAlpha = 0.1 + (0.8 * i) / 420
    ctx.strokeStyle = artAccents.violet
    ctx.lineWidth = 1.7
    ctx.beginPath()
    ctx.moveTo(300 + a.x, 210 + a.y)
    ctx.lineTo(300 + b.x, 210 + b.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const chain = epicycleChain(angle, count)
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i],
      b = chain[i + 1]
    if (guides) {
      ctx.beginPath()
      ctx.arc(
        300 + a.x,
        210 + a.y,
        Math.hypot(b.x - a.x, b.y - a.y),
        0,
        Math.PI * 2
      )
      ctx.strokeStyle = "#9b9b9b7a"
      ctx.lineWidth = 0.7
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(300 + a.x, 210 + a.y)
    ctx.lineTo(300 + b.x, 210 + b.y)
    ctx.strokeStyle = "#5f5f5f"
    ctx.lineWidth = 1.15
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(300 + a.x, 210 + a.y, 2, 0, Math.PI * 2)
    ctx.fillStyle = "#5f5f5f"
    ctx.fill()
  }
  const tip = chain[chain.length - 1]
  ctx.beginPath()
  ctx.arc(300 + tip.x, 210 + tip.y, 4, 0, Math.PI * 2)
  ctx.fillStyle = artAccents.violet
  ctx.fill()
}
export function drawChladni(
  ctx: CanvasRenderingContext2D,
  t: number,
  mode: number,
  guides: boolean
) {
  const data = grainPaths(mode),
    phase = (t + 6) % 14
  // Settle along the field gradient, hold the nodal pattern, then redistribute.
  const progress = Math.min(settleSteps, (phase / 5) * settleSteps)
  const step = Math.floor(progress),
    next = Math.min(settleSteps, step + 1),
    blend = progress - step
  const release = Math.max(0, (phase - 11) / 3)
  const dissolve = release * release * (3 - 2 * release)
  const radius = 146
  ctx.fillStyle = "#dedede"
  ctx.fillRect(300 - radius, 210 - radius, radius * 2, radius * 2)
  if (guides) {
    ctx.strokeStyle = "#8d8d8d"
    ctx.lineWidth = 0.8
    ctx.strokeRect(300 - radius, 210 - radius, radius * 2, radius * 2)
    ctx.beginPath()
    ctx.arc(300, 210, 3, 0, Math.PI * 2)
    ctx.stroke()
    const [m, n] = plateModes[mode - 1]
    ctx.font = "9px monospace"
    ctx.fillStyle = "#7d7d7d"
    ctx.textAlign = "center"
    ctx.fillText(`PLATE MODE ${m} : ${n}`, 300, 379)
    ctx.textAlign = "start"
  }
  ctx.fillStyle = "#5d5d5d"
  for (let i = 0; i < grainCount; i++) {
    const base = i * (settleSteps + 1) * 2,
      index = base + step * 2,
      end = base + next * 2
    let x = data[index] + (data[end] - data[index]) * blend,
      y = data[index + 1] + (data[end + 1] - data[index + 1]) * blend
    x += (data[base] - x) * dissolve
    y += (data[base + 1] - y) * dissolve
    const jitter = 0.0008 * Math.sin(t * 24 + i * 1.7)
    ctx.fillStyle = i % 8 === 0 ? artAccents.teal : "#5c5c5c"
    ctx.fillRect(
      300 + (x + jitter) * radius,
      210 + (y - jitter) * radius,
      1.35,
      1.35
    )
  }
}
