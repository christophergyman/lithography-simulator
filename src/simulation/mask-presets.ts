/**
 * Mask preset generators — each returns a Float32Array of N*N binary values (0 or 1).
 */

const N = 256;

export type PresetName = "line_space" | "contacts" | "isolated_line" | "dense_lines" | "l_shape";

export interface Preset {
  name: PresetName;
  label: string;
  generate: () => Float32Array;
}

function makeEmpty(): Float32Array {
  return new Float32Array(N * N);
}

/** Alternating vertical bars, 10px pitch (5px line, 5px space). */
function lineSpace(): Float32Array {
  const mask = makeEmpty();
  const pitch = 10;
  const halfPitch = pitch >> 1;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if ((c % pitch) < halfPitch) {
        mask[r * N + c] = 1;
      }
    }
  }
  return mask;
}

/** Grid of small square openings (6x6 holes, 20px pitch). */
function contacts(): Float32Array {
  const mask = makeEmpty();
  const pitch = 20;
  const holeSize = 6;
  const offset = Math.floor((pitch - holeSize) / 2);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const rMod = r % pitch;
      const cMod = c % pitch;
      if (rMod >= offset && rMod < offset + holeSize &&
          cMod >= offset && cMod < offset + holeSize) {
        mask[r * N + c] = 1;
      }
    }
  }
  return mask;
}

/** Single centered vertical slit, 6px wide. */
function isolatedLine(): Float32Array {
  const mask = makeEmpty();
  const width = 6;
  const left = (N - width) >> 1;
  const right = left + width;
  for (let r = 0; r < N; r++) {
    for (let c = left; c < right; c++) {
      mask[r * N + c] = 1;
    }
  }
  return mask;
}

/** Tightly packed vertical lines, 5px pitch (2px line, 3px space). */
function denseLines(): Float32Array {
  const mask = makeEmpty();
  const pitch = 5;
  const lineWidth = 2;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if ((c % pitch) < lineWidth) {
        mask[r * N + c] = 1;
      }
    }
  }
  return mask;
}

/** L-shaped corner pattern for 2D fidelity testing. */
function lShape(): Float32Array {
  const mask = makeEmpty();
  const cx = N >> 1;
  const cy = N >> 1;
  const armLength = 60;
  const armWidth = 10;

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const dr = r - cy;
      const dc = c - cx;

      // Horizontal arm: extends right from center
      const inHArm = dc >= 0 && dc < armLength && dr >= -armWidth / 2 && dr < armWidth / 2;
      // Vertical arm: extends downward from center
      const inVArm = dr >= 0 && dr < armLength && dc >= -armWidth / 2 && dc < armWidth / 2;

      if (inHArm || inVArm) {
        mask[r * N + c] = 1;
      }
    }
  }
  return mask;
}

export const PRESETS: Preset[] = [
  { name: "line_space", label: "Line/Space (10px)", generate: lineSpace },
  { name: "contacts", label: "Contact Holes", generate: contacts },
  { name: "isolated_line", label: "Isolated Line", generate: isolatedLine },
  { name: "dense_lines", label: "Dense Lines (5px)", generate: denseLines },
  { name: "l_shape", label: "L-Shape Corner", generate: lShape },
];
