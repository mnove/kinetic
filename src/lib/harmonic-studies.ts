export type Point2 = { x: number; y: number }
export function epicycleChain(angle: number, count: number): Point2[] {
  const points: Point2[] = [{ x: 0, y: 0 }]
  for (let i = 0; i < count; i++) {
    const frequency = (i % 2 === 0 ? 1 : -1) * (i + 1)
    const radius = 88 / Math.pow(i + 1, 1.45)
    const phase = angle * frequency + i * 0.65
    const previous = points[points.length - 1]
    points.push({
      x: previous.x + radius * Math.cos(phase),
      y: previous.y + radius * Math.sin(phase),
    })
  }
  return points
}
export const plateModes = [
  [1, 2],
  [2, 3],
  [1, 4],
  [3, 4],
  [2, 5],
  [3, 7],
  [4, 7],
] as const
export function plateField(x: number, y: number, mode: number) {
  const [m, n] =
    plateModes[
      Math.max(0, Math.min(plateModes.length - 1, Math.round(mode) - 1))
    ]
  const a = m * Math.PI,
    b = n * Math.PI
  return {
    value:
      Math.cos(a * x) * Math.cos(b * y) - Math.cos(b * x) * Math.cos(a * y),
    dx:
      -a * Math.sin(a * x) * Math.cos(b * y) +
      b * Math.sin(b * x) * Math.cos(a * y),
    dy:
      -b * Math.cos(a * x) * Math.sin(b * y) +
      a * Math.cos(b * x) * Math.sin(a * y),
  }
}
export function settleGrain(point: Point2, mode: number): Point2 {
  const { value, dx, dy } = plateField(point.x, point.y, mode)
  const norm = dx * dx + dy * dy
  if (norm < 1e-10) return point
  const step = (value / (norm + 0.01)) * 0.65
  const length = Math.hypot(step * dx, step * dy)
  const scale = length > 0.06 ? 0.06 / length : 1
  const candidate = {
    x: Math.max(-1, Math.min(1, point.x - step * dx * scale)),
    y: Math.max(-1, Math.min(1, point.y - step * dy * scale)),
  }
  // Backtrack near saddle points so a grain never climbs the nodal potential.
  if (
    Math.abs(plateField(candidate.x, candidate.y, mode).value) > Math.abs(value)
  )
    return { x: (point.x + candidate.x) / 2, y: (point.y + candidate.y) / 2 }
  return candidate
}
export const grainCount = 1600,
  settleSteps = 48
const paths = new Map<number, Float32Array>()
export function grainPaths(mode: number) {
  const cached = paths.get(mode)
  if (cached) return cached
  let seed = 7139
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const data = new Float32Array(grainCount * (settleSteps + 1) * 2)
  for (let i = 0; i < grainCount; i++) {
    let p = { x: random() * 2 - 1, y: random() * 2 - 1 }
    for (let step = 0; step <= settleSteps; step++) {
      const index = (i * (settleSteps + 1) + step) * 2
      data[index] = p.x
      data[index + 1] = p.y
      p = settleGrain(p, mode)
    }
  }
  paths.set(mode, data)
  return data
}
