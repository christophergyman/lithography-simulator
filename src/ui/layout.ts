/**
 * DOM construction — builds the three-panel layout.
 */

export type VizMode = "aerial" | "resist" | "split" | "bossung";

export interface LayoutElements {
  maskPanel: HTMLElement;
  heatmapCanvas: HTMLCanvasElement;
  resistCanvas: HTMLCanvasElement;
  crossSectionCanvas: HTMLCanvasElement;
  crossSectionLine: HTMLDivElement;
  heatmapWrap: HTMLDivElement;
  resistWrap: HTMLDivElement;
  crossSectionWrap: HTMLDivElement;
  paramsPanel: HTMLElement;
  timingReadout: HTMLElement;
  zoomSlider: HTMLInputElement;
  zoomInBtn: HTMLButtonElement;
  zoomOutBtn: HTMLButtonElement;
  zoomLabel: HTMLSpanElement;
  heatmapContainer: HTMLDivElement;
  mobileTabBar: HTMLElement;
  downloadBtn: HTMLButtonElement;
  setVizMode: (mode: VizMode) => void;
  onVizModeChange: ((mode: VizMode) => void) | null;
  toggleCrossSection: () => boolean;
  bossungCanvas: HTMLCanvasElement;
  bossungChartContainer: HTMLDivElement;
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
  const downloadBtn = document.createElement("button");
  downloadBtn.className = "download-btn";
  downloadBtn.textContent = "Export PNG";
  header.append(h1, subtitle, downloadBtn);

  // Mask panel (left)
  const maskPanel = document.createElement("div");
  maskPanel.className = "panel";
  maskPanel.dataset.panel = "mask";

  // Heatmap panel (center)
  const heatmapPanel = document.createElement("div");
  heatmapPanel.className = "panel panel-heatmap";
  heatmapPanel.dataset.panel = "view";

  // Heatmap container
  const heatmapContainer = document.createElement("div");
  heatmapContainer.className = "heatmap-container";

  // View toggle bar
  const vizToggleBar = document.createElement("div");
  vizToggleBar.className = "viz-toggle-bar";

  const vizModes: { key: VizMode; label: string }[] = [
    { key: "aerial", label: "Aerial" },
    { key: "resist", label: "Resist" },
    { key: "split", label: "Split" },
  ];

  const vizModeButtons: HTMLButtonElement[] = [];
  for (const mode of vizModes) {
    const btn = document.createElement("button");
    btn.className = "viz-toggle-btn";
    btn.textContent = mode.label;
    btn.dataset.mode = mode.key;
    vizModeButtons.push(btn);
    vizToggleBar.appendChild(btn);
  }

  // Separator
  const sep = document.createElement("div");
  sep.className = "viz-toggle-sep";
  vizToggleBar.appendChild(sep);

  // Cross-section toggle
  const csToggleBtn = document.createElement("button");
  csToggleBtn.className = "viz-toggle-btn";
  csToggleBtn.textContent = "Cross-Section";
  csToggleBtn.dataset.mode = "cs";
  vizToggleBar.appendChild(csToggleBtn);

  // Second separator
  const sep2 = document.createElement("div");
  sep2.className = "viz-toggle-sep";
  vizToggleBar.appendChild(sep2);

  // Bossung toggle
  const bossungBtn = document.createElement("button");
  bossungBtn.className = "viz-toggle-btn";
  bossungBtn.textContent = "Bossung";
  bossungBtn.dataset.mode = "bossung";
  vizToggleBar.appendChild(bossungBtn);

  // Visualization grid: toggle bar + images row + cross-section
  const vizGrid = document.createElement("div");
  vizGrid.className = "viz-grid";
  vizGrid.appendChild(vizToggleBar);

  const imageRow = document.createElement("div");
  imageRow.className = "viz-image-row";

  // Heatmap wrapper with label
  const heatmapWrap = document.createElement("div") as HTMLDivElement;
  heatmapWrap.className = "viz-image-wrap";
  const heatmapLabel = document.createElement("div");
  heatmapLabel.className = "viz-label";
  heatmapLabel.textContent = "Aerial Image";
  const heatmapCanvas = document.createElement("canvas");
  // Cross-section line indicator
  const crossSectionLine = document.createElement("div") as HTMLDivElement;
  crossSectionLine.className = "cross-section-line";
  heatmapWrap.append(heatmapLabel, heatmapCanvas, crossSectionLine);

  // Resist wrapper with label
  const resistWrap = document.createElement("div") as HTMLDivElement;
  resistWrap.className = "viz-image-wrap";
  const resistLabel = document.createElement("div");
  resistLabel.className = "viz-label";
  resistLabel.textContent = "Resist Image";
  const resistCanvas = document.createElement("canvas");
  resistWrap.append(resistLabel, resistCanvas);

  imageRow.append(heatmapWrap, resistWrap);

  // Cross-section wrapper
  const crossSectionWrap = document.createElement("div") as HTMLDivElement;
  crossSectionWrap.className = "cross-section-wrap";
  const crossSectionCanvas = document.createElement("canvas");
  crossSectionCanvas.className = "cross-section-canvas";
  crossSectionWrap.appendChild(crossSectionCanvas);

  // Bossung chart container (initially hidden)
  const bossungChartContainer = document.createElement("div");
  bossungChartContainer.className = "bossung-chart-container";
  bossungChartContainer.style.display = "none";
  const bossungCanvas = document.createElement("canvas");
  bossungChartContainer.appendChild(bossungCanvas);

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

  vizGrid.append(imageRow, crossSectionWrap, bossungChartContainer);
  heatmapContainer.append(vizGrid, zoomBar);
  heatmapPanel.appendChild(heatmapContainer);

  // View mode logic (Aerial / Resist / Split / Cross-Section / Bossung)
  let currentVizMode: VizMode = "aerial";
  let crossSectionVisible = false;

  function applyVizMode(): void {
    const isBossung = currentVizMode === "bossung";

    // Update button active states
    for (const btn of vizModeButtons) {
      btn.classList.toggle("active", btn.dataset.mode === currentVizMode);
    }
    csToggleBtn.classList.toggle("active", crossSectionVisible && !isBossung);
    csToggleBtn.classList.toggle("disabled", isBossung);
    bossungBtn.classList.toggle("active", isBossung);

    // Show/hide views
    imageRow.style.display = isBossung ? "none" : "";
    bossungChartContainer.style.display = isBossung ? "flex" : "none";
    crossSectionWrap.style.display = !isBossung && crossSectionVisible ? "" : "none";
    crossSectionLine.style.display = !isBossung && crossSectionVisible ? "" : "none";
    zoomBar.style.display = isBossung ? "none" : "";

    // Show/hide individual canvases
    if (!isBossung) {
      heatmapWrap.style.display = currentVizMode === "resist" ? "none" : "";
      resistWrap.style.display = currentVizMode === "aerial" ? "none" : "";
    }
  }

  let vizModeChangeCallback: ((mode: VizMode) => void) | null = null;

  function setVizMode(mode: VizMode): void {
    currentVizMode = mode;
    applyVizMode();
    if (vizModeChangeCallback) vizModeChangeCallback(mode);
  }

  function toggleCrossSection(): boolean {
    crossSectionVisible = !crossSectionVisible;
    applyVizMode();
    return crossSectionVisible;
  }

  // Wire up button clicks
  for (const btn of vizModeButtons) {
    btn.addEventListener("click", () => {
      setVizMode(btn.dataset.mode as VizMode);
    });
  }
  csToggleBtn.addEventListener("click", () => {
    toggleCrossSection();
  });
  bossungBtn.addEventListener("click", () => {
    setVizMode("bossung");
  });

  // Set initial state
  applyVizMode();

  // Params panel (right)
  const paramsPanel = document.createElement("div");
  paramsPanel.className = "panel panel-params";
  paramsPanel.dataset.panel = "params";
  const paramsTitle = document.createElement("div");
  paramsTitle.className = "panel-title";
  paramsTitle.textContent = "Parameters";
  paramsPanel.appendChild(paramsTitle);

  // Timing readout at bottom of params panel
  const timingReadout = document.createElement("div");
  timingReadout.className = "timing-readout";
  timingReadout.innerHTML = `
    FFT + Pupil: <span class="value" id="timing-sim">\u2014</span> ms<br>
    Render: <span class="value" id="timing-render">\u2014</span> ms
  `;
  paramsPanel.appendChild(timingReadout);

  // Mobile tab bar
  const mobileTabBar = document.createElement("div");
  mobileTabBar.className = "mobile-tab-bar";

  const tabs: { key: string; label: string }[] = [
    { key: "mask", label: "Mask" },
    { key: "view", label: "View" },
    { key: "params", label: "Params" },
  ];

  const tabButtons: HTMLButtonElement[] = [];
  for (const tab of tabs) {
    const btn = document.createElement("button");
    btn.className = "mobile-tab-btn";
    btn.textContent = tab.label;
    btn.dataset.tab = tab.key;
    btn.addEventListener("click", () => {
      root.dataset.activeTab = tab.key;
      for (const b of tabButtons) {
        b.classList.toggle("active", b.dataset.tab === tab.key);
      }
    });
    tabButtons.push(btn);
    mobileTabBar.appendChild(btn);
  }

  // Default active tab
  root.dataset.activeTab = "view";
  tabButtons[1].classList.add("active"); // "View" tab

  root.append(header, maskPanel, heatmapPanel, paramsPanel, mobileTabBar);

  const elements: LayoutElements = {
    maskPanel,
    heatmapCanvas,
    resistCanvas,
    crossSectionCanvas,
    crossSectionLine,
    heatmapWrap,
    resistWrap,
    crossSectionWrap,
    paramsPanel,
    timingReadout,
    zoomSlider,
    zoomInBtn,
    zoomOutBtn,
    zoomLabel,
    heatmapContainer,
    mobileTabBar,
    downloadBtn,
    setVizMode,
    get onVizModeChange() { return vizModeChangeCallback; },
    set onVizModeChange(cb) { vizModeChangeCallback = cb; },
    toggleCrossSection,
    bossungCanvas,
    bossungChartContainer,
  };

  return elements;
}
