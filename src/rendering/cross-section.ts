/**
 * Canvas 2D line chart renderer for the 1D cross-section profile.
 * Extracts a horizontal row from the aerial image intensity and plots it
 * as a line graph with a threshold indicator.
 */

const N = 256;
const PAD_TOP = 12;
const PAD_RIGHT = 12;
const PAD_BOTTOM = 28;
const PAD_LEFT = 40;

export class CrossSectionRenderer {
  private ctx: CanvasRenderingContext2D;
  private w: number;
  private h: number;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.w = width;
    this.h = height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    this.ctx = canvas.getContext("2d")!;
    this.ctx.scale(dpr, dpr);
  }

  draw(intensity: Float32Array, row: number, threshold: number): void {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const plotW = w - PAD_LEFT - PAD_RIGHT;
    const plotH = h - PAD_TOP - PAD_BOTTOM;

    // Clear
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, w, h);

    // Axes
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD_LEFT, PAD_TOP);
    ctx.lineTo(PAD_LEFT, PAD_TOP + plotH);
    ctx.lineTo(PAD_LEFT + plotW, PAD_TOP + plotH);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = "#8b949e";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const yVal of [0, 0.5, 1.0]) {
      const y = PAD_TOP + plotH * (1 - yVal);
      ctx.fillText(yVal.toFixed(1), PAD_LEFT - 4, y);
      // Grid line
      ctx.strokeStyle = "#21262d";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(PAD_LEFT + plotW, y);
      ctx.stroke();
    }

    // X-axis labels
    ctx.fillStyle = "#8b949e";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const xVal of [0, 128, 255]) {
      const x = PAD_LEFT + (xVal / 255) * plotW;
      ctx.fillText(String(xVal), x, PAD_TOP + plotH + 4);
    }

    // Row label
    ctx.fillStyle = "#8b949e";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("Row " + row, PAD_LEFT + plotW, PAD_TOP + plotH + 4);

    // Threshold line (dashed red)
    const threshY = PAD_TOP + plotH * (1 - threshold);
    ctx.strokeStyle = "#f85149";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(PAD_LEFT, threshY);
    ctx.lineTo(PAD_LEFT + plotW, threshY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Threshold label
    ctx.fillStyle = "#f85149";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("T=" + threshold.toFixed(2), PAD_LEFT + 3, threshY - 2);

    // Intensity curve
    const rowOffset = row * N;
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = PAD_LEFT + (i / (N - 1)) * plotW;
      const val = Math.max(0, Math.min(1, intensity[rowOffset + i]));
      const y = PAD_TOP + plotH * (1 - val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
