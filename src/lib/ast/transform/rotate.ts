import { multiplyInto, setIdentity } from "./utils.ts";
import type { Matrix } from "./type.d.ts";

/**
 * the rotation matrix. the functions multiply the matrix they receive in place: `from = from × rotation`
 */
const matrix: Matrix = new Float64Array(16);

/**
 * angle in radian
 * @param angle
 * @param x
 * @param y
 * @param z
 * @param from
 */
export function rotate3D(angle: number, x: number, y: number, z: number, from: Matrix): Matrix {
    setIdentity(matrix);

    const sc: number = Math.sin(angle / 2) * Math.cos(angle / 2);
    const sq: number = Math.sin(angle / 2) * Math.sin(angle / 2);

    const norm: number = Math.sqrt(x * x + y * y + z * z);
    const unit: number = norm === 0 ? 0 : 1 / norm;

    x *= unit;
    y *= unit;
    z *= unit;

    matrix[0] = 1 - 2 * (y * y + z * z) * sq;
    matrix[1] = 2 * (x * y * sq + z * sc);
    matrix[2] = 2 * (x * z * sq - y * sc);

    matrix[4] = 2 * (x * y * sq - z * sc);
    matrix[4 + 1] = 1 - 2 * (x * x + z * z) * sq;
    matrix[4 + 2] = 2 * (y * z * sq + x * sc);

    matrix[2 * 4] = 2 * (x * z * sq + y * sc);
    matrix[2 * 4 + 1] = 2 * (y * z * sq - x * sc);
    matrix[2 * 4 + 2] = 1 - 2 * (x * x + y * y) * sq;

    return multiplyInto(from, matrix, from);
}

/**
 * angle in radian
 * @param angle
 * @param from
 */
export function rotate(angle: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[0] = Math.cos(angle);
    matrix[1] = Math.sin(angle);
    matrix[4] = -Math.sin(angle);
    matrix[4 + 1] = Math.cos(angle);

    return multiplyInto(from, matrix, from);
}

export const rotateZ = rotate;
