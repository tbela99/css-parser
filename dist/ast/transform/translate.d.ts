import type { Matrix } from "./type.d.ts";
export declare function translateX(x: number, from: Matrix): Matrix;
export declare function translateY(y: number, from: Matrix): Matrix;
export declare function translateZ(z: number, from: Matrix): Matrix;
/**
 * @param x
 * @param y 0 if undefined
 * @param from
 */
export declare function translate(x: number, y: number | undefined, from: Matrix): Matrix;
/**
 * @param x
 * @param y NaN if undefined
 * @param z NaN if undefined
 * @param from
 */
export declare function translate3d(x: number, y: number | undefined, z: number | undefined, from: Matrix): Matrix;
