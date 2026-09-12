import { expect, it } from "vitest"
import {
  branchCount,
  createFlock,
  flockCount,
  flockHeight,
  flockWidth,
  genevaState,
  miuraColumns,
  miuraRows,
  updateBranches,
  updateMiura,
} from "./new-studies"

it("advances the Geneva wheel by exactly one slot per turn, with a stationary dwell and aligned pin", () => {
  for (const slots of [4, 5, 8]) {
    const { limit } = genevaState(0, slots)
    for (const phase of [-limit, -0.4, 0, 0.4, limit]) {
      const s = genevaState(phase / 0.65, slots)
      const dx = -170 + s.radius * Math.cos(s.angle),
        dy = s.radius * Math.sin(s.angle)
      expect(
        dx * Math.sin(Math.PI + s.rotation) -
          dy * Math.cos(Math.PI + s.rotation)
      ).toBeCloseTo(0, 8)
    }
    expect(genevaState(3 / 0.65, slots).rotation).toBe(
      genevaState(4 / 0.65, slots).rotation
    )
    for (const time of [0, 1, 3, 8])
      expect(
        genevaState(time + (Math.PI * 2) / 0.65, slots).rotation -
          genevaState(time, slots).rotation
      ).toBeCloseTo((-Math.PI * 2) / slots, 10)
    for (const phase of [-limit, limit])
      expect(
        Math.abs(
          genevaState((phase - 1e-6) / 0.65, slots).rotation -
            genevaState((phase + 1e-6) / 0.65, slots).rotation
        )
      ).toBeLessThan(1e-8)
  }
})

it("folds Miura panels without stretching edges, changing face angles, or twisting faces", () => {
  const points = new Float32Array((miuraColumns + 1) * (miuraRows + 1) * 3)
  for (const maximum of [10, 52, 60])
    for (const time of [0, Math.PI / 1.1, (3 * Math.PI) / 1.1, 13]) {
      updateMiura(points, time, maximum)
      for (let j = 0; j < miuraRows; j++)
        for (let i = 0; i < miuraColumns; i++) {
          const a = (j * (miuraColumns + 1) + i) * 3,
            b = a + 3,
            d = a + (miuraColumns + 1) * 3,
            c = d + 3
          const u = [0, 1, 2].map((axis) => points[b + axis] - points[a + axis])
          const v = [0, 1, 2].map((axis) => points[d + axis] - points[a + axis])
          expect(Math.hypot(...u)).toBeCloseTo(43, 4)
          expect(Math.hypot(...v)).toBeCloseTo(36, 4)
          expect(
            Math.abs(u.reduce((sum, x, axis) => sum + x * v[axis], 0)) /
              (43 * 36)
          ).toBeCloseTo(Math.cos((70 * Math.PI) / 180), 5)
          for (let axis = 0; axis < 3; axis++)
            expect(points[c + axis]).toBeCloseTo(
              points[a + axis] + u[axis] + v[axis],
              4
            )
        }
    }
})

it("connects every branch to its parent and preserves generation lengths at all angles", () => {
  const branches = new Float64Array(branchCount * 5)
  for (const angle of [15, 28, 45]) {
    updateBranches(branches, angle)
    for (let i = 0; i < branchCount; i++) {
      const k = i * 5,
        depth = Math.floor(Math.log2(i + 1))
      expect(
        Math.hypot(
          branches[k + 2] - branches[k],
          branches[k + 3] - branches[k + 1]
        )
      ).toBeCloseTo(79 * 0.7 ** depth, 10)
      if (i) {
        const parent = Math.floor((i - 1) / 2) * 5
        expect(branches[k]).toBe(branches[parent + 2])
        expect(branches[k + 1]).toBe(branches[parent + 3])
      }
    }
  }
})

it("keeps flocks bounded, moving, independent, and reproducible after reset", () => {
  const flock = createFlock(),
    other = createFlock()
  const initial = other.positions.slice()
  for (const alignment of [0, 55, 100]) {
    flock.reset()
    for (let frame = 0; frame < 600; frame++) flock.step(alignment)
    const result = flock.positions.slice()
    expect(result).not.toEqual(initial)
    expect(other.positions).toEqual(initial)
    for (let i = 0; i < flockCount * 2; i += 2) {
      expect(result[i]).toBeGreaterThanOrEqual(0)
      expect(result[i]).toBeLessThan(flockWidth)
      expect(result[i + 1]).toBeGreaterThanOrEqual(0)
      expect(result[i + 1]).toBeLessThan(flockHeight)
      const speed = Math.hypot(flock.velocities[i], flock.velocities[i + 1])
      expect(speed).toBeGreaterThanOrEqual(28 - 1e-10)
      expect(speed).toBeLessThanOrEqual(58 + 1e-10)
    }
    flock.reset()
    for (let frame = 0; frame < 600; frame++) flock.step(alignment)
    expect(flock.positions).toEqual(result)
  }
})
