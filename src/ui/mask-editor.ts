/**
 * Canvas 2D mask editor — 256x256 binary grid with mouse painting.
 */

import { getState, setMask } from "../app/state";
import { PRESETS, type PresetName } from "../simulation/mask-presets";

const N = 256;
const CANVAS_SIZE = 256; // display size in px

export function createMaskEditor(container: HTMLElement): void {
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
  canvas.style.width = CANVAS_SIZE + "px";
  canvas.style.height = CANVAS_SIZE + "px";

  wrap.appendChild(canvas);
  inner.appendChild(wrap);

  const ctx = canvas.getContext("2d")!;

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

  function paint(e: MouseEvent): void {
    const [x, y] = getPixel(e);
    const mask = getState().mask;
    // Paint with a small brush (3x3)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < N && py >= 0 && py < N) {
          mask[py * N + px] = paintValue;
        }
      }
    }
    renderMask();
    setMask(mask);
  }

  canvas.addEventListener("mousedown", (e) => {
    painting = true;
    const [x, y] = getPixel(e);
    // Right-click or current pixel is on → erase; otherwise draw
    paintValue = e.button === 2 ? 0 : (getState().mask[y * N + x] > 0 ? 0 : 1);
    paint(e);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (painting) paint(e);
  });

  canvas.addEventListener("mouseup", () => { painting = false; });
  canvas.addEventListener("mouseleave", () => { painting = false; });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

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
}
