import { expect, it } from "vitest"
import {
  epicycleChain,
  plateField,
  grainPaths,
  grainCount,
  settleSteps,
} from "./harmonic-studies"

it("closes every Fourier curve and preserves each rotating arm length", () => {
  for (const count of [2, 6, 10])
    for (const t of [0, 1, 4]) {
      const a = epicycleChain(t, count),
        b = epicycleChain(t + Math.PI * 2, count)
      expect(a).toHaveLength(count + 1)
      a.forEach((p, i) => {
        expect(p.x).toBeCloseTo(b[i].x, 9)
        expect(p.y).toBeCloseTo(b[i].y, 9)
        if (i)
          expect(Math.hypot(p.x - a[i - 1].x, p.y - a[i - 1].y)).toBeCloseTo(
            88 / Math.pow(i, 1.45),
            9
          )
      })
    }
})
it("settles particles onto nodal lines while retaining finite positions inside the plate", () => {
  for (let mode = 1; mode <= 7; mode++) {
    const paths = grainPaths(mode)
    let initial = 0,
      final = 0,
      settled = 0
    for (let i = 0; i < grainCount; i++) {
      const start = i * (settleSteps + 1) * 2,
        end = start + settleSteps * 2
      initial += Math.abs(
        plateField(paths[start], paths[start + 1], mode).value
      )
      const residual = Math.abs(
        plateField(paths[end], paths[end + 1], mode).value
      )
      final += residual
      if (residual < 0.01) settled++
    }
    expect(final).toBeLessThan(initial * 0.02)
    expect(settled / grainCount).toBeGreaterThan(0.97)
    expect(paths.every((v) => Number.isFinite(v) && Math.abs(v) <= 1)).toBe(
      true
    )
  }
})
