/**
 * Process Window Analysis (Bossung Curves) — sweep logic and CD measurement.
 *
 * Runs the simulation pipeline at multiple (focus, dose) combinations,
 * measures Critical Dimension (CD) from each aerial image, and returns
 * structured data for plotting Bossung curves.
 */

import { runPipeline } from "./pipeline";
import type { PupilParams } from "./pupil";

const N = 256;
const PIXEL_SIZE_NM = 19.53125; // ~5 um / 256 pixels

export interface BossungParams {
  /** Focus range [min, max] in um */
  focusRange: [number, number];
  /** Number of focus steps */
  focusSteps: number;
  /** Dose range [min, max] as intensity scaling factors (1.0 = nominal) */
  doseRange: [number, number];
  /** Number of dose levels (one curve per dose) */
  doseSteps: number;
}

export interface BossungCurve {
  /** Dose value for this curve */
  dose: number;
  /** Array of (focus, cd) data points */
  points: { focus: number; cd: number }[];
}

export interface BossungResult {
  curves: BossungCurve[];
  /** Focus values used (x-axis) */
  focusValues: number[];
  /** Dose values used (one per curve) */
  doseValues: number[];
  /** Total sweep time in ms */
  timeMs: number;
  /** Number of pipeline runs executed */
  pipelineRuns: number;
}

function linspace(min: number, max: number, steps: number): number[] {
  if (steps === 1) return [(min + max) / 2];
  const result: number[] = [];
  for (let i = 0; i < steps; i++) {
    result.push(min + ((max - min) * i) / (steps - 1));
  }
  return result;
}

/**
 * Measure Critical Dimension from an aerial image intensity profile.
 *
 * Takes a horizontal cross-section through the center row, scales by dose,
 * thresholds at 1.0, finds contiguous runs above threshold, and returns
 * the width of the widest run closest to center.
 *
 * @param intensity Normalized intensity array (N*N, values in [0,1])
 * @param dose      Dose scaling factor (higher dose = more area prints)
 * @returns CD in nm (0 if nothing prints)
 */
export function measureCD(intensity: Float32Array, dose: number): number {
  const row = N >> 1; // center row (128)
  const offset = row * N;

  // Find contiguous runs of pixels where scaled intensity >= threshold (1.0)
  let bestLen = 0;
  let bestCenter = -1;
  let runStart = -1;

  for (let i = 0; i <= N; i++) {
    const above = i < N && intensity[offset + i] * dose >= 1.0;

    if (above && runStart < 0) {
      runStart = i;
    } else if (!above && runStart >= 0) {
      const len = i - runStart;
      const center = runStart + len / 2;
      // Prefer widest run; break ties by proximity to image center
      if (
        len > bestLen ||
        (len === bestLen &&
          Math.abs(center - N / 2) < Math.abs(bestCenter - N / 2))
      ) {
        bestLen = len;
        bestCenter = center;
      }
      runStart = -1;
    }
  }

  return bestLen * PIXEL_SIZE_NM;
}

/**
 * Run the full Bossung sweep.
 *
 * Optimized: runs the pipeline once per focus value and reuses the intensity
 * result across all dose levels (dose is a post-pipeline intensity scaler).
 */
export function runBossungSweep(
  mask: Float32Array,
  baseParams: PupilParams,
  sweepParams: BossungParams,
): BossungResult {
  const t0 = performance.now();

  const focusValues = linspace(
    sweepParams.focusRange[0],
    sweepParams.focusRange[1],
    sweepParams.focusSteps,
  );
  const doseValues = linspace(
    sweepParams.doseRange[0],
    sweepParams.doseRange[1],
    sweepParams.doseSteps,
  );

  // Initialize curves (one per dose)
  const curves: BossungCurve[] = doseValues.map((dose) => ({
    dose,
    points: [],
  }));

  // Sweep: one pipeline run per focus, measure CD for all doses
  for (const focus of focusValues) {
    const params: PupilParams = { ...baseParams, defocus: focus };
    const result = runPipeline(mask, params);

    for (let d = 0; d < doseValues.length; d++) {
      const cd = measureCD(result.intensity, doseValues[d]);
      curves[d].points.push({ focus, cd });
    }
  }

  const timeMs = performance.now() - t0;

  return {
    curves,
    focusValues,
    doseValues,
    timeMs,
    pipelineRuns: focusValues.length,
  };
}
