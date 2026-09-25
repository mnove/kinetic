const tau = Math.PI * 2

export const wellSoftening = 28
export const wellRadius = 210
export const wellMinimumMass = 40
export const orbitStep = 1 / 120
const substeps = 4
const maxSamples = 4096
// Each body starts at apoapsis, moving slower than a circular orbit would under
// the lightest mass, so every mass in range keeps all three bound.
export const wellBodies = [
  { radius: 150, speed: 0.78, phase: 0 },
  { radius: 105, speed: 0.62, phase: 2.2 },
  { radius: 185, speed: 0.9, phase: 4.1 },
] as const

export function wellStrength(mass: number) {
  return mass * 12000
}
// A Plummer-softened point mass: Newtonian far away, finite at the centre.
export function wellPotential(r: number, mass: number) {
  return -wellStrength(mass) / Math.sqrt(r * r + wellSoftening ** 2)
}
// The drawn surface is the potential itself, scaled to at most 170 px deep.
export function wellDepth(r: number, mass: number) {
  return (1.7 * mass * wellSoftening) / Math.sqrt(r * r + wellSoftening ** 2)
}
export function circularSpeed(r: number, mass: number) {
  return (
    (Math.sqrt(wellStrength(mass)) * r) / (r * r + wellSoftening ** 2) ** 0.75
  )
}

export type WellSample = { x: number; y: number; r: number }
export function createWell() {
  const count = wellBodies.length
  // Orbits in a central potential repeat radially: one apoapsis-to-apoapsis
  // period plus the angle it advances describes the whole rosette, so any
  // time can be sampled without stepping a simulation through it.
  let radii = new Float64Array(0),
    angles = new Float64Array(0)
  const periods = new Float64Array(count)
  const advances = new Float64Array(count)
  const periapses = new Float64Array(count)
  let mass = NaN
  function integrate(body: number) {
    const { radius, speed } = wellBodies[body]
    const base = body * maxSamples,
      h = orbitStep / substeps,
      strength = wellStrength(mass)
    let x = radius,
      y = 0,
      vx = 0,
      vy = speed * circularSpeed(radius, wellMinimumMass),
      angle = 0,
      previousRadial = 0,
      nearest: number = radius
    const accelerate = (dt: number) => {
      const scale = -strength / (x * x + y * y + wellSoftening ** 2) ** 1.5
      vx += x * scale * dt
      vy += y * scale * dt
    }
    radii[base] = radius
    angles[base] = 0
    periods[body] = (maxSamples - 1) * orbitStep
    for (let k = 1; k < maxSamples; k++) {
      for (let s = 0; s < substeps; s++) {
        accelerate(h / 2)
        x += vx * h
        y += vy * h
        accelerate(h / 2)
      }
      const r = Math.hypot(x, y)
      angle += wrap(Math.atan2(y, x) - angle)
      radii[base + k] = r
      angles[base + k] = angle
      nearest = Math.min(nearest, r)
      const radial = (x * vx + y * vy) / r
      if (k > 1 && previousRadial > 0 && radial <= 0) {
        const f = previousRadial / (previousRadial - radial)
        periods[body] = (k - 1 + f) * orbitStep
        advances[body] =
          angles[base + k - 1] + (angle - angles[base + k - 1]) * f
        break
      }
      previousRadial = radial
      advances[body] = angle
    }
    periapses[body] = nearest
  }
  function prepare(next: number) {
    if (next === mass) return
    mass = next
    if (!radii.length) {
      radii = new Float64Array(count * maxSamples)
      angles = new Float64Array(count * maxSamples)
    }
    for (let body = 0; body < count; body++) integrate(body)
  }
  function sample(body: number, time: number, out: WellSample) {
    const period = periods[body],
      turns = Math.floor(time / period),
      index = (time - turns * period) / orbitStep,
      i = Math.min(Math.floor(index), maxSamples - 2),
      f = index - i,
      k = body * maxSamples + i
    const r = radii[k] + (radii[k + 1] - radii[k]) * f
    const angle =
      angles[k] +
      (angles[k + 1] - angles[k]) * f +
      turns * advances[body] +
      wellBodies[body].phase
    out.x = r * Math.cos(angle)
    out.y = r * Math.sin(angle)
    out.r = r
    return out
  }
  return { prepare, sample, periods, advances, periapses }
}
function wrap(angle: number) {
  return angle - Math.round(angle / tau) * tau
}
