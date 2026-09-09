import { artAccents } from "@/lib/art-palette"
import { rollingWave } from "@/lib/rolling-wave"
import type { Vector3 } from "@/lib/kinetic-math"

export function drawRollingWave(
  ctx: CanvasRenderingContext2D,
  time: number,
  count: number,
  guides: boolean
) {
  const blocks = rollingWave(time, count)
  const project = (p: Vector3) => {
    const depth = p.z * 0.88 + p.y * 0.47
    const scale = 850 / (850 - depth)
    return {
      x: 300 + p.x * scale,
      y: 232 + (p.z * 0.47 - p.y * 0.88) * scale,
      depth,
    }
  }
  if (guides) {
    ctx.beginPath()
    ctx.ellipse(300, 232, 88, 88 * 0.47, 0, 0, Math.PI * 2)
    ctx.setLineDash([2, 7])
    ctx.strokeStyle = "#64646433"
    ctx.lineWidth = 0.7
    ctx.stroke()
    ctx.setLineDash([])
  }
  const faces: Array<{
    points: ReturnType<typeof project>[]
    depth: number
    color: string
  }> = []
  blocks.forEach((block, i) => {
    // Copper on the far side blends into plum at the front, as in the reference.
    const front = (1 + Math.sin((i / blocks.length) * Math.PI * 2)) / 2
    const top = `rgb(${64 - 12 * front}, ${64 - 12 * front}, ${64 - 12 * front})`
    const side = "#292929"
    const colors = [side, top, side, side, artAccents.blue, "#656565"]
    const indices = [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [3, 7, 6, 2],
      [1, 2, 6, 5],
      [0, 4, 7, 3],
    ]
    indices.forEach((face, k) => {
      const points = face.map((index) => project(block[index]))
      // Faces are opaque, with depth ordering across the entire assembly.
      faces.push({
        points,
        depth: points.reduce((sum, p) => sum + p.depth, 0) / 4,
        color: colors[k],
      })
    })
  })
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
      ctx.lineWidth = 0.45
      ctx.stroke()
    })
}
