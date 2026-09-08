import type { Vector3 } from "./kinetic-math"

export const wavePeriod = (Math.PI * 2) / 0.85
export function rollingWave(time: number, count: number): Vector3[][] {
  const blocks = Math.max(12, Math.round(count))
  const radius = 88,
    length = 88,
    height = 13
  const halfWidth = Math.min(7, ((Math.PI * radius) / blocks) * 0.65)
  return Array.from({ length: blocks }, (_, i) => {
    const angle = (i / blocks) * Math.PI * 2
    // A narrow travelling crest lifts successive bars and sets them down.
    // All vertices use the same hinge transform, preserving solid cuboids.
    const crest = Math.pow((1 + Math.cos(angle - time * 0.85 + 2.2)) / 2, 7)
    const lift = crest * 1.65
    return [
      [0, -halfWidth, 0],
      [length, -halfWidth, 0],
      [length, halfWidth, 0],
      [0, halfWidth, 0],
      [0, -halfWidth, height],
      [length, -halfWidth, height],
      [length, halfWidth, height],
      [0, halfWidth, height],
    ].map(([radial, tangent, up]) => {
      const r = radius + radial * Math.cos(lift) - up * Math.sin(lift)
      return {
        x: r * Math.cos(angle) - tangent * Math.sin(angle),
        y: radial * Math.sin(lift) + up * Math.cos(lift) + 2,
        z: r * Math.sin(angle) + tangent * Math.cos(angle),
      }
    })
  })
}
