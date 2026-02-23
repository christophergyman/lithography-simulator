/**
 * Parameter slider controls.
 */

import { getState, setParam } from "../app/state";
import type { PupilParams } from "../simulation/pupil";

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
  { key: "sigma", label: "Sigma (σ)", unit: "", min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: "defocus", label: "Defocus", unit: "μm", min: -2, max: 2, step: 0.01, decimals: 2 },
];

export function createSliders(container: HTMLElement): void {
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
    updateDisplay(getState().params[def.key]);

    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      updateDisplay(val);
      setParam(def.key, val);
    });

    group.append(labelRow, input);
    container.appendChild(group);
  }
}
