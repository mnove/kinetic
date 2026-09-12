export const goldenAngle = Math.PI * (3 - Math.sqrt(5))
export const seedCount = 650
export function updatePhyllotaxis(
  out: Float64Array,
  time: number,
  offsetDegrees: number
) {
  const divergence =
    goldenAngle +
    ((offsetDegrees + 0.04 * Math.sin(time * 0.35)) * Math.PI) / 180
  for (let i = 0; i < seedCount; i++) {
    const radius = 148 * Math.sqrt((i + 0.5) / seedCount)
    const angle = i * divergence + time * 0.075
    out[i * 2] = radius * Math.cos(angle)
    out[i * 2 + 1] = radius * Math.sin(angle)
  }
}
export const hexagonCenters = new Float64Array(12)
for (let i = 0; i < 6; i++) {
  const angle = (i * Math.PI) / 3 - Math.PI / 2
  hexagonCenters[i * 2] = 82 * Math.cos(angle)
  hexagonCenters[i * 2 + 1] = 82 * Math.sin(angle)
}
export function updateHexagon(out: Float64Array, time: number, radius: number) {
  for (let i = 0; i < 6; i++) {
    const base = (i * Math.PI) / 3 - Math.PI / 2
    const angle = base + Math.PI + (i % 2 === 0 ? 1 : -1) * (time * 0.45 + 0.8)
    out[i * 2] = hexagonCenters[i * 2] + radius * Math.cos(angle)
    out[i * 2 + 1] = hexagonCenters[i * 2 + 1] + radius * Math.sin(angle)
  }
}
export function segmentCrossing(
  out: Float64Array,
  index: number,
  points: Float64Array,
  a: number,
  b: number,
  c: number,
  d: number
) {
  const ax = points[a * 2],
    ay = points[a * 2 + 1],
    bx = points[b * 2],
    by = points[b * 2 + 1]
  const cx = points[c * 2],
    cy = points[c * 2 + 1],
    dx = points[d * 2],
    dy = points[d * 2 + 1]
  const rx = bx - ax,
    ry = by - ay,
    sx = dx - cx,
    sy = dy - cy
  const determinant = rx * sy - ry * sx
  out[index] = NaN
  out[index + 1] = NaN
  if (Math.abs(determinant) < 1e-9) return
  const t = ((cx - ax) * sy - (cy - ay) * sx) / determinant
  const u = ((cx - ax) * ry - (cy - ay) * rx) / determinant
  if (t < 0 || t > 1 || u < 0 || u > 1) return
  out[index] = ax + t * rx
  out[index + 1] = ay + t * ry
}
