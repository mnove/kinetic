import { expect, it } from "vitest"
import {
  spirographPeriod,
  spirographPoint,
  tesseractEdges,
  tesseractVertices,
} from "./geometric-studies"

it("preserves all 32 hypercube edges under four-dimensional rotation", () => {
  expect(tesseractEdges).toHaveLength(32)
  for (const t of [0, 1, 5, 17, 43]) {
    const vertices = tesseractVertices(t)
    expect(vertices).toHaveLength(16)
    vertices.forEach((p) => expect(Math.hypot(...p)).toBeCloseTo(2, 10))
    tesseractEdges.forEach(([a, b]) =>
      expect(
        Math.hypot(...vertices[a].map((v, i) => v - vertices[b][i]))
      ).toBeCloseTo(2, 10)
    )
  }
})
it("closes the spirograph and keeps the pen fixed relative to the rolling circle", () => {
  for (const offset of [10, 42, 58, 75]) {
    for (const t of [0, 0.3, 2, 9]) {
      const p = spirographPoint(t, offset),
        loop = spirographPoint(t + spirographPeriod, offset)
      expect(p.x).toBeCloseTo(loop.x, 10)
      expect(p.y).toBeCloseTo(loop.y, 10)
      expect(
        Math.hypot(p.x - 63 * Math.cos(t), p.y - 63 * Math.sin(t))
      ).toBeCloseTo(offset, 10)
    }
  }
})
