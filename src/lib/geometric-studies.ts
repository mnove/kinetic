export const tesseractEdges: [number, number][] = []
for (let i = 0; i < 16; i++)
  for (let axis = 0; axis < 4; axis++) {
    const other = i ^ (1 << axis)
    if (i < other) tesseractEdges.push([i, other])
  }
export function tesseractVertices(time: number) {
  return Array.from({ length: 16 }, (_, i) => {
    const p: number[] = Array.from({ length: 4 }, (_value, axis) =>
      (i >> axis) & 1 ? 1 : -1
    )
    for (const [a, b, angle] of [
      [0, 3, time * 0.35],
      [1, 2, time * 0.21],
      [2, 3, time * 0.17],
    ]) {
      const x = p[a],
        y = p[b]
      p[a] = x * Math.cos(angle) - y * Math.sin(angle)
      p[b] = x * Math.sin(angle) + y * Math.cos(angle)
    }
    return p
  })
}
export const spirographPeriod = Math.PI * 4
export function spirographPoint(angle: number, offset: number) {
  const centerRadius = 63,
    ratio = 1.5
  return {
    x: centerRadius * Math.cos(angle) + offset * Math.cos(ratio * angle),
    y: centerRadius * Math.sin(angle) - offset * Math.sin(ratio * angle),
  }
}
