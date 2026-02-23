/**
 * Radix-2 Cooley-Tukey FFT — in-place, interleaved complex Float64Array.
 *
 * Data layout: [re0, im0, re1, im1, ...] — N complex entries = 2*N floats.
 */

// ---------- helpers ----------

/** Bit-reverse an index of `log2N` bits. */
function bitReverse(x: number, log2N: number): number {
  let result = 0;
  for (let i = 0; i < log2N; i++) {
    result = (result << 1) | (x & 1);
    x >>= 1;
  }
  return result;
}

/** Precompute bit-reversal permutation table for length N. */
function makeBitReversalTable(N: number): Uint32Array {
  const log2N = Math.log2(N) | 0;
  const table = new Uint32Array(N);
  for (let i = 0; i < N; i++) {
    table[i] = bitReverse(i, log2N);
  }
  return table;
}

// ---------- caches ----------

const bitRevCache = new Map<number, Uint32Array>();
const twiddleCache = new Map<string, Float64Array>();

function getBitReversalTable(N: number): Uint32Array {
  let t = bitRevCache.get(N);
  if (!t) {
    t = makeBitReversalTable(N);
    bitRevCache.set(N, t);
  }
  return t;
}

/**
 * Get cached twiddle factors for a given stage size and direction.
 * Returns Float64Array of [cos, sin] pairs for half-stage.
 */
function getTwiddle(halfSize: number, inverse: boolean): Float64Array {
  const key = `${halfSize}_${inverse ? 1 : 0}`;
  let tw = twiddleCache.get(key);
  if (!tw) {
    const size = halfSize * 2;
    tw = new Float64Array(halfSize * 2);
    const sign = inverse ? 1 : -1;
    const angleStep = (sign * Math.PI) / halfSize;
    for (let k = 0; k < halfSize; k++) {
      const angle = angleStep * k;
      tw[k * 2] = Math.cos(angle);
      tw[k * 2 + 1] = Math.sin(angle);
    }
    twiddleCache.set(key, tw);
  }
  return tw;
}

// ---------- 1D FFT in-place ----------

/**
 * In-place radix-2 FFT on interleaved complex data.
 * `data` has 2*N floats. `offset` and `stride` select a sub-array
 * (for row/column extraction in 2D).
 *
 * For simple 1D: offset=0, stride=1.
 */
export function fft1d(
  data: Float64Array,
  N: number,
  inverse: boolean,
  offset: number = 0,
  stride: number = 1,
): void {
  const log2N = Math.log2(N) | 0;
  const table = getBitReversalTable(N);

  // Bit-reversal permutation (in temp buffer when stride != 1)
  if (stride === 1 && offset === 0) {
    // Fast path — direct swap
    for (let i = 0; i < N; i++) {
      const j = table[i];
      if (j > i) {
        const ri = i * 2, rj = j * 2;
        let tmp = data[ri]; data[ri] = data[rj]; data[rj] = tmp;
        tmp = data[ri + 1]; data[ri + 1] = data[rj + 1]; data[rj + 1] = tmp;
      }
    }
  } else {
    // Copy out, permute, copy back
    const tmp = new Float64Array(N * 2);
    for (let i = 0; i < N; i++) {
      const src = (offset + i * stride) * 2;
      const dst = table[i] * 2;
      tmp[dst] = data[src];
      tmp[dst + 1] = data[src + 1];
    }
    for (let i = 0; i < N; i++) {
      const dst = (offset + i * stride) * 2;
      data[dst] = tmp[i * 2];
      data[dst + 1] = tmp[i * 2 + 1];
    }
  }

  // Butterfly stages
  for (let s = 1; s <= log2N; s++) {
    const size = 1 << s;
    const halfSize = size >> 1;
    const tw = getTwiddle(halfSize, inverse);

    for (let blockStart = 0; blockStart < N; blockStart += size) {
      for (let k = 0; k < halfSize; k++) {
        const evenIdx = (offset + (blockStart + k) * stride) * 2;
        const oddIdx = (offset + (blockStart + k + halfSize) * stride) * 2;

        const twRe = tw[k * 2];
        const twIm = tw[k * 2 + 1];

        const oddRe = data[oddIdx];
        const oddIm = data[oddIdx + 1];

        // twiddle * odd
        const tRe = twRe * oddRe - twIm * oddIm;
        const tIm = twRe * oddIm + twIm * oddRe;

        const eRe = data[evenIdx];
        const eIm = data[evenIdx + 1];

        data[evenIdx] = eRe + tRe;
        data[evenIdx + 1] = eIm + tIm;
        data[oddIdx] = eRe - tRe;
        data[oddIdx + 1] = eIm - tIm;
      }
    }
  }

  // Scale for inverse
  if (inverse) {
    const scale = 1 / N;
    for (let i = 0; i < N; i++) {
      const idx = (offset + i * stride) * 2;
      data[idx] *= scale;
      data[idx + 1] *= scale;
    }
  }
}

// ---------- 2D FFT ----------

/**
 * 2D FFT on NxN interleaved complex data.
 * Data layout: row-major, N*N complex entries = 2*N*N floats.
 */
export function fft2d(data: Float64Array, N: number, inverse: boolean): void {
  // Transform each row
  const rowBuf = new Float64Array(N * 2);
  for (let r = 0; r < N; r++) {
    const rowOffset = r * N * 2;
    // Copy row
    rowBuf.set(data.subarray(rowOffset, rowOffset + N * 2));
    fft1d(rowBuf, N, inverse);
    data.set(rowBuf, rowOffset);
  }

  // Transform each column
  const colBuf = new Float64Array(N * 2);
  for (let c = 0; c < N; c++) {
    // Extract column
    for (let r = 0; r < N; r++) {
      colBuf[r * 2] = data[(r * N + c) * 2];
      colBuf[r * 2 + 1] = data[(r * N + c) * 2 + 1];
    }
    fft1d(colBuf, N, inverse);
    // Write column back
    for (let r = 0; r < N; r++) {
      data[(r * N + c) * 2] = colBuf[r * 2];
      data[(r * N + c) * 2 + 1] = colBuf[r * 2 + 1];
    }
  }
}

/**
 * Swap quadrants so DC is at center.
 * Works on NxN interleaved complex data.
 */
export function fftshift(data: Float64Array, N: number): void {
  const half = N >> 1;
  for (let r = 0; r < half; r++) {
    for (let c = 0; c < N; c++) {
      const r2 = r + half;
      const c2 = (c + half) % N;

      const idx1 = (r * N + c) * 2;
      const idx2 = (r2 * N + c2) * 2;

      let tmp = data[idx1]; data[idx1] = data[idx2]; data[idx2] = tmp;
      tmp = data[idx1 + 1]; data[idx1 + 1] = data[idx2 + 1]; data[idx2 + 1] = tmp;
    }
  }
}
