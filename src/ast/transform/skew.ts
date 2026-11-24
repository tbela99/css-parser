import { multiplyInto, setIdentity } from "./utils.ts";
import type { Matrix } from "./type.d.ts";

/**
 * the skew matrix. the functions multiply the matrix they receive in place: `from = from × skew`. angles in radian
 */
const matrix: Matrix = new Float64Array(16);

export function skewX(x: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[4] = Math.tan(x);

    return multiplyInto(from, matrix, from);
}

export function skewY(y: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[1] = Math.tan(y);

    return multiplyInto(from, matrix, from);
}

/**
 * @param x
 * @param y ignored if undefined
 * @param from
 */
export function skew(x: number, y: number | undefined, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[4] = Math.tan(x);

    if (y !== undefined) {
        matrix[1] = Math.tan(y);
    }

    return multiplyInto(from, matrix, from);
}
