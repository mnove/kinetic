export type SurfacePoint = { u: number; v: number }
const tau = Math.PI * 2

// Represent the disk in the ribbon's own coordinates. Adjacent copies reverse
// v at the Möbius seam, keeping the marking continuous across both circuits.
export function markerPatches(travel: number, width: number): SurfacePoint[][] {
  const circuit = Math.floor(travel / tau)
  const u = travel - circuit * tau
  const v = width * 0.29 * (circuit % 2 === 0 ? 1 : -1)
  const radius = Math.min(5.5, width * 0.18)
  return [-1, 0, 1].map((offset) => {
    const centerU = u + offset * tau
    const centerV = offset === 0 ? v : -v
    return Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * tau
      return {
        u: centerU + (Math.cos(angle) * radius) / 112,
        v: centerV + Math.sin(angle) * radius,
      }
    })
  })
}

export function clipSurfacePatch(
  patch: SurfacePoint[],
  uMin: number,
  uMax: number,
  vMin: number,
  vMax: number
) {
  if (
    !patch.some((p) => p.u >= uMin) ||
    !patch.some((p) => p.u <= uMax) ||
    !patch.some((p) => p.v >= vMin) ||
    !patch.some((p) => p.v <= vMax)
  )
    return []
  let points = patch
  const boundaries: Array<{
    axis: "u" | "v"
    value: number
    direction: number
  }> = [
    { axis: "u", value: uMin, direction: 1 },
    { axis: "u", value: uMax, direction: -1 },
    { axis: "v", value: vMin, direction: 1 },
    { axis: "v", value: vMax, direction: -1 },
  ]
  for (const { axis, value, direction } of boundaries) {
    const input = points
    points = []
    for (let i = 0; i < input.length; i++) {
      const a = input[i],
        b = input[(i + 1) % input.length]
      const insideA = (a[axis] - value) * direction >= 0,
        insideB = (b[axis] - value) * direction >= 0
      if (insideA) points.push(a)
      if (insideA !== insideB) {
        const fraction = (value - a[axis]) / (b[axis] - a[axis])
        points.push({
          u: a.u + (b.u - a.u) * fraction,
          v: a.v + (b.v - a.v) * fraction,
        })
      }
    }
  }
  return points
}
