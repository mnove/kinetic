import { expect, it } from "vitest"
import {
  createWell,
  orbitStep,
  wellBodies,
  wellDepth,
  wellPotential,
  wellRadius,
} from "./gravity-well"

const point = () => ({ x: 0, y: 0, r: 0 })

it("draws the surface in proportion to the potential, deepest at the centre", () => {
  for (const mass of [40, 100]) {
    const ratio = wellDepth(0, mass) / wellPotential(0, mass)
    for (const r of [10, 60, 150, wellRadius]) {
      expect(wellDepth(r, mass) / wellPotential(r, mass)).toBeCloseTo(ratio, 12)
      expect(wellDepth(r, mass)).toBeLessThan(wellDepth(r / 2, mass))
    }
  }
  expect(wellDepth(0, 100)).toBeCloseTo(170, 10)
})

it("keeps every orbit bound, inside the surface, and conserving energy and angular momentum", () => {
  const well = createWell(),
    a = point(),
    b = point()
  for (const mass of [40, 70, 100]) {
    well.prepare(mass)
    wellBodies.forEach((body, i) => {
      expect(well.periods[i]).toBeLessThan(20)
      expect(well.periapses[i]).toBeGreaterThan(10)
      // A softened core makes the ellipse precess into a rosette.
      expect(Math.abs(well.advances[i] - Math.PI * 2)).toBeGreaterThan(0.25)
      // Measured on the integrated samples; interpolating between them is
      // a drawing convenience, not part of the physics.
      const invariants = (time: number) => {
        well.sample(i, time - orbitStep, a)
        well.sample(i, time + orbitStep, b)
        const vx = (b.x - a.x) / (2 * orbitStep),
          vy = (b.y - a.y) / (2 * orbitStep)
        well.sample(i, time, a)
        return {
          energy: (vx * vx + vy * vy) / 2 + wellPotential(a.r, mass),
          momentum: a.x * vy - a.y * vx,
        }
      }
      const start = invariants(60 * orbitStep)
      for (const [turn, step] of [
        [0, 150],
        [1, 7],
        [2, 200],
        [9, 41],
      ]) {
        const time = turn * well.periods[i] + step * orbitStep
        well.sample(i, time, a)
        expect(a.r).toBeLessThanOrEqual(body.radius + 1e-6)
        expect(a.r).toBeGreaterThanOrEqual(well.periapses[i] - 0.5)
        const now = invariants(time)
        expect(Math.abs(now.energy / start.energy - 1)).toBeLessThan(0.01)
        expect(Math.abs(now.momentum / start.momentum - 1)).toBeLessThan(0.01)
      }
      expect(body.radius).toBeLessThan(wellRadius)
    })
  }
})

it("joins each sampled period to the next without a jump and reproduces any time", () => {
  const well = createWell(),
    other = createWell(),
    a = point(),
    b = point()
  well.prepare(55)
  other.prepare(100)
  other.prepare(55)
  for (let i = 0; i < wellBodies.length; i++) {
    for (const turn of [1, 3]) {
      const seam = well.periods[i] * turn
      well.sample(i, seam - 1e-6, a)
      well.sample(i, seam + 1e-6, b)
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.05)
    }
    for (const time of [-3, 0, 2.5, 60]) {
      well.sample(i, time, a)
      other.sample(i, time, b)
      expect(b).toEqual(a)
    }
  }
})
