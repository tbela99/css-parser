import type {Matrix} from "./utils.ts";
import {identity, multiply} from "./utils.ts";

/**
 * angle in radian
 * @param angle
 * @param x
 * @param y
 * @param z
 * @param from
 */
export function rotate3D(angle: number, x: number, y: number, z: number, from: Matrix): Matrix {

    const matrix: Matrix = identity();
    const sc: number = Math.sin(angle / 2) * Math.cos(angle / 2);
    const sq: number = Math.sin(angle / 2) * Math.sin(angle / 2);

    const norm: number = Math.sqrt(x * x + y * y + z * z);
    const unit: number = norm === 0 ? 0 : 1 / norm;

    x *= unit;
    y *= unit;
    z *= unit;

    matrix[0* 4 +0] = 1 - 2 * (y * y + z * z) * sq;
    matrix[0* 4 +1] = 2 * (x * y * sq + z * sc);
    matrix[0* 4 +2] = 2 * (x * z * sq - y * sc);

    matrix[1* 4 +0] = 2 * (x * y * sq - z * sc);
    matrix[1* 4 +1] = 1 - 2 * (x * x + z * z) * sq;
    matrix[1* 4 +2] = 2 * (y * z * sq + x * sc);

    matrix[2* 4 +0] = 2 * (x * z * sq + y * sc);
    matrix[2* 4 +1] = 2 * (y * z * sq - x * sc);
    matrix[2* 4 +2] = 1 - 2 * (x * x + y * y) * sq;

    return multiply(from, matrix);
}

export function rotate(angle: number, from: Matrix): Matrix {

    const matrix: Matrix = identity();
    matrix[0* 4 +0] = Math.cos(angle);
    matrix[0* 4 +1] = Math.sin(angle);
    matrix[1* 4 +0] = -Math.sin(angle);
    matrix[1* 4 +1] = Math.cos(angle);

    return multiply(from, matrix);
}

export const rotateZ = rotate;