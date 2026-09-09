export function rollingPolygon(time: number, sides: number) {
  const count = Math.max(3, Math.round(sides)),
    radius = 72
  const turn = (Math.PI * 2) / count,
    halfEdge = radius * Math.sin(Math.PI / count),
    height = radius * Math.cos(Math.PI / count)
  const cycle = Math.floor(time / 1.4),
    phase = time / 1.4 - cycle
  const eased = phase * phase * phase * (phase * (phase * 6 - 15) + 10)
  const angle = eased * turn
  const centerX =
    halfEdge - halfEdge * Math.cos(angle) + height * Math.sin(angle)
  const centerY = halfEdge * Math.sin(angle) + height * Math.cos(angle)
  const vertices = Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 - Math.PI / count + i * turn - (cycle % count) * turn
    const x = radius * Math.cos(a),
      y = height + radius * Math.sin(a)
    return {
      x:
        halfEdge +
        (x - halfEdge) * Math.cos(angle) +
        y * Math.sin(angle) -
        centerX,
      y: -(x - halfEdge) * Math.sin(angle) + y * Math.cos(angle),
    }
  })
  return {
    vertices,
    centerY,
    pivotX: halfEdge - centerX,
    distance: cycle * halfEdge * 2 + centerX,
  }
}
// Every second sector is reflected, so neighbours share a mirror boundary.
export function mirrorSector(index: number, pairs: number) {
  const wedge = Math.PI / pairs
  return {
    rotation: (index + (index % 2)) * wedge,
    reflection: index % 2 ? -1 : 1,
    wedge,
  }
}
