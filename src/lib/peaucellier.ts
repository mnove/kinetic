export const peaucellierArm = 180
export const peaucellierSide = 108
export const peaucellierCrank = 54
// The linkage enforces |OP| · |OQ| = L² − s², so Q is P inverted in a
// circle of that radius. A crank circle through O inverts to a line.
export const peaucellierPower = peaucellierArm ** 2 - peaucellierSide ** 2
export const peaucellierLine = peaucellierPower / (2 * peaucellierCrank)
export const peaucellierSwing = 1.05
export type PeaucellierState = {
  cx: number
  px: number
  py: number
  ax: number
  ay: number
  bx: number
  by: number
  qx: number
  qy: number
}
export function peaucellierAngle(time: number) {
  return peaucellierSwing * Math.sin(time * 0.7)
}
// Fixed pivot O is the origin. The crank turns about C = (r + offset, 0);
// offset 0 puts O on the crank circle, which is what makes Q's path straight.
export function updatePeaucellier(
  out: PeaucellierState,
  angle: number,
  offset: number
) {
  out.cx = peaucellierCrank + offset
  out.px = out.cx + peaucellierCrank * Math.cos(angle)
  out.py = peaucellierCrank * Math.sin(angle)
  const rho = Math.hypot(out.px, out.py)
  const ux = out.px / rho,
    uy = out.py / rho
  const far = peaucellierPower / rho
  // A and B sit on the perpendicular bisector of PQ, an arm's length from O.
  const middle = (rho + far) / 2
  const half = Math.sqrt(peaucellierArm ** 2 - middle ** 2)
  out.ax = ux * middle - uy * half
  out.ay = uy * middle + ux * half
  out.bx = ux * middle + uy * half
  out.by = uy * middle - ux * half
  out.qx = ux * far
  out.qy = uy * far
}
