/**
 * Observable application state with rAF-debounced notifications.
 */

import type { PupilParams } from "../simulation/pupil";
import { type ZernikeCoeffs, DEFAULT_ZERNIKE_COEFFS } from "../simulation/zernike";

const N = 256;

export interface AppState {
  mask: Float32Array;
  params: PupilParams;
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

export function resetParams(): void {
  Object.assign(state.params, DEFAULT_PARAMS);
  state.params.zernike = { ...DEFAULT_ZERNIKE_COEFFS };
  scheduleNotify();
}

/** Force an immediate notification (e.g., on initial load). */
export function notifyNow(): void {
  for (const fn of listeners) {
    fn(state);
  }
}
