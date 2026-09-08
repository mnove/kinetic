import { describe, expect, it } from "vitest"
import {
  initialOrbit,
  integrateOrbit,
  mobiusPoint,
  orbitPeriod,
  sampleOrbit,
} from "./kinetic-math"

function energy(state: number[]) {
  let result = state.slice(6).reduce((sum, v) => sum + (v * v) / 2, 0)
  for (let i = 0; i < 3; i++)
    for (let j = i + 1; j < 3; j++)
      result -=
        1 /
        Math.hypot(
          state[i * 2] - state[j * 2],
          state[i * 2 + 1] - state[j * 2 + 1]
        )
  return result
}
describe("three-body choreography", () => {
  it("closes the orbit and conserves energy and center of mass over one period", () => {
    let state = [...initialOrbit]
    const initialEnergy = energy(state)
    for (let i = 0; i < 4096; i++) {
      state = integrateOrbit(state, orbitPeriod / 4096)
      expect(Math.abs(energy(state) - initialEnergy)).toBeLessThan(1e-7)
      expect(Math.abs(state[0] + state[2] + state[4])).toBeLessThan(1e-10)
      expect(Math.abs(state[1] + state[3] + state[5])).toBeLessThan(1e-10)
    }
    state.forEach((value, i) => expect(value).toBeCloseTo(initialOrbit[i], 5))
  })
  it("supports continuous trails before zero and repeats deterministically", () => {
    expect(sampleOrbit(-0.5)).toEqual(sampleOrbit(orbitPeriod - 0.5))
    sampleOrbit(2).forEach((value, i) =>
      expect(value).toBeCloseTo(sampleOrbit(2 + orbitPeriod)[i], 10)
    )
    expect(sampleOrbit(0)).toEqual(initialOrbit.slice(0, 6))
  })
})
describe("Möbius geometry", () => {
  it("joins the seam with reversed transverse coordinates and closes after two circuits", () => {
    for (const width of [25, 75, 100]) {
      const start = mobiusPoint(0, width / 2),
        one = mobiusPoint(2 * Math.PI, -width / 2),
        two = mobiusPoint(4 * Math.PI, width / 2)
      for (const axis of ["x", "y", "z"] as const) {
        expect(one[axis]).toBeCloseTo(start[axis], 10)
        expect(two[axis]).toBeCloseTo(start[axis], 10)
      }
      expect(mobiusPoint(2 * Math.PI, width / 2).x).not.toBeCloseTo(start.x)
    }
  })
})
