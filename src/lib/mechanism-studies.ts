export const trammelSpacing = 58
export type TrammelState = { ax: number; by: number; px: number; py: number }
export function updateTrammel(out: TrammelState, angle: number, reach: number) {
  // Two perpendicular sliders remain a fixed distance apart; the pen extends
  // the same rigid bar past the vertical slider.
  out.ax = trammelSpacing * Math.cos(angle)
  out.by = trammelSpacing * Math.sin(angle)
  out.px = -reach * Math.cos(angle)
  out.py = (trammelSpacing + reach) * Math.sin(angle)
}
export function irisOpening(time: number, maximum: number) {
  return 9 + (maximum - 9) * (0.5 + 0.5 * Math.sin(time * 0.65))
}

export const irisBladeCount = 9
export const irisPivotRadius = 137
// Each leading edge passes through a fixed pivot and is tangent to the
// aperture's incircle. Adjacent tangents determine the aperture corners.
export function updateIrisGeometry(out: Float64Array, opening: number) {
  const step = (Math.PI * 2) / irisBladeCount
  const tilt = Math.acos(opening / irisPivotRadius)
  const cornerRadius = opening / Math.cos(step / 2)
  for (let i = 0; i < irisBladeCount; i++) {
    const pivotAngle = i * step - 0.5
    const cornerAngle = pivotAngle + tilt - step / 2
    out[i * 4] = irisPivotRadius * Math.cos(pivotAngle)
    out[i * 4 + 1] = irisPivotRadius * Math.sin(pivotAngle)
    out[i * 4 + 2] = cornerRadius * Math.cos(cornerAngle)
    out[i * 4 + 3] = cornerRadius * Math.sin(cornerAngle)
  }
}
