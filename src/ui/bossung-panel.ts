/**
 * Bossung analysis controls — sweep configuration and run button.
 */

import type { BossungParams } from "../simulation/bossung";

interface SliderDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
  defaultValue: number;
}

const SLIDERS: SliderDef[] = [
  { key: "focusSteps", label: "Focus Steps", unit: "", min: 5, max: 21, step: 2, decimals: 0, defaultValue: 11 },
  { key: "doseMin", label: "Dose Min", unit: "", min: 0.5, max: 1.5, step: 0.05, decimals: 2, defaultValue: 0.7 },
  { key: "doseMax", label: "Dose Max", unit: "", min: 0.5, max: 1.5, step: 0.05, decimals: 2, defaultValue: 1.3 },
  { key: "doseSteps", label: "Dose Steps", unit: "", min: 3, max: 9, step: 1, decimals: 0, defaultValue: 7 },
];

export interface BossungControlsHandle {
  /** Update the timing display after a sweep completes. */
  setTiming(timeMs: number, runs: number): void;
  /** Re-enable the run button (called after sweep finishes). */
  setRunning(running: boolean): void;
  /** Programmatically trigger a Bossung run. */
  run(): void;
}

export function createBossungControls(
  container: HTMLElement,
  onRun: (params: BossungParams) => void,
): BossungControlsHandle {
  // Section wrapper
  const section = document.createElement("div");
  section.className = "bossung-section";

  // Section title
  const title = document.createElement("div");
  title.className = "panel-title";
  title.style.padding = "0 0 8px";
  title.style.border = "none";
  title.textContent = "Process Window";
  section.appendChild(title);

  // Focus range info (read-only)
  const focusInfo = document.createElement("div");
  focusInfo.className = "param-label";
  focusInfo.style.marginBottom = "8px";
  const focusName = document.createElement("span");
  focusName.className = "param-name";
  focusName.textContent = "Focus Range";
  const focusVal = document.createElement("span");
  focusVal.innerHTML = '<span class="param-value">-2.0</span> to <span class="param-value">+2.0</span> <span class="param-unit">\u03bcm</span>';
  focusInfo.append(focusName, focusVal);
  section.appendChild(focusInfo);

  // Slider values map
  const values: Record<string, number> = {};
  for (const def of SLIDERS) {
    values[def.key] = def.defaultValue;
  }

  // Create sliders
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
    valueSpan.textContent = def.defaultValue.toFixed(def.decimals);

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
    input.value = String(def.defaultValue);

    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      values[def.key] = val;
      valueSpan.textContent = val.toFixed(def.decimals);
    });

    group.append(labelRow, input);
    section.appendChild(group);
  }

  // Run button
  const runBtn = document.createElement("button");
  runBtn.className = "bossung-run-btn";
  runBtn.textContent = "Run Bossung Analysis";

  runBtn.addEventListener("click", () => {
    const params: BossungParams = {
      focusRange: [-2, 2],
      focusSteps: values.focusSteps,
      doseRange: [values.doseMin, values.doseMax],
      doseSteps: values.doseSteps,
    };
    onRun(params);
  });

  section.appendChild(runBtn);

  // Timing readout
  const timing = document.createElement("div");
  timing.className = "bossung-timing";
  timing.innerHTML = 'Sweep: <span class="value">--</span> ms (<span class="value bossung-runs">--</span> runs)';
  section.appendChild(timing);

  container.appendChild(section);

  const timeValue = timing.querySelector(".value") as HTMLSpanElement;
  const runsValue = timing.querySelector(".bossung-runs") as HTMLSpanElement;

  return {
    setTiming(timeMs: number, runs: number) {
      timeValue.textContent = timeMs.toFixed(1);
      runsValue.textContent = String(runs);
    },
    setRunning(running: boolean) {
      runBtn.disabled = running;
      runBtn.textContent = running ? "Running\u2026" : "Run Bossung Analysis";
    },
    run() {
      runBtn.click();
    },
  };
}
