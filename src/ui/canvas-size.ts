/**
 * Canvas display-size controls — slider, preset buttons, and text input.
 * Internal simulation resolution (N=256) is unchanged; only CSS display size changes.
 */

const MIN_SIZE = 128;
const MAX_SIZE = 768;
const DEFAULT_SIZE = 384;

const PRESETS: { label: string; size: number }[] = [
  { label: "S", size: 192 },
  { label: "M", size: 384 },
  { label: "L", size: 512 },
  { label: "XL", size: 768 },
];

function clampSize(v: number): number {
  if (!Number.isFinite(v)) return MIN_SIZE;
  return Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, v)));
}

export function createCanvasSizeControls(
  container: HTMLElement,
  onSizeChange: (size: number) => void,
): void {
  const section = document.createElement("div");
  section.className = "canvas-size-controls";

  // --- Slider (reuses .param-group pattern) ---
  const group = document.createElement("div");
  group.className = "param-group";
  group.dataset.tooltip = "The display size of the simulation on screen. Doesn\u2019t change the physics \u2014 just how big the image looks.";

  const labelRow = document.createElement("div");
  labelRow.className = "param-label";

  const nameSpan = document.createElement("span");
  nameSpan.className = "param-name";
  nameSpan.textContent = "Canvas Size";

  const valueSpan = document.createElement("span");
  valueSpan.className = "param-value";

  const unitSpan = document.createElement("span");
  unitSpan.className = "param-unit";
  unitSpan.textContent = "px";

  const valueWrap = document.createElement("span");
  valueWrap.append(valueSpan, unitSpan);
  labelRow.append(nameSpan, valueWrap);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = String(MIN_SIZE);
  slider.max = String(MAX_SIZE);
  slider.step = "1";
  slider.value = String(DEFAULT_SIZE);

  group.append(labelRow, slider);
  section.appendChild(group);

  // --- Preset buttons (reuses .stamp-btn style) ---
  const presetRow = document.createElement("div");
  presetRow.className = "size-preset-row";

  const presetBtns: HTMLButtonElement[] = [];

  for (const p of PRESETS) {
    const btn = document.createElement("button");
    btn.className = "stamp-btn";
    btn.textContent = p.label;
    btn.addEventListener("click", () => applySize(p.size));
    presetBtns.push(btn);
    presetRow.appendChild(btn);
  }

  section.appendChild(presetRow);

  // --- Text input ---
  const inputRow = document.createElement("div");
  inputRow.className = "size-input-row";

  const textInput = document.createElement("input");
  textInput.type = "number";
  textInput.className = "size-text-input";
  textInput.min = String(MIN_SIZE);
  textInput.max = String(MAX_SIZE);
  textInput.value = String(DEFAULT_SIZE);

  const pxLabel = document.createElement("span");
  pxLabel.className = "param-unit";
  pxLabel.textContent = "px";

  textInput.addEventListener("change", () => {
    applySize(Number(textInput.value));
  });

  inputRow.append(textInput, pxLabel);
  section.appendChild(inputRow);

  container.appendChild(section);

  // --- Sync all controls and fire callback ---
  function applySize(raw: number): void {
    const size = clampSize(raw);

    slider.value = String(size);
    valueSpan.textContent = String(size);
    textInput.value = String(size);

    // Highlight matching preset
    for (let i = 0; i < PRESETS.length; i++) {
      presetBtns[i].classList.toggle("active", PRESETS[i].size === size);
    }

    onSizeChange(size);
  }

  // Wire slider input
  slider.addEventListener("input", () => {
    applySize(Number(slider.value));
  });

  // Set initial state
  applySize(DEFAULT_SIZE);
}
