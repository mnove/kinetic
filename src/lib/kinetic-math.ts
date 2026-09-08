export type Vector3 = { x: number; y: number; z: number }
export const orbitPeriod = 6.32591398
const sampleCount = 4096
// Equal masses, G = 1. Initial conditions computed by Carles Simó:
// https://www.maths.tcd.ie/EMIS/journals/Annals/152_3/chencine.pdf
export const initialOrbit = [
  0.97000436, -0.24308753, -0.97000436, 0.24308753, 0, 0, 0.466203685,
  0.43236573, 0.466203685, 0.43236573, -0.93240737, -0.86473146,
]
function derivative(state: number[]) {
  const result = [...state.slice(6), 0, 0, 0, 0, 0, 0]
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const dx = state[j * 2] - state[i * 2]
      const dy = state[j * 2 + 1] - state[i * 2 + 1]
      const factor = 1 / Math.pow(dx * dx + dy * dy, 1.5)
      result[6 + i * 2] += dx * factor
      result[7 + i * 2] += dy * factor
      result[6 + j * 2] -= dx * factor
      result[7 + j * 2] -= dy * factor
    }
  }
  return result
}
export function integrateOrbit(state: number[], dt: number) {
  const k1 = derivative(state)
  const k2 = derivative(state.map((v, i) => v + (dt * k1[i]) / 2))
  const k3 = derivative(state.map((v, i) => v + (dt * k2[i]) / 2))
  const k4 = derivative(state.map((v, i) => v + dt * k3[i]))
  return state.map(
    (v, i) => v + (dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6
  )
}
let orbit: number[][] | undefined
export function sampleOrbit(time: number) {
  // Cache one numerically integrated period, avoiding accumulated drift and
  // keeping identical motion on every display refresh rate and after reset.
  if (!orbit) {
    orbit = [initialOrbit]
    for (let i = 0; i < sampleCount; i++)
      orbit.push(integrateOrbit(orbit[i], orbitPeriod / sampleCount))
  }
  const index =
    ((((time % orbitPeriod) + orbitPeriod) % orbitPeriod) / orbitPeriod) *
    sampleCount
  const whole = Math.floor(index),
    blend = index - whole
  return orbit[whole]
    .slice(0, 6)
    .map((v, i) => v + (orbit![whole + 1][i] - v) * blend)
}
export function mobiusPoint(u: number, v: number): Vector3 {
  return {
    x: (112 + v * Math.cos(u / 2)) * Math.cos(u),
    y: (112 + v * Math.cos(u / 2)) * Math.sin(u),
    z: v * Math.sin(u / 2),
  }
}
