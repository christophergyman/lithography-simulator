/**
 * Pupil filter — circular aperture with defocus and Zernike aberrations.
 *
 * Operates on frequency-domain data (post-FFT, post-fftshift so DC is centered).
 */

import { type ZernikeCoeffs, zernikePhaseError } from "./zernike";

export interface PupilParams {
  /** Wavelength in nm */
  wavelength: number;
  /** Numerical aperture */
  na: number;
  /** Partial coherence factor σ ∈ [0,1] */
  sigma: number;
  /** Defocus in μm */
  defocus: number;
  /** Zernike aberration coefficients (in waves) */
  zernike: ZernikeCoeffs;
}

/**
 * Apply pupil filter to frequency-domain complex data (DC at center).
 *
 * The pupil is a circular aperture of radius proportional to NA*(1+σ)
 * (effective NA for partially coherent imaging), with defocus phase and
 * optional Zernike aberration phase terms.
 *
 * @param data  Interleaved complex Float64Array [re, im, ...], N*N entries
 * @param N     Grid size (must be power of 2)
 * @param params Simulation parameters
 */
export function applyPupil(
  data: Float64Array,
  N: number,
  params: PupilParams,
): void {
  const { wavelength, na, sigma, defocus, zernike } = params;

  // Pixel size in nm — total field of view = N * pixelSize
  const pixelSize = 19.53125; // ~5μm / 256 ≈ 19.53 nm

  // Spatial frequency spacing: Δf = 1/(N * pixelSize)
  const df = 1 / (N * pixelSize);

  // Cutoff frequency: f_max = NA / λ  (with partial coherence scaling)
  const effectiveNA = na * (1 + sigma);
  const fCutoff = effectiveNA / wavelength;
  const fCutoffSq = fCutoff * fCutoff;

  // Defocus phase coefficient: exp(i * π * λ * defocus_nm * (fx² + fy²))
  // defocus is in μm, convert to nm
  const defocusNm = defocus * 1000;
  const phaseCoeff = Math.PI * wavelength * defocusNm;

  // Check if any Zernike coefficient is non-zero
  const hasZernike = zernike.z4 !== 0 || zernike.z5 !== 0 || zernike.z6 !== 0 ||
    zernike.z7 !== 0 || zernike.z8 !== 0 || zernike.z9 !== 0 ||
    zernike.z10 !== 0 || zernike.z11 !== 0;

  const TWO_PI = 2 * Math.PI;
  const half = N >> 1;

  for (let r = 0; r < N; r++) {
    // Frequency index: centered, so fy = (r - N/2) * df
    const fy = (r - half) * df;
    const fySq = fy * fy;

    for (let c = 0; c < N; c++) {
      const fx = (c - half) * df;
      const fSq = fx * fx + fySq;

      const idx = (r * N + c) * 2;

      if (fSq > fCutoffSq) {
        // Outside aperture — block
        data[idx] = 0;
        data[idx + 1] = 0;
      } else {
        // Defocus phase
        let phase = defocusNm !== 0 ? phaseCoeff * fSq : 0;

        // Zernike aberration phase
        if (hasZernike) {
          const f = Math.sqrt(fSq);
          const rho = f / fCutoff;
          const theta = Math.atan2(fy, fx);
          phase += TWO_PI * zernikePhaseError(rho, theta, zernike);
        }

        // Apply combined phase rotation
        if (phase !== 0) {
          const cosP = Math.cos(phase);
          const sinP = Math.sin(phase);
          const re = data[idx];
          const im = data[idx + 1];
          data[idx] = re * cosP - im * sinP;
          data[idx + 1] = re * sinP + im * cosP;
        }
      }
    }
  }
}
