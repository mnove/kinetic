import { expect, it } from "vitest"
import {
  irisOpening,
  irisBladeCount,
  irisPivotRadius,
  updateIrisGeometry,
  trammelSpacing,
  updateTrammel,
} from "./mechanism-studies"

it("keeps both slider spacing and pen extension rigid while tracing an ellipse", () => {
  const state = { ax: 0, by: 0, px: 0, py: 0 }
  for (const reach of [25, 72, 95])
    for (let a = 0; a < Math.PI * 2; a += 0.07) {
      updateTrammel(state, a, reach)
      expect(Math.hypot(state.ax, state.by)).toBeCloseTo(trammelSpacing, 10)
      expect(Math.hypot(state.px, state.py - state.by)).toBeCloseTo(reach, 10)
      expect(Math.hypot(state.px - state.ax, state.py)).toBeCloseTo(
        reach + trammelSpacing,
        10
      )
      expect(
        (state.px / reach) ** 2 + (state.py / (reach + trammelSpacing)) ** 2
      ).toBeCloseTo(1, 10)
    }
})
it("keeps the iris aperture bounded and closes the animation loop", () => {
  for (const max of [25, 85, 100])
    for (let t = 0; t < 20; t += 0.1) {
      const r = irisOpening(t, max)
      expect(r).toBeGreaterThanOrEqual(9)
      expect(r).toBeLessThanOrEqual(max)
      expect(irisOpening(t + (Math.PI * 2) / 0.65, max)).toBeCloseTo(r, 10)
    }
})

it("keeps the iris edges on fixed pivots and joins adjacent tangents without a seam", () => {
  const points = new Float64Array(irisBladeCount * 4)
  const step = (Math.PI * 2) / irisBladeCount
  for (const opening of [9, 25, 47, 85, 100]) {
    updateIrisGeometry(points, opening)
    for (let i = 0; i < irisBladeCount; i++) {
      const index = i * 4,
        next = ((i + 1) % irisBladeCount) * 4
      const normal = i * step - 0.5 + Math.acos(opening / irisPivotRadius)
      expect(Math.hypot(points[index], points[index + 1])).toBeCloseTo(
        irisPivotRadius,
        10
      )
      // Pivot and both ends of the aperture edge lie on the same rigid line.
      for (const offset of [index, index + 2, next + 2]) {
        expect(
          points[offset] * Math.cos(normal) +
            points[offset + 1] * Math.sin(normal)
        ).toBeCloseTo(opening, 10)
      }
      expect(Math.hypot(points[index + 2], points[index + 3])).toBeLessThan(
        irisPivotRadius
      )
    }
  }
})
