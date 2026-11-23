import type { Matrix } from "./type.d.ts";
export declare function skewX(x: number, from: Matrix): Matrix;
export declare function skewY(y: number, from: Matrix): Matrix;
/**
 * @param x
 * @param y ignored if undefined
 * @param from
 */
export declare function skew(x: number, y: number | undefined, from: Matrix): Matrix;
