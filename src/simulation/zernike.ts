/**
 * Zernike polynomial evaluation (Noll indexing, Z4–Z11).
 *
 * Each function takes normalized polar coordinates (rho in [0,1], theta in [0,2pi])
 * and returns the polynomial value.
 */

export interface ZernikeCoeffs {
  z4: number;
  z5: number;
  z6: number;
  z7: number;
  z8: number;
  z9: number;
  z10: number;
  z11: number;
}

export const DEFAULT_ZERNIKE_COEFFS: ZernikeCoeffs = {
  z4: 0, z5: 0, z6: 0, z7: 0,
  z8: 0, z9: 0, z10: 0, z11: 0,
};

// Pre-computed normalization constants
const SQRT3 = 1.7320508075688772;
const SQRT5 = 2.23606797749979;
const SQRT6 = 2.449489742783178;
const SQRT8 = 2.8284271247461903;

/** Z4: Defocus — sqrt(3) * (2*rho^2 - 1) */
function z4(rho: number): number {
  return SQRT3 * (2 * rho * rho - 1);
}

/** Z5: Oblique astigmatism — sqrt(6) * rho^2 * sin(2*theta) */
function z5(rho: number, theta: number): number {
  return SQRT6 * rho * rho * Math.sin(2 * theta);
}

/** Z6: Vertical astigmatism — sqrt(6) * rho^2 * cos(2*theta) */
function z6(rho: number, theta: number): number {
  return SQRT6 * rho * rho * Math.cos(2 * theta);
}

/** Z7: Vertical coma — sqrt(8) * (3*rho^3 - 2*rho) * sin(theta) */
function z7(rho: number, theta: number): number {
  return SQRT8 * (3 * rho * rho * rho - 2 * rho) * Math.sin(theta);
}

/** Z8: Horizontal coma — sqrt(8) * (3*rho^3 - 2*rho) * cos(theta) */
function z8(rho: number, theta: number): number {
  return SQRT8 * (3 * rho * rho * rho - 2 * rho) * Math.cos(theta);
}

/** Z9: Spherical aberration — sqrt(5) * (6*rho^4 - 6*rho^2 + 1) */
function z9(rho: number): number {
  const r2 = rho * rho;
  return SQRT5 * (6 * r2 * r2 - 6 * r2 + 1);
}

/** Z10: Oblique trefoil — sqrt(8) * rho^3 * sin(3*theta) */
function z10(rho: number, theta: number): number {
  return SQRT8 * rho * rho * rho * Math.sin(3 * theta);
}

/** Z11: Vertical trefoil — sqrt(8) * rho^3 * cos(3*theta) */
function z11(rho: number, theta: number): number {
  return SQRT8 * rho * rho * rho * Math.cos(3 * theta);
}

/**
 * Evaluate the total Zernike phase error at a given (rho, theta) point.
 * Coefficients are in waves (lambda units).
 * Returns the phase error in waves.
 */
export function zernikePhaseError(
  rho: number,
  theta: number,
  coeffs: ZernikeCoeffs,
): number {
  let phase = 0;
  if (coeffs.z4 !== 0) phase += coeffs.z4 * z4(rho);
  if (coeffs.z5 !== 0) phase += coeffs.z5 * z5(rho, theta);
  if (coeffs.z6 !== 0) phase += coeffs.z6 * z6(rho, theta);
  if (coeffs.z7 !== 0) phase += coeffs.z7 * z7(rho, theta);
  if (coeffs.z8 !== 0) phase += coeffs.z8 * z8(rho, theta);
  if (coeffs.z9 !== 0) phase += coeffs.z9 * z9(rho);
  if (coeffs.z10 !== 0) phase += coeffs.z10 * z10(rho, theta);
  if (coeffs.z11 !== 0) phase += coeffs.z11 * z11(rho, theta);
  return phase;
}
