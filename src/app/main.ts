/**
 * Entry point — wires all modules together.
 */

import { buildLayout } from "../ui/layout";
import { createMaskEditor } from "../ui/mask-editor";
import { createSliders } from "../ui/sliders";
import { HeatmapRenderer } from "../rendering/renderer";
import { runPipeline } from "../simulation/pipeline";
import { subscribe } from "./state";
import type { AppState } from "./state";

function main(): void {
  const root = document.getElementById("app")!;
  const {
    maskPanel,
    heatmapCanvas,
    paramsPanel,
    timingReadout,
    zoomSlider,
    zoomInBtn,
    zoomOutBtn,
    zoomLabel,
    heatmapContainer,
  } = buildLayout(root);

  // Initialize mask editor
  createMaskEditor(maskPanel);

  // Initialize parameter sliders (insert before timing readout)
  const slidersWrap = document.createElement("div");
  slidersWrap.style.padding = "10px 0";
  paramsPanel.insertBefore(slidersWrap, timingReadout);
  createSliders(slidersWrap);

  // Initialize WebGL renderer
  const renderer = new HeatmapRenderer(heatmapCanvas);

  // Timing display elements
  const simTiming = document.getElementById("timing-sim")!;
  const renderTiming = document.getElementById("timing-render")!;

  // Subscribe to state changes
  subscribe((state: AppState) => {
    // Run simulation
    const result = runPipeline(state.mask, state.params);
    simTiming.textContent = result.timeMs.toFixed(1);

    // Render
    const t0 = performance.now();
    renderer.draw(result.intensity);
    const renderMs = performance.now() - t0;
    renderTiming.textContent = renderMs.toFixed(1);
  });

  // Zoom controls
  let baseCanvasSize = 0;

  function applyZoom(value: number): void {
    if (baseCanvasSize === 0) {
      baseCanvasSize = heatmapCanvas.offsetWidth;
    }

    if (value === 1) {
      // Reset to CSS-driven sizing
      heatmapCanvas.style.width = "";
      heatmapCanvas.style.height = "";
      heatmapCanvas.style.maxWidth = "";
      heatmapCanvas.style.maxHeight = "";
      heatmapCanvas.style.minWidth = "";
      heatmapCanvas.style.minHeight = "";
    } else {
      const size = baseCanvasSize * value;
      heatmapCanvas.style.width = `${size}px`;
      heatmapCanvas.style.height = `${size}px`;
      heatmapCanvas.style.maxWidth = "none";
      heatmapCanvas.style.maxHeight = "none";
      heatmapCanvas.style.minWidth = `${size}px`;
      heatmapCanvas.style.minHeight = `${size}px`;
    }

    zoomLabel.textContent = `${Math.round(value * 100)}%`;
    zoomSlider.value = String(value);
  }

  zoomSlider.addEventListener("input", () => {
    applyZoom(parseFloat(zoomSlider.value));
  });

  zoomOutBtn.addEventListener("click", () => {
    const next = Math.max(0.5, parseFloat(zoomSlider.value) - 0.1);
    applyZoom(Math.round(next * 10) / 10);
  });

  zoomInBtn.addEventListener("click", () => {
    const next = Math.min(4, parseFloat(zoomSlider.value) + 0.1);
    applyZoom(Math.round(next * 10) / 10);
  });

  // Load default preset by clicking first button (updates both mask canvas and state)
  const firstBtn = maskPanel.querySelector<HTMLButtonElement>(".preset-btn");
  if (firstBtn) firstBtn.click();
}

// Boot
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
