/**
 * Canvas 2D renderer for binary resist image.
 * Applies a threshold to the aerial image intensity:
 * pixels >= threshold are "printed", pixels below are "not printed".
 */

const N = 256;

// Printed: accent blue (#58a6ff)
const PRINTED_R = 88;
const PRINTED_G = 166;
const PRINTED_B = 255;

// Not printed: dark background (#0d1117)
const UNPRINTED_R = 13;
const UNPRINTED_G = 17;
const UNPRINTED_B = 23;

export class ResistRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = N;
    canvas.height = N;
    this.ctx = canvas.getContext("2d")!;
    this.imageData = this.ctx.createImageData(N, N);
  }

  draw(intensity: Float32Array, threshold: number): void {
    const d = this.imageData.data;

    for (let i = 0; i < N * N; i++) {
      const j = i * 4;
      if (intensity[i] >= threshold) {
        d[j] = PRINTED_R;
        d[j + 1] = PRINTED_G;
        d[j + 2] = PRINTED_B;
      } else {
        d[j] = UNPRINTED_R;
        d[j + 1] = UNPRINTED_G;
        d[j + 2] = UNPRINTED_B;
      }
      d[j + 3] = 255;
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }
}
