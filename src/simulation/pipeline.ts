/**
 * Full simulation pipeline:
 *   Binary mask → FFT2D → fftshift → pupil filter → fftshift → IFFT2D → |amplitude|² → normalize
 */

import { fft2d, fftshift } from "./fft";
import { applyPupil, type PupilParams } from "./pupil";

const N = 256;
const N2 = N * N;

/** Pre-allocated complex buffer for frequency domain work. */
let complexBuf: Float64Array | null = null;

function getComplexBuf(): Float64Array {
  if (!complexBuf || complexBuf.length !== N2 * 2) {
    complexBuf = new Float64Array(N2 * 2);
  }
  return complexBuf;
}

export interface SimulationResult {
  /** Normalized intensity image, Float32Array N*N, values in [0, 1]. */
  intensity: Float32Array;
  /** Pipeline execution time in ms. */
  timeMs: number;
}

/**
 * Run the full lithography simulation pipeline.
 *
 * @param mask     Binary mask Float32Array N*N (0 or 1)
 * @param params   Optical parameters
 * @returns        Normalized aerial image intensity
 */
export function runPipeline(
  mask: Float32Array,
  params: PupilParams,
): SimulationResult {
  const t0 = performance.now();

  const complex = getComplexBuf();

  // 1. Load mask into complex buffer (real part only)
  for (let i = 0; i < N2; i++) {
    complex[i * 2] = mask[i];
    complex[i * 2 + 1] = 0;
  }

  // 2. Forward FFT
  fft2d(complex, N, false);

  // 3. Shift DC to center
  fftshift(complex, N);

  // 4. Apply pupil filter (aperture + defocus)
  applyPupil(complex, N, params);

  // 5. Shift back
  fftshift(complex, N);

  // 6. Inverse FFT
  fft2d(complex, N, true);

  // 7. Compute intensity = |amplitude|² and find max for normalization
  const intensity = new Float32Array(N2);
  let maxVal = 0;

  for (let i = 0; i < N2; i++) {
    const re = complex[i * 2];
    const im = complex[i * 2 + 1];
    const val = re * re + im * im;
    intensity[i] = val;
    if (val > maxVal) maxVal = val;
  }

  // 8. Normalize to [0, 1]
  if (maxVal > 0) {
    const scale = 1 / maxVal;
    for (let i = 0; i < N2; i++) {
      intensity[i] *= scale;
    }
  }

  const timeMs = performance.now() - t0;
  return { intensity, timeMs };
}
