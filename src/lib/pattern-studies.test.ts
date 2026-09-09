import { expect, it } from "vitest"
import { mirrorSector, rollingPolygon } from "./pattern-studies"

it("rolls rigid polygons without penetrating the floor", () => {
  for (let sides = 3; sides <= 10; sides++)
    for (let t = 0; t < 1.4 * sides; t += 0.11) {
      const model = rollingPolygon(t, sides)
      model.vertices.forEach((p, i) => {
        const next = model.vertices[(i + 1) % sides]
        expect(Math.hypot(p.x - next.x, p.y - next.y)).toBeCloseTo(
          144 * Math.sin(Math.PI / sides),
          9
        )
        expect(p.y).toBeGreaterThanOrEqual(-1e-9)
      })
      expect(Math.min(...model.vertices.map((p) => p.y))).toBeCloseTo(0, 9)
    }
})
it("keeps marked vertices and camera travel continuous across landings", () => {
  for (const sides of [3, 5, 10])
    for (let cycle = 1; cycle <= sides; cycle++) {
      const a = rollingPolygon(cycle * 1.4 - 1e-7, sides),
        b = rollingPolygon(cycle * 1.4 + 1e-7, sides)
      expect(a.distance).toBeCloseTo(b.distance, 6)
      a.vertices.forEach((p, i) => {
        expect(p.x).toBeCloseTo(b.vertices[i].x, 6)
        expect(p.y).toBeCloseTo(b.vertices[i].y, 6)
      })
    }
})
it("mirrors each adjacent sector across its shared boundary", () => {
  for (const pairs of [3, 6, 12])
    for (let i = 0; i < pairs * 2; i += 2) {
      const a = mirrorSector(i, pairs),
        b = mirrorSector(i + 1, pairs)
      for (const angle of [0, a.wedge * 0.3, a.wedge]) {
        const left = a.rotation + a.reflection * angle,
          right = b.rotation + b.reflection * angle
        expect((left + right) / 2).toBeCloseTo((i + 1) * a.wedge, 10)
      }
    }
})
