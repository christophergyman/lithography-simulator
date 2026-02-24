/**
 * Parameter slider controls — optical params + Zernike aberrations.
 */

import { getState, setParam, setZernikeCoeff, resetParams, DEFAULT_PARAMS } from "../app/state";
import type { PupilParams } from "../simulation/pupil";
import { type ZernikeCoeffs, DEFAULT_ZERNIKE_COEFFS } from "../simulation/zernike";

interface SliderDef {
  key: keyof PupilParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
}

const SLIDERS: SliderDef[] = [
  { key: "wavelength", label: "Wavelength", unit: "nm", min: 193, max: 365, step: 1, decimals: 0 },
  { key: "na", label: "NA", unit: "", min: 0.1, max: 1.4, step: 0.01, decimals: 2 },
  { key: "sigma", label: "Sigma (\u03c3)", unit: "", min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: "defocus", label: "Defocus", unit: "\u03bcm", min: -2, max: 2, step: 0.01, decimals: 2 },
];

interface ZernikeSliderDef {
  key: keyof ZernikeCoeffs;
  label: string;
  noll: number;
}

const ZERNIKE_SLIDERS: ZernikeSliderDef[] = [
  { key: "z4",  label: "Defocus",      noll: 4 },
  { key: "z5",  label: "Oblq Astig",   noll: 5 },
  { key: "z6",  label: "Vert Astig",   noll: 6 },
  { key: "z7",  label: "Vert Coma",    noll: 7 },
  { key: "z8",  label: "Horz Coma",    noll: 8 },
  { key: "z9",  label: "Spherical",    noll: 9 },
  { key: "z10", label: "Oblq Trefoil", noll: 10 },
  { key: "z11", label: "Vert Trefoil", noll: 11 },
];

export function createSliders(container: HTMLElement): void {
  const sliderRefs: { def: SliderDef; input: HTMLInputElement; updateDisplay: (val: number) => void }[] = [];

  for (const def of SLIDERS) {
    const group = document.createElement("div");
    group.className = "param-group";

    const labelRow = document.createElement("div");
    labelRow.className = "param-label";

    const nameSpan = document.createElement("span");
    nameSpan.className = "param-name";
    nameSpan.textContent = def.label;

    const valueWrap = document.createElement("span");
    const valueSpan = document.createElement("span");
    valueSpan.className = "param-value";

    const unitSpan = document.createElement("span");
    unitSpan.className = "param-unit";
    unitSpan.textContent = def.unit;

    valueWrap.append(valueSpan, unitSpan);
    labelRow.append(nameSpan, valueWrap);

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(def.min);
    input.max = String(def.max);
    input.step = String(def.step);
    input.value = String(getState().params[def.key]);

    const updateDisplay = (val: number) => {
      valueSpan.textContent = val.toFixed(def.decimals);
    };
    updateDisplay(getState().params[def.key] as number);

    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      updateDisplay(val);
      setParam(def.key, val as never);
    });

    group.append(labelRow, input);
    container.appendChild(group);
    sliderRefs.push({ def, input, updateDisplay });
  }

  // --- Aberrations section (collapsible) ---
  const aberrationSection = document.createElement("div");
  aberrationSection.className = "aberration-section";

  const aberrationHeader = document.createElement("button");
  aberrationHeader.className = "aberration-toggle";
  aberrationHeader.innerHTML = '<span class="aberration-arrow">\u25b6</span> Aberrations (Zernike)';
  let aberrationsOpen = false;

  const aberrationBody = document.createElement("div");
  aberrationBody.className = "aberration-body";
  aberrationBody.style.display = "none";

  const zernikeRefs: { def: ZernikeSliderDef; input: HTMLInputElement; updateDisplay: (val: number) => void }[] = [];

  for (const def of ZERNIKE_SLIDERS) {
    const group = document.createElement("div");
    group.className = "param-group zernike-group";

    const labelRow = document.createElement("div");
    labelRow.className = "param-label";

    const nameSpan = document.createElement("span");
    nameSpan.className = "param-name";
    nameSpan.textContent = `Z${def.noll} ${def.label}`;

    const valueWrap = document.createElement("span");
    const valueSpan = document.createElement("span");
    valueSpan.className = "param-value";

    const unitSpan = document.createElement("span");
    unitSpan.className = "param-unit";
    unitSpan.textContent = "\u03bb";

    valueWrap.append(valueSpan, unitSpan);
    labelRow.append(nameSpan, valueWrap);

    const input = document.createElement("input");
    input.type = "range";
    input.min = "-1";
    input.max = "1";
    input.step = "0.01";
    input.value = String(getState().params.zernike[def.key]);

    const updateDisplay = (val: number) => {
      valueSpan.textContent = val.toFixed(2);
    };
    updateDisplay(getState().params.zernike[def.key]);

    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      updateDisplay(val);
      setZernikeCoeff(def.key, val);
    });

    group.append(labelRow, input);
    aberrationBody.appendChild(group);
    zernikeRefs.push({ def, input, updateDisplay });
  }

  aberrationHeader.addEventListener("click", () => {
    aberrationsOpen = !aberrationsOpen;
    aberrationBody.style.display = aberrationsOpen ? "block" : "none";
    const arrow = aberrationHeader.querySelector(".aberration-arrow")!;
    arrow.textContent = aberrationsOpen ? "\u25bc" : "\u25b6";
  });

  aberrationSection.append(aberrationHeader, aberrationBody);
  container.appendChild(aberrationSection);

  // Reset button (after aberrations section)
  const resetBtn = document.createElement("button");
  resetBtn.className = "reset-params-btn";
  resetBtn.textContent = "Reset Defaults";
  resetBtn.addEventListener("click", () => {
    resetParams();
    for (const { def, input, updateDisplay } of sliderRefs) {
      const val = DEFAULT_PARAMS[def.key] as number;
      input.value = String(val);
      updateDisplay(val);
    }
    for (const { def, input, updateDisplay } of zernikeRefs) {
      const val = DEFAULT_ZERNIKE_COEFFS[def.key];
      input.value = String(val);
      updateDisplay(val);
    }
  });
  container.appendChild(resetBtn);
}
