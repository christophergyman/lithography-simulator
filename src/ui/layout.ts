/**
 * DOM construction — builds the three-panel layout.
 */

export interface LayoutElements {
  maskPanel: HTMLElement;
  heatmapCanvas: HTMLCanvasElement;
  paramsPanel: HTMLElement;
  timingReadout: HTMLElement;
  zoomSlider: HTMLInputElement;
  zoomInBtn: HTMLButtonElement;
  zoomOutBtn: HTMLButtonElement;
  zoomLabel: HTMLSpanElement;
  heatmapContainer: HTMLDivElement;
}

export function buildLayout(root: HTMLElement): LayoutElements {
  root.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "header";
  const h1 = document.createElement("h1");
  h1.textContent = "Lithography Simulator";
  const subtitle = document.createElement("span");
  subtitle.className = "subtitle";
  subtitle.textContent = "Fourier Optics / Aerial Image";
  header.append(h1, subtitle);

  // Mask panel (left)
  const maskPanel = document.createElement("div");
  maskPanel.className = "panel";

  // Heatmap panel (center)
  const heatmapPanel = document.createElement("div");
  heatmapPanel.className = "panel panel-heatmap";
  const heatmapContainer = document.createElement("div");
  heatmapContainer.className = "heatmap-container";
  const heatmapCanvas = document.createElement("canvas");
  heatmapContainer.appendChild(heatmapCanvas);
  heatmapPanel.appendChild(heatmapContainer);

  // Params panel (right)
  const paramsPanel = document.createElement("div");
  paramsPanel.className = "panel panel-params";
  const paramsTitle = document.createElement("div");
  paramsTitle.className = "panel-title";
  paramsTitle.textContent = "Parameters";
  paramsPanel.appendChild(paramsTitle);

  // Timing readout at bottom of params panel
  const timingReadout = document.createElement("div");
  timingReadout.className = "timing-readout";
  timingReadout.innerHTML = `
    FFT + Pupil: <span class="value" id="timing-sim">—</span> ms<br>
    Render: <span class="value" id="timing-render">—</span> ms
  `;
  paramsPanel.appendChild(timingReadout);

  // Zoom bar (footer)
  const zoomBar = document.createElement("div");
  zoomBar.className = "zoom-bar";

  const zoomOutBtn = document.createElement("button");
  zoomOutBtn.className = "zoom-btn";
  zoomOutBtn.textContent = "\u2212";

  const zoomSlider = document.createElement("input");
  zoomSlider.type = "range";
  zoomSlider.className = "zoom-slider";
  zoomSlider.min = "0.5";
  zoomSlider.max = "4";
  zoomSlider.step = "0.1";
  zoomSlider.value = "1";

  const zoomInBtn = document.createElement("button");
  zoomInBtn.className = "zoom-btn";
  zoomInBtn.textContent = "+";

  const zoomLabel = document.createElement("span");
  zoomLabel.className = "zoom-label";
  zoomLabel.textContent = "100%";

  zoomBar.append(zoomOutBtn, zoomSlider, zoomInBtn, zoomLabel);

  heatmapContainer.appendChild(zoomBar);

  root.append(header, maskPanel, heatmapPanel, paramsPanel);

  return {
    maskPanel,
    heatmapCanvas,
    paramsPanel,
    timingReadout,
    zoomSlider,
    zoomInBtn,
    zoomOutBtn,
    zoomLabel,
    heatmapContainer,
  };
}
