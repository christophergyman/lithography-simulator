/**
 * Observable application state with rAF-debounced notifications.
 */

import type { PupilParams } from "../simulation/pupil";

const N = 256;

export interface AppState {
  mask: Float32Array;
  params: PupilParams;
}

type Listener = (state: AppState) => void;

const listeners: Listener[] = [];
let pendingNotify = false;

const state: AppState = {
  mask: new Float32Array(N * N),
  params: {
    wavelength: 248,
    na: 0.75,
    sigma: 0.5,
    defocus: 0,
  },
};

function scheduleNotify(): void {
  if (pendingNotify) return;
  pendingNotify = true;
  requestAnimationFrame(() => {
    pendingNotify = false;
    for (const fn of listeners) {
      fn(state);
    }
  });
}

export function getState(): AppState {
  return state;
}

export function subscribe(fn: Listener): void {
  listeners.push(fn);
}

export function setMask(mask: Float32Array): void {
  state.mask = mask;
  scheduleNotify();
}

export function setParam<K extends keyof PupilParams>(key: K, value: PupilParams[K]): void {
  state.params[key] = value;
  scheduleNotify();
}

/** Force an immediate notification (e.g., on initial load). */
export function notifyNow(): void {
  for (const fn of listeners) {
    fn(state);
  }
}
