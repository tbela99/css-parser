import { multiplyInto, setIdentity } from "./utils.ts";
import type { Matrix } from "./type.d.ts";

/**
 * the translation matrix. the functions multiply the matrix they receive in place: `from = from × translation`
 */
const matrix: Matrix = new Float64Array(16);

export function translateX(x: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[3 * 4] = x;

    return multiplyInto(from, matrix, from);
}

export function translateY(y: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[3 * 4 + 1] = y;

    return multiplyInto(from, matrix, from);
}

export function translateZ(z: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[3 * 4 + 2] = z;

    return multiplyInto(from, matrix, from);
}

/**
 * @param x
 * @param y 0 if undefined
 * @param from
 */
export function translate(x: number, y: number | undefined, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[3 * 4] = x;
    matrix[3 * 4 + 1] = y ?? 0;

    return multiplyInto(from, matrix, from);
}

/**
 * @param x
 * @param y NaN if undefined
 * @param z NaN if undefined
 * @param from
 */
export function translate3d(x: number, y: number | undefined, z: number | undefined, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[3 * 4] = x;
    // @ts-ignore undefined is stored as NaN
    matrix[3 * 4 + 1] = y;
    // @ts-ignore undefined is stored as NaN
    matrix[3 * 4 + 2] = z;

    return multiplyInto(from, matrix, from);
}
