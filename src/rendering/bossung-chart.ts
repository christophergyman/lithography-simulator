/**
 * Canvas 2D renderer for Bossung curves (CD vs Defocus, one line per dose).
 */

import type { BossungResult } from "../simulation/bossung";

const CURVE_COLORS = [
  "#58a6ff", // blue (accent)
  "#3fb950", // green
  "#f0883e", // orange
  "#bc8cff", // purple
  "#f778ba", // pink
  "#ffd33d", // yellow
  "#a5d6ff", // light blue
  "#ff7b72", // red
  "#7ee787", // light green
];

const BG_COLOR = "#161b22";
const GRID_COLOR = "rgba(48, 54, 61, 0.6)";
const TEXT_COLOR = "#8b949e";
const TITLE_COLOR = "#e6edf3";
const FONT = '"SF Mono", "Cascadia Code", "Fira Code", monospace';

const MARGIN = { top: 40, right: 130, bottom: 55, left: 70 };

export class BossungChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  clear(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw(result: BossungResult): void {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Plot area
    const plotX = MARGIN.left;
    const plotY = MARGIN.top;
    const plotW = w - MARGIN.left - MARGIN.right;
    const plotH = h - MARGIN.top - MARGIN.bottom;

    if (plotW < 40 || plotH < 40) return;

    // Data bounds
    const xMin = result.focusValues[0];
    const xMax = result.focusValues[result.focusValues.length - 1];

    let yMin = Infinity;
    let yMax = -Infinity;
    for (const curve of result.curves) {
      for (const pt of curve.points) {
        if (pt.cd < yMin) yMin = pt.cd;
        if (pt.cd > yMax) yMax = pt.cd;
      }
    }

    // Handle edge cases
    if (!isFinite(yMin) || !isFinite(yMax) || yMin === yMax) {
      yMin = 0;
      yMax = 200;
    } else {
      const pad = (yMax - yMin) * 0.1 || 20;
      yMin = Math.max(0, yMin - pad);
      yMax = yMax + pad;
    }

    // Coordinate transforms
    const toX = (focus: number) =>
      plotX + ((focus - xMin) / (xMax - xMin)) * plotW;
    const toY = (cd: number) =>
      plotY + plotH - ((cd - yMin) / (yMax - yMin)) * plotH;

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Grid lines & ticks
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const xTicks = niceSteps(xMin, xMax, 8);
    const yTicks = niceSteps(yMin, yMax, 6);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Vertical grid + x-axis labels
    for (const v of xTicks) {
      const x = toX(v);
      ctx.beginPath();
      ctx.moveTo(x, plotY);
      ctx.lineTo(x, plotY + plotH);
      ctx.stroke();

      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(v.toFixed(1), x, plotY + plotH + 8);
    }

    // Horizontal grid + y-axis labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of yTicks) {
      const y = toY(v);
      ctx.beginPath();
      ctx.moveTo(plotX, y);
      ctx.lineTo(plotX + plotW, y);
      ctx.stroke();

      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(v.toFixed(0), plotX - 8, y);
    }

    ctx.setLineDash([]);

    // Plot border
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX, plotY, plotW, plotH);

    // Draw curves
    for (let i = 0; i < result.curves.length; i++) {
      const curve = result.curves[i];
      const color = CURVE_COLORS[i % CURVE_COLORS.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      for (let j = 0; j < curve.points.length; j++) {
        const pt = curve.points[j];
        const x = toX(pt.focus);
        const y = toY(pt.cd);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw small dots at each data point
      ctx.fillStyle = color;
      for (const pt of curve.points) {
        ctx.beginPath();
        ctx.arc(toX(pt.focus), toY(pt.cd), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Axis labels
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `11px ${FONT}`;

    // X-axis label
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Defocus (\u03bcm)", plotX + plotW / 2, plotY + plotH + 30);

    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(16, plotY + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CD (nm)", 0, 0);
    ctx.restore();

    // Title
    ctx.fillStyle = TITLE_COLOR;
    ctx.font = `12px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Bossung Curves", plotX + plotW / 2, 12);

    // Legend
    const legendX = plotX + plotW + 16;
    let legendY = plotY + 4;

    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    for (let i = 0; i < result.curves.length; i++) {
      const color = CURVE_COLORS[i % CURVE_COLORS.length];
      const dose = result.doseValues[i];

      // Color line swatch
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 18, legendY);
      ctx.stroke();

      // Label
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(`D=${dose.toFixed(2)}`, legendX + 24, legendY);

      legendY += 18;
    }
  }
}

/** Generate nicely-rounded tick values in [min, max]. */
function niceSteps(min: number, max: number, approxCount: number): number[] {
  const range = max - min;
  if (range <= 0) return [min];

  const rawStep = range / approxCount;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  let step: number;
  const norm = rawStep / mag;

  if (norm <= 1.5) step = mag;
  else if (norm <= 3.5) step = 2 * mag;
  else if (norm <= 7.5) step = 5 * mag;
  else step = 10 * mag;

  const ticks: number[] = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + step * 0.01; v += step) {
    ticks.push(Math.round(v / step) * step);
  }
  return ticks;
}
