/**
 * Pupil filter — circular aperture with optional defocus aberration.
 *
 * Operates on frequency-domain data (post-FFT, post-fftshift so DC is centered).
 */

export interface PupilParams {
  /** Wavelength in nm */
  wavelength: number;
  /** Numerical aperture */
  na: number;
  /** Partial coherence factor σ ∈ [0,1] */
  sigma: number;
  /** Defocus in μm */
  defocus: number;
}

/**
 * Apply pupil filter to frequency-domain complex data (DC at center).
 *
 * The pupil is a circular aperture of radius proportional to NA*(1+σ)
 * (effective NA for partially coherent imaging), with a defocus phase term.
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
  const { wavelength, na, sigma, defocus } = params;

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
      } else if (defocusNm !== 0) {
        // Inside aperture — apply defocus phase
        const phase = phaseCoeff * fSq;
        const cosP = Math.cos(phase);
        const sinP = Math.sin(phase);

        const re = data[idx];
        const im = data[idx + 1];

        data[idx] = re * cosP - im * sinP;
        data[idx + 1] = re * sinP + im * cosP;
      }
      // If no defocus and inside aperture, data passes through unchanged
    }
  }
}
