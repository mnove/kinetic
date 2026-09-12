const tau = Math.PI * 2

export function genevaState(
  time: number,
  slots: number,
  out = { radius: 0, angle: 0, rotation: 0, engaged: false, limit: 0 }
) {
  const distance = 170
  const radius = distance * Math.sin(Math.PI / slots)
  const limit = Math.acos(radius / distance)
  const phase = time * 0.65
  const turns = Math.floor((phase + limit) / tau)
  const angle = phase - turns * tau
  const engaged = angle <= limit
  const rotation =
    (-turns * tau) / slots -
    (engaged
      ? Math.atan2(
          radius * Math.sin(angle),
          distance - radius * Math.cos(angle)
        )
      : Math.PI / slots)
  out.radius = radius
  out.angle = angle
  out.rotation = rotation
  out.engaged = engaged
  out.limit = limit
  return out
}

export const miuraColumns = 8
export const miuraRows = 6
export function updateMiura(out: Float32Array, time: number, maximum: number) {
  // Each face is a rigid parallelogram: L² + H² = a²,
  // S² + W² = b², and L*S = a*b*cos(alpha) throughout the fold.
  const theta =
    ((maximum * Math.PI) / 180) * (0.5 + 0.5 * Math.sin(time * 0.55))
  const length = 43 * Math.cos(theta)
  const height = 43 * Math.sin(theta)
  const stagger = (36 * Math.cos((70 * Math.PI) / 180)) / Math.cos(theta)
  const width = Math.sqrt(36 ** 2 - stagger ** 2)
  for (let j = 0; j <= miuraRows; j++)
    for (let i = 0; i <= miuraColumns; i++) {
      const k = (j * (miuraColumns + 1) + i) * 3
      out[k] = (i - miuraColumns / 2) * length + ((j % 2) - 0.5) * stagger
      out[k + 1] = (j - miuraRows / 2) * width
      out[k + 2] = ((i % 2) - 0.5) * height
    }
}

export const branchDepth = 7
export const branchCount = 2 ** branchDepth - 1
export function updateBranches(out: Float64Array, angleDegrees: number) {
  const angle = (angleDegrees * Math.PI) / 180
  for (let i = 0; i < branchCount; i++) {
    const depth = Math.floor(Math.log2(i + 1))
    const parent = Math.floor((i - 1) / 2) * 5
    const k = i * 5
    const heading =
      i === 0 ? -Math.PI / 2 : out[parent + 4] + (i % 2 ? -angle : angle)
    out[k] = i === 0 ? 0 : out[parent + 2]
    out[k + 1] = i === 0 ? 0 : out[parent + 3]
    out[k + 2] = out[k] + 79 * 0.7 ** depth * Math.cos(heading)
    out[k + 3] = out[k + 1] + 79 * 0.7 ** depth * Math.sin(heading)
    out[k + 4] = heading
  }
}

export const flockCount = 90
export const flockWidth = 440
export const flockHeight = 270
export const neighborRadius = 55
export function wrappedDelta(value: number, size: number) {
  return value - Math.round(value / size) * size
}
export function createFlock() {
  // State belongs to a mounted artwork, never to the shared module.
  const positions = new Float64Array(flockCount * 2)
  const velocities = new Float64Array(flockCount * 2)
  const next = new Float64Array(flockCount * 2)
  function reset() {
    let seed = 2026
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    for (let i = 0; i < flockCount * 2; i += 2) {
      positions[i] = random() * flockWidth
      positions[i + 1] = random() * flockHeight
      const angle = random() * tau
      velocities[i] = Math.cos(angle) * 36
      velocities[i + 1] = Math.sin(angle) * 36
    }
  }
  function step(alignment: number) {
    for (let i = 0; i < flockCount * 2; i += 2) {
      let count = 0,
        cx = 0,
        cy = 0,
        ax = 0,
        ay = 0,
        sx = 0,
        sy = 0
      for (let j = 0; j < flockCount * 2; j += 2) {
        if (i === j) continue
        const dx = wrappedDelta(positions[j] - positions[i], flockWidth)
        const dy = wrappedDelta(
          positions[j + 1] - positions[i + 1],
          flockHeight
        )
        const d2 = dx * dx + dy * dy
        if (d2 >= neighborRadius ** 2) continue
        count++
        cx += dx
        cy += dy
        ax += velocities[j]
        ay += velocities[j + 1]
        if (d2 < 22 ** 2) {
          sx -= dx / Math.max(d2, 1)
          sy -= dy / Math.max(d2, 1)
        }
      }
      let vx = velocities[i],
        vy = velocities[i + 1]
      if (count) {
        vx +=
          ((cx / count) * 0.6 +
            ((ax / count - vx) * alignment) / 50 +
            sx * 180) /
          60
        vy +=
          ((cy / count) * 0.6 +
            ((ay / count - vy) * alignment) / 50 +
            sy * 180) /
          60
      }
      const speed = Math.hypot(vx, vy) || 1
      const scale = Math.min(58, Math.max(28, speed)) / speed
      next[i] = vx * scale
      next[i + 1] = vy * scale
    }
    velocities.set(next)
    for (let i = 0; i < flockCount * 2; i += 2) {
      positions[i] =
        (positions[i] + velocities[i] / 60 + flockWidth) % flockWidth
      positions[i + 1] =
        (positions[i + 1] + velocities[i + 1] / 60 + flockHeight) % flockHeight
    }
  }
  reset()
  return { positions, velocities, reset, step }
}
