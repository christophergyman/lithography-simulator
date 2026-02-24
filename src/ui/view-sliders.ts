/**
 * View parameter slider controls for resist threshold and cross-section row.
 */

import { getState, setViewParam, DEFAULT_VIEW_PARAMS } from "../app/state";
import type { ViewParams } from "../app/state";

interface ViewSliderDef {
  key: keyof ViewParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
  tooltip: string;
}

const VIEW_SLIDERS: ViewSliderDef[] = [
  { key: "threshold", label: "Resist Threshold", unit: "", min: 0, max: 1, step: 0.01, decimals: 2, tooltip: "The cutoff that decides what prints and what doesn\u2019t \u2014 like a pass/fail grade for light intensity." },
  { key: "crossSectionRow", label: "Cross-Section Row", unit: "px", min: 0, max: 255, step: 1, decimals: 0, tooltip: "Which horizontal slice to show in the graph below \u2014 like choosing where to cut through a cake to see inside." },
];

export function createViewSliders(container: HTMLElement): { syncFromState: () => void } {
  const sliderRefs: { def: ViewSliderDef; input: HTMLInputElement; updateDisplay: (val: number) => void }[] = [];

  const title = document.createElement("div");
  title.className = "panel-title";
  title.style.padding = "8px 0 4px";
  title.style.border = "none";
  title.textContent = "Resist / Cross-Section";
  container.appendChild(title);

  for (const def of VIEW_SLIDERS) {
    const group = document.createElement("div");
    group.className = "param-group";
    group.dataset.tooltip = def.tooltip;

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
    input.value = String(getState().viewParams[def.key]);

    const updateDisplay = (val: number) => {
      valueSpan.textContent = val.toFixed(def.decimals);
    };
    updateDisplay(getState().viewParams[def.key]);

    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      updateDisplay(val);
      setViewParam(def.key, val);
    });

    group.append(labelRow, input);
    container.appendChild(group);
    sliderRefs.push({ def, input, updateDisplay });
  }

  return {
    syncFromState() {
      for (const { def, input, updateDisplay } of sliderRefs) {
        const val = getState().viewParams[def.key];
        input.value = String(val);
        updateDisplay(val);
      }
    },
  };
}
