import { expect, it } from "vitest"
import { cubePause, layerDuration, rollingCube } from "./rolling-cube"
import { studies } from "./studies"

it("keeps the cube and wave as independent studies", () => {
  const cube = studies.find((s) => s.slug === "rolling-cube")
  const wave = studies.find((s) => s.slug === "rolling-wave")
  expect(cube?.kind).toBe("rollingcube")
  expect(wave?.kind).toBe("rollingwave")
  expect(new Set(studies.map((s) => s.slug)).size).toBe(studies.length)
})
it("preserves rigid square layers and continuous quarter-turn boundaries", () => {
  for (const count of [3, 7, 12]) {
    const duration = count * layerDuration + cubePause
    for (let cycle = 1; cycle <= 4; cycle++) {
      const before = rollingCube(duration * cycle - 1e-7, count),
        after = rollingCube(duration * cycle + 1e-7, count)
      before.forEach((slice, i) =>
        slice.forEach((p, k) => {
          expect(p.x).toBeCloseTo(after[i][k].x, 6)
          expect(p.y).toBeCloseTo(after[i][k].y, 6)
        })
      )
    }
    for (const slice of rollingCube(layerDuration * 1.5, count))
      slice.forEach((p, k) => {
        const next = slice[(k + 1) % 4]
        expect(Math.hypot(p.x - next.x, p.y - next.y)).toBeCloseTo(2, 10)
        expect(p.y).toBeGreaterThanOrEqual(-1e-10)
      })
  }
})
