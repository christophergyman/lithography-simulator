/**
 * Entry point — wires all modules together.
 */

import { buildLayout } from "../ui/layout";
import { createMaskEditor } from "../ui/mask-editor";
import { createCanvasSizeControls } from "../ui/canvas-size";
import { createSliders } from "../ui/sliders";
import { createViewSliders } from "../ui/view-sliders";
import { HeatmapRenderer } from "../rendering/renderer";
import { ResistRenderer } from "../rendering/resist-renderer";
import { CrossSectionRenderer } from "../rendering/cross-section";
import { runPipeline } from "../simulation/pipeline";
import { subscribe } from "./state";
import type { AppState } from "./state";

function main(): void {
  const root = document.getElementById("app")!;
  const {
    maskPanel,
    heatmapCanvas,
    resistCanvas,
    crossSectionCanvas,
    crossSectionLine,
    heatmapWrap,
    paramsPanel,
    timingReadout,
    zoomSlider,
    zoomInBtn,
    zoomOutBtn,
    zoomLabel,
    heatmapContainer,
    downloadBtn,
  } = buildLayout(root);

  // Initialize mask editor
  const maskEditor = createMaskEditor(maskPanel);

  // Canvas size controls (first child of params panel, above sliders)
  const sizeWrap = document.createElement("div");
  paramsPanel.insertBefore(sizeWrap, paramsPanel.firstChild);
  createCanvasSizeControls(sizeWrap, (size) => {
    heatmapCanvas.style.width = size + "px";
    heatmapCanvas.style.height = size + "px";
    resistCanvas.style.width = size + "px";
    resistCanvas.style.height = size + "px";
  });

  // Initialize parameter sliders (insert before timing readout)
  const slidersWrap = document.createElement("div");
  slidersWrap.style.padding = "10px 0";
  paramsPanel.insertBefore(slidersWrap, timingReadout);
  createSliders(slidersWrap);

  // Initialize view sliders (resist threshold + cross-section row)
  const viewSlidersWrap = document.createElement("div");
  viewSlidersWrap.style.padding = "10px 0";
  viewSlidersWrap.style.borderTop = "1px solid var(--border)";
  paramsPanel.insertBefore(viewSlidersWrap, timingReadout);
  const viewSliders = createViewSliders(viewSlidersWrap);

  // Initialize renderers
  const renderer = new HeatmapRenderer(heatmapCanvas);
  const resistRenderer = new ResistRenderer(resistCanvas);
  const crossSectionRenderer = new CrossSectionRenderer(crossSectionCanvas, 540, 140);

  // Timing display elements
  const simTiming = document.getElementById("timing-sim")!;
  const renderTiming = document.getElementById("timing-render")!;

  // Subscribe to state changes
  subscribe((state: AppState) => {
    // Run simulation
    const result = runPipeline(state.mask, state.params);
    simTiming.textContent = result.timeMs.toFixed(1);

    // Render all views
    const t0 = performance.now();
    renderer.draw(result.intensity);
    resistRenderer.draw(result.intensity, state.viewParams.threshold);
    crossSectionRenderer.draw(
      result.intensity,
      state.viewParams.crossSectionRow,
      state.viewParams.threshold,
    );
    const renderMs = performance.now() - t0;
    renderTiming.textContent = renderMs.toFixed(1);

    // Update cross-section line position on heatmap
    const rowFraction = state.viewParams.crossSectionRow / 255;
    crossSectionLine.style.top = (rowFraction * 100) + "%";
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
      resistCanvas.style.width = "";
      resistCanvas.style.height = "";
      resistCanvas.style.maxWidth = "";
      resistCanvas.style.maxHeight = "";
      resistCanvas.style.minWidth = "";
      resistCanvas.style.minHeight = "";
    } else {
      const size = baseCanvasSize * value;
      heatmapCanvas.style.width = `${size}px`;
      heatmapCanvas.style.height = `${size}px`;
      heatmapCanvas.style.maxWidth = "none";
      heatmapCanvas.style.maxHeight = "none";
      heatmapCanvas.style.minWidth = `${size}px`;
      heatmapCanvas.style.minHeight = `${size}px`;
      resistCanvas.style.width = `${size}px`;
      resistCanvas.style.height = `${size}px`;
      resistCanvas.style.maxWidth = "none";
      resistCanvas.style.maxHeight = "none";
      resistCanvas.style.minWidth = `${size}px`;
      resistCanvas.style.minHeight = `${size}px`;
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

  // Export heatmap as PNG
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    link.download = `lithography-simulation-${ts}.png`;
    link.href = heatmapCanvas.toDataURL("image/png");
    link.click();
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
