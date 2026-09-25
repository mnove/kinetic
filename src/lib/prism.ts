export const spectrumCount = 60
export const prismSide = 210
export const screenX = 548
export const maxRayPoints = 8
export function wavelength(i: number) {
  return 400 + (300 * i) / (spectrumCount - 1)
}
// Cauchy's approximation for a very dense flint glass (Abbe number about 21), wavelength in nanometres.
export function refractiveIndex(nanometres: number) {
  return 1.6 + 16000 / (nanometres * nanometres)
}
// The rising beam angle that passes green light symmetrically through an
// apex-up prism, the pose of minimum deviation.
export function restingBeamAngle(apexDegrees: number) {
  const half = (apexDegrees * Math.PI) / 360
  return half - Math.asin(refractiveIndex(550) * Math.sin(half))
}

export const lampDistance = 125
export type Lamp = { x: number; y: number; angle: number }
// The lamp swings about the resting angle while its aim drifts along the left
// face; the two periods never line up, so the beam rarely repeats a path.
export function lampPose(
  apexDegrees: number,
  time: number,
  vertices: Float64Array,
  out: Lamp
) {
  const along = 0.5 + 0.1 * Math.sin(time * 0.23),
    angle = restingBeamAngle(apexDegrees) + 0.2 * Math.sin(time * 0.4)
  out.angle = angle
  out.x =
    vertices[0] +
    (vertices[4] - vertices[0]) * along -
    lampDistance * Math.cos(angle)
  out.y =
    vertices[1] +
    (vertices[5] - vertices[1]) * along -
    lampDistance * Math.sin(angle)
  return out
}

// An isosceles prism, apex up, centred on its centroid.
export function prismVertices(
  apexDegrees: number,
  cx: number,
  cy: number,
  out: Float64Array
) {
  const half = (apexDegrees * Math.PI) / 360,
    bx = prismSide * Math.sin(half),
    by = prismSide * Math.cos(half)
  for (let i = 0; i < 3; i++) {
    const x = i === 0 ? 0 : i === 1 ? bx : -bx
    const y = (i === 0 ? 0 : by) - (2 * by) / 3
    out[i * 2] = cx + x
    out[i * 2 + 1] = cy + y
  }
  return out
}

// Follows one ray through the prism, refracting or totally reflecting at each
// face, and ends it on the screen or far outside the drawing. Writes points
// into `out` and returns how many; the ray enters glass after point 1.
export function traceRay(
  vertices: Float64Array,
  index: number,
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  out: Float64Array
) {
  const cx = (vertices[0] + vertices[2] + vertices[4]) / 3,
    cy = (vertices[1] + vertices[3] + vertices[5]) / 3
  let x = ox,
    y = oy,
    inside = false,
    count = 1,
    skip = -1
  out[0] = x
  out[1] = y
  while (count < maxRayPoints) {
    let nearest = Infinity,
      edge = -1
    for (let e = 0; e < 3; e++) {
      if (e === skip) continue
      const ax = vertices[e * 2],
        ay = vertices[e * 2 + 1],
        ex = vertices[((e + 1) % 3) * 2] - ax,
        ey = vertices[((e + 1) % 3) * 2 + 1] - ay
      const denominator = dx * ey - dy * ex
      if (Math.abs(denominator) < 1e-12) continue
      const t = ((ax - x) * ey - (ay - y) * ex) / denominator,
        u = ((ax - x) * dy - (ay - y) * dx) / denominator
      if (t > 1e-9 && u >= 0 && u <= 1 && t < nearest) {
        nearest = t
        edge = e
      }
    }
    if (edge < 0) {
      const t = dx > 0 && x < screenX ? (screenX - x) / dx : 900
      out[count * 2] = x + dx * t
      out[count * 2 + 1] = y + dy * t
      return count + 1
    }
    x += dx * nearest
    y += dy * nearest
    out[count * 2] = x
    out[count * 2 + 1] = y
    count++
    const ax = vertices[edge * 2],
      ay = vertices[edge * 2 + 1],
      ex = vertices[((edge + 1) % 3) * 2] - ax,
      ey = vertices[((edge + 1) % 3) * 2 + 1] - ay,
      length = Math.hypot(ex, ey)
    let nx = ey / length,
      ny = -ex / length
    if (nx * (ax - cx) + ny * (ay - cy) < 0) {
      nx = -nx
      ny = -ny
    }
    // Orient the normal against the ray, whichever side it arrives from.
    if (dx * nx + dy * ny > 0) {
      nx = -nx
      ny = -ny
    }
    const cosine = -(dx * nx + dy * ny),
      ratio = inside ? index : 1 / index,
      k = 1 - ratio * ratio * (1 - cosine * cosine)
    if (k < 0) {
      dx += 2 * cosine * nx
      dy += 2 * cosine * ny
    } else {
      const scale = ratio * cosine - Math.sqrt(k)
      dx = ratio * dx + scale * nx
      dy = ratio * dy + scale * ny
      inside = !inside
    }
    skip = edge
  }
  return count
}
