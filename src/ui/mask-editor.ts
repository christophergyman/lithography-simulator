/**
 * Canvas 2D mask editor — 256x256 binary grid with mouse painting.
 */

import { getState, setMask } from "../app/state";
import { PRESETS, type PresetName } from "../simulation/mask-presets";

const N = 256;

// --- Stamp shape generators ---
// Each returns a list of [dx, dy] offsets relative to center.
type StampShape = "square" | "circle" | "ring" | "cross" | "lineH" | "lineV";

function generateStampOffsets(
  shape: StampShape,
  size: number,
): [number, number][] {
  const r = size / 2;
  const offsets: [number, number][] = [];
  const half = Math.floor(size / 2);

  switch (shape) {
    case "square":
      for (let dy = -half; dy <= half; dy++)
        for (let dx = -half; dx <= half; dx++) offsets.push([dx, dy]);
      break;

    case "circle":
      for (let dy = -half; dy <= half; dy++)
        for (let dx = -half; dx <= half; dx++)
          if (dx * dx + dy * dy <= r * r) offsets.push([dx, dy]);
      break;

    case "ring": {
      const innerR = r * 0.6;
      for (let dy = -half; dy <= half; dy++)
        for (let dx = -half; dx <= half; dx++) {
          const d2 = dx * dx + dy * dy;
          if (d2 <= r * r && d2 >= innerR * innerR) offsets.push([dx, dy]);
        }
      break;
    }

    case "cross": {
      const arm = Math.max(1, Math.floor(size / 6));
      for (let dy = -half; dy <= half; dy++)
        for (let dx = -half; dx <= half; dx++)
          if (Math.abs(dx) <= arm || Math.abs(dy) <= arm)
            offsets.push([dx, dy]);
      break;
    }

    case "lineH": {
      const thick = Math.max(1, Math.floor(size / 6));
      for (let dy = -thick; dy <= thick; dy++)
        for (let dx = -half; dx <= half; dx++) offsets.push([dx, dy]);
      break;
    }

    case "lineV": {
      const thick = Math.max(1, Math.floor(size / 6));
      for (let dy = -half; dy <= half; dy++)
        for (let dx = -thick; dx <= thick; dx++) offsets.push([dx, dy]);
      break;
    }
  }

  return offsets;
}

const STAMP_SHAPES: { key: StampShape; label: string }[] = [
  { key: "square", label: "Square" },
  { key: "circle", label: "Circle" },
  { key: "ring", label: "Ring" },
  { key: "cross", label: "Cross" },
  { key: "lineH", label: "Line H" },
  { key: "lineV", label: "Line V" },
];

export interface MaskEditorHandle {
  setDisplaySize(size: number): void;
}

export function createMaskEditor(container: HTMLElement): MaskEditorHandle {
  // Title
  const title = document.createElement("div");
  title.className = "panel-title";
  title.textContent = "Mask Editor";
  container.appendChild(title);

  const inner = document.createElement("div");
  inner.className = "panel-mask";
  container.appendChild(inner);

  // Canvas
  const wrap = document.createElement("div");
  wrap.className = "mask-canvas-wrap";

  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;

  wrap.appendChild(canvas);
  inner.appendChild(wrap);

  const ctx = canvas.getContext("2d")!;

  // Tool mode state
  let toolMode: "brush" | "stamp" = "brush";
  let stampShape: StampShape = "square";
  let stampSize = 20;

  // Paint state
  let painting = false;
  let paintValue = 1; // 1 = draw, 0 = erase

  function renderMask(): void {
    const mask = getState().mask;
    const imageData = ctx.createImageData(N, N);
    const d = imageData.data;
    for (let i = 0; i < N * N; i++) {
      const v = mask[i] > 0 ? 255 : 0;
      d[i * 4] = v;
      d[i * 4 + 1] = v;
      d[i * 4 + 2] = v;
      d[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function getPixel(e: MouseEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const scaleX = N / rect.width;
    const scaleY = N / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    return [
      Math.max(0, Math.min(N - 1, x)),
      Math.max(0, Math.min(N - 1, y)),
    ];
  }

  function paintBrush(x: number, y: number, mask: Float32Array): void {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < N && py >= 0 && py < N) {
          mask[py * N + px] = paintValue;
        }
      }
    }
  }

  function paintStamp(x: number, y: number, mask: Float32Array): void {
    const offsets = generateStampOffsets(stampShape, stampSize);
    for (const [dx, dy] of offsets) {
      const px = x + dx;
      const py = y + dy;
      if (px >= 0 && px < N && py >= 0 && py < N) {
        mask[py * N + px] = paintValue;
      }
    }
  }

  function paint(e: MouseEvent): void {
    const [x, y] = getPixel(e);
    const mask = getState().mask;
    if (toolMode === "stamp") {
      paintStamp(x, y, mask);
    } else {
      paintBrush(x, y, mask);
    }
    renderMask();
    setMask(mask);
  }

  canvas.addEventListener("mousedown", (e) => {
    painting = true;
    paintValue = e.button === 2 ? 0 : 1;
    paint(e);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (painting) paint(e);
  });

  canvas.addEventListener("mouseup", () => { painting = false; });
  canvas.addEventListener("mouseleave", () => { painting = false; });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // --- Tool mode toggle (Brush / Stamp) ---
  const toolToggle = document.createElement("div");
  toolToggle.className = "tool-toggle";

  const brushBtn = document.createElement("button");
  brushBtn.textContent = "BRUSH";
  brushBtn.classList.add("active");

  const stampBtn = document.createElement("button");
  stampBtn.textContent = "STAMP";

  function setToolMode(mode: "brush" | "stamp"): void {
    toolMode = mode;
    brushBtn.classList.toggle("active", mode === "brush");
    stampBtn.classList.toggle("active", mode === "stamp");
    stampOptions.style.display = mode === "stamp" ? "" : "none";
  }

  brushBtn.addEventListener("click", () => setToolMode("brush"));
  stampBtn.addEventListener("click", () => setToolMode("stamp"));
  toolToggle.append(brushBtn, stampBtn);
  inner.appendChild(toolToggle);

  // --- Stamp options (shape selector + size slider) ---
  const stampOptions = document.createElement("div");
  stampOptions.className = "stamp-options";
  stampOptions.style.display = "none";

  // Shape buttons
  const shapeRow = document.createElement("div");
  shapeRow.className = "stamp-shape-row";

  const shapeBtns: HTMLButtonElement[] = [];

  for (const s of STAMP_SHAPES) {
    const btn = document.createElement("button");
    btn.className = "stamp-btn";
    btn.textContent = s.label;
    if (s.key === stampShape) btn.classList.add("active");
    btn.addEventListener("click", () => {
      stampShape = s.key;
      shapeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    shapeBtns.push(btn);
    shapeRow.appendChild(btn);
  }

  stampOptions.appendChild(shapeRow);

  // Size slider
  const sizeGroup = document.createElement("div");
  sizeGroup.className = "param-group";

  const sizeLabel = document.createElement("div");
  sizeLabel.className = "param-label";

  const sizeName = document.createElement("span");
  sizeName.className = "param-name";
  sizeName.textContent = "Stamp Size";

  const sizeValue = document.createElement("span");
  sizeValue.className = "param-value";
  sizeValue.textContent = String(stampSize);

  sizeLabel.append(sizeName, sizeValue);

  const sizeSlider = document.createElement("input");
  sizeSlider.type = "range";
  sizeSlider.min = "4";
  sizeSlider.max = "60";
  sizeSlider.value = String(stampSize);
  sizeSlider.addEventListener("input", () => {
    stampSize = Number(sizeSlider.value);
    sizeValue.textContent = String(stampSize);
  });

  sizeGroup.append(sizeLabel, sizeSlider);
  stampOptions.appendChild(sizeGroup);

  inner.appendChild(stampOptions);

  // Preset buttons
  const presetDiv = document.createElement("div");
  presetDiv.className = "preset-buttons";

  let activeBtn: HTMLButtonElement | null = null;

  for (const preset of PRESETS) {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = preset.label;
    btn.addEventListener("click", () => {
      const mask = preset.generate();
      setMask(mask);
      renderMask();
      if (activeBtn) activeBtn.classList.remove("active");
      btn.classList.add("active");
      activeBtn = btn;
    });
    presetDiv.appendChild(btn);
  }

  inner.appendChild(presetDiv);

  // Tool buttons (clear / invert)
  const tools = document.createElement("div");
  tools.className = "mask-tools";

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "CLEAR";
  clearBtn.addEventListener("click", () => {
    setMask(new Float32Array(N * N));
    renderMask();
    if (activeBtn) activeBtn.classList.remove("active");
    activeBtn = null;
  });

  const invertBtn = document.createElement("button");
  invertBtn.textContent = "INVERT";
  invertBtn.addEventListener("click", () => {
    const mask = getState().mask;
    for (let i = 0; i < N * N; i++) {
      mask[i] = mask[i] > 0 ? 0 : 1;
    }
    setMask(mask);
    renderMask();
  });

  tools.append(clearBtn, invertBtn);
  inner.appendChild(tools);

  // Initial render
  renderMask();

  return {
    setDisplaySize(size: number) {
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
    },
  };
}
