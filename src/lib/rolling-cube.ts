import type { Vector3 } from "./kinetic-math"

export const layerDuration = 0.8
export const cubePause = 0.6
export function rollingCube(time: number, layers: number): Vector3[][] {
  const count = Math.max(2, Math.round(layers))
  const duration = count * layerDuration + cubePause
  const cycle = Math.floor(time / duration)
  const elapsed = time - cycle * duration
  const angles = Array.from({ length: count }, (_, i) => {
    const progress = Math.max(
      0,
      Math.min(1, (elapsed - i * layerDuration) / layerDuration)
    )
    const eased =
      progress * progress * progress * (progress * (progress * 6 - 15) + 10)
    return (eased * Math.PI) / 2
  })
  // Follow the average center so consecutive quarter-turns never jump back.
  const cameraX =
    angles.reduce((sum, a) => sum + 1 - Math.cos(a) + Math.sin(a), 0) / count
  const orientation = ((cycle % 4) * Math.PI) / 2
  return angles.map((angle, i) =>
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([x, y]) => {
      const localX = x * Math.cos(orientation) + y * Math.sin(orientation)
      const localY = 1 - x * Math.sin(orientation) + y * Math.cos(orientation)
      return {
        x:
          1 +
          (localX - 1) * Math.cos(angle) +
          localY * Math.sin(angle) -
          cameraX,
        y: -(localX - 1) * Math.sin(angle) + localY * Math.cos(angle),
        z: -1 + (2 * i) / (count - 1),
      }
    })
  )
}
