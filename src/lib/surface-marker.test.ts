import { describe, expect, it } from "vitest"
import { clipSurfacePatch, markerPatches } from "./surface-marker"
import type { SurfacePoint } from "./surface-marker"

function area(points: SurfacePoint[]) {
  return (
    Math.abs(
      points.reduce((sum, p, i) => {
        const next = points[(i + 1) % points.length]
        return sum + p.u * next.v - next.u * p.v
      }, 0)
    ) / 2
  )
}
describe("surface-attached Möbius marker", () => {
  it("keeps the complete marker on the surface panels, including both seam crossings", () => {
    for (const width of [25, 75, 100]) {
      for (const travel of [
        0,
        0.02,
        1,
        Math.PI * 2 - 0.02,
        Math.PI * 2,
        Math.PI * 2 + 0.02,
        Math.PI * 4,
      ]) {
        const patches = markerPatches(travel, width)
        let paintedArea = 0
        for (let i = 0; i < 112; i++)
          for (let j = 0; j < 8; j++) {
            const u = (i / 112) * Math.PI * 2,
              next = ((i + 1) / 112) * Math.PI * 2
            const v = (j / 8 - 0.5) * width,
              vn = ((j + 1) / 8 - 0.5) * width
            for (const patch of patches) {
              const clipped = clipSurfacePatch(patch, u, next, v, vn)
              for (const point of clipped) {
                expect(point.u).toBeGreaterThanOrEqual(u - 1e-10)
                expect(point.u).toBeLessThanOrEqual(next + 1e-10)
                expect(point.v).toBeGreaterThanOrEqual(v - 1e-10)
                expect(point.v).toBeLessThanOrEqual(vn + 1e-10)
              }
              paintedArea += area(clipped)
            }
          }
        expect(paintedArea).toBeCloseTo(area(patches[1]), 8)
      }
    }
  })
  it("moves to the opposite transverse position after one circuit and returns after two", () => {
    const center = (travel: number) =>
      markerPatches(travel, 75)[1].reduce((sum, p) => sum + p.v, 0) / 40
    expect(center(0)).toBeCloseTo(-center(Math.PI * 2), 10)
    expect(center(0)).toBeCloseTo(center(Math.PI * 4), 10)
  })
})
