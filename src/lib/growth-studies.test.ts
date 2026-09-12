import { expect, it } from "vitest"
import {
  goldenAngle,
  seedCount,
  updatePhyllotaxis,
  hexagonCenters,
  updateHexagon,
  segmentCrossing,
} from "./growth-studies"

it("preserves square-root seed spacing across time and divergence settings", () => {
  const points = new Float64Array(seedCount * 2)
  for (const offset of [-8, 0, 8])
    for (const t of [0, 5, 20]) {
      updatePhyllotaxis(points, t, offset)
      for (let i = 0; i < seedCount; i++)
        expect(Math.hypot(points[i * 2], points[i * 2 + 1])).toBeCloseTo(
          148 * Math.sqrt((i + 0.5) / seedCount),
          9
        )
    }
  updatePhyllotaxis(points, 0, 0)
  expect(Math.atan2(points[3], points[2])).toBeCloseTo(goldenAngle, 10)
})
it("keeps every hexagon pivot on its orbit and repeats the motion", () => {
  const points = new Float64Array(12),
    loop = new Float64Array(12)
  for (const radius of [25, 52, 72])
    for (const time of [0, 2, 9]) {
      updateHexagon(points, time, radius)
      updateHexagon(loop, time + (Math.PI * 2) / 0.45, radius)
      for (let i = 0; i < 6; i++) {
        expect(
          Math.hypot(
            points[i * 2] - hexagonCenters[i * 2],
            points[i * 2 + 1] - hexagonCenters[i * 2 + 1]
          )
        ).toBeCloseTo(radius, 10)
        expect(points[i * 2]).toBeCloseTo(loop[i * 2], 10)
        expect(points[i * 2 + 1]).toBeCloseTo(loop[i * 2 + 1], 10)
      }
    }
})
it("finds real segment crossings and rejects parallel or disconnected segments", () => {
  const result = new Float64Array(2)
  segmentCrossing(
    result,
    0,
    new Float64Array([-1, -1, 1, 1, -1, 1, 1, -1]),
    0,
    1,
    2,
    3
  )
  expect([...result]).toEqual([0, 0])
  segmentCrossing(
    result,
    0,
    new Float64Array([0, 0, 1, 0, 0, 1, 1, 1]),
    0,
    1,
    2,
    3
  )
  expect(Number.isNaN(result[0])).toBe(true)
  segmentCrossing(
    result,
    0,
    new Float64Array([0, 0, 1, 0, 2, -1, 2, 1]),
    0,
    1,
    2,
    3
  )
  expect(Number.isNaN(result[0])).toBe(true)
})
