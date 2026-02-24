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
  mobileTabBar: HTMLElement;
  downloadBtn: HTMLButtonElement;
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

  // View toggle (Heatmap / Bossung)
  const viewToggle = document.createElement("div");
  viewToggle.className = "view-toggle";

  const heatmapTabBtn = document.createElement("button");
  heatmapTabBtn.textContent = "Heatmap";
  heatmapTabBtn.classList.add("active");

  const bossungTabBtn = document.createElement("button");
  bossungTabBtn.textContent = "Bossung";

  viewToggle.append(heatmapTabBtn, bossungTabBtn);
  heatmapPanel.appendChild(viewToggle);

  // Heatmap container
  const heatmapContainer = document.createElement("div");
  heatmapContainer.className = "heatmap-container";
  const heatmapCanvas = document.createElement("canvas");
  heatmapContainer.appendChild(heatmapCanvas);
  heatmapPanel.appendChild(heatmapContainer);

  // Bossung chart container (initially hidden)
  const bossungChartContainer = document.createElement("div");
  bossungChartContainer.className = "bossung-chart-container";
  bossungChartContainer.style.display = "none";
  const bossungCanvas = document.createElement("canvas");
  bossungChartContainer.appendChild(bossungCanvas);
  heatmapPanel.appendChild(bossungChartContainer);

  // View toggle logic
  function setView(mode: "heatmap" | "bossung") {
    const isHeatmap = mode === "heatmap";
    heatmapContainer.style.display = isHeatmap ? "" : "none";
    bossungChartContainer.style.display = isHeatmap ? "none" : "flex";
    heatmapTabBtn.classList.toggle("active", isHeatmap);
    bossungTabBtn.classList.toggle("active", !isHeatmap);
  }

  heatmapTabBtn.addEventListener("click", () => setView("heatmap"));
  bossungTabBtn.addEventListener("click", () => setView("bossung"));

  // Expose setView so main.ts can auto-switch after a sweep
  (bossungChartContainer as any)._showBossung = () => setView("bossung");

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
    mobileTabBar,
    downloadBtn,
    bossungCanvas,
    bossungChartContainer,
  };
}
