import type { Matrix } from "./type.d.ts";
/**
 * angle in radian
 * @param angle
 * @param x
 * @param y
 * @param z
 * @param from
 */
export declare function rotate3D(angle: number, x: number, y: number, z: number, from: Matrix): Matrix;
export declare function rotate(angle: number, from: Matrix): Matrix;
export declare const rotateZ: typeof rotate;
