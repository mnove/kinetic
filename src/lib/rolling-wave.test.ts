import { expect, it } from "vitest"
import { rollingWave, wavePeriod } from "./rolling-wave"

it("keeps each bar rigid throughout the rolling crest", () => {
  for (let t = 0; t < wavePeriod; t += 0.2) {
    for (const block of rollingWave(t, 30)) {
      const distance = (a: number, b: number) =>
        Math.hypot(
          block[a].x - block[b].x,
          block[a].y - block[b].y,
          block[a].z - block[b].z
        )
      expect(distance(0, 1)).toBeCloseTo(88, 10)
      expect(distance(0, 4)).toBeCloseTo(13, 10)
      expect(distance(0, 2)).toBeCloseTo(Math.hypot(88, distance(0, 3)), 10)
    }
  }
})
it("loops continuously at every supported density", () => {
  for (const count of [18, 30, 42]) {
    const start = rollingWave(0, count),
      end = rollingWave(wavePeriod, count)
    expect(start).toHaveLength(count)
    start.forEach((block, i) =>
      block.forEach((p, j) => {
        for (const axis of ["x", "y", "z"] as const)
          expect(p[axis]).toBeCloseTo(end[i][j][axis], 10)
      })
    )
  }
})
