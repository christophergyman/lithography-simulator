/**
 * Observable application state with rAF-debounced notifications.
 */

import type { PupilParams } from "../simulation/pupil";
import { type ZernikeCoeffs, DEFAULT_ZERNIKE_COEFFS } from "../simulation/zernike";

const N = 256;

export interface ViewParams {
  threshold: number;
  crossSectionRow: number;
}

export const DEFAULT_VIEW_PARAMS: ViewParams = {
  threshold: 0.3,
  crossSectionRow: 128,
};

export interface AppState {
  mask: Float32Array;
  params: PupilParams;
  viewParams: ViewParams;
}

type Listener = (state: AppState) => void;

const listeners: Listener[] = [];
let pendingNotify = false;

export const DEFAULT_PARAMS: PupilParams = {
  wavelength: 248,
  na: 0.75,
  sigma: 0.5,
  defocus: 0,
  zernike: { ...DEFAULT_ZERNIKE_COEFFS },
};

const state: AppState = {
  mask: new Float32Array(N * N),
  params: { ...DEFAULT_PARAMS, zernike: { ...DEFAULT_ZERNIKE_COEFFS } },
  viewParams: { ...DEFAULT_VIEW_PARAMS },
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

export function setZernikeCoeff<K extends keyof ZernikeCoeffs>(key: K, value: number): void {
  state.params.zernike[key] = value;
  scheduleNotify();
}

export function setViewParam<K extends keyof ViewParams>(key: K, value: ViewParams[K]): void {
  state.viewParams[key] = value;
  scheduleNotify();
}

export function resetParams(): void {
  Object.assign(state.params, DEFAULT_PARAMS);
  state.params.zernike = { ...DEFAULT_ZERNIKE_COEFFS };
  Object.assign(state.viewParams, DEFAULT_VIEW_PARAMS);
  scheduleNotify();
}

/** Force an immediate notification (e.g., on initial load). */
export function notifyNow(): void {
  for (const fn of listeners) {
    fn(state);
  }
}
