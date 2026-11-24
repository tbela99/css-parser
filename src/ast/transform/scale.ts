import { multiplyInto, setIdentity } from "./utils.ts";
import type { Matrix } from "./type.d.ts";

/**
 * the scale matrix. the functions multiply the matrix they receive in place: `from = from × scale`
 */
const matrix: Matrix = new Float64Array(16);

export function scaleX(x: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[0] = x;

    return multiplyInto(from, matrix, from);
}

export function scaleY(y: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[4 + 1] = y;

    return multiplyInto(from, matrix, from);
}

export function scaleZ(z: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[2 * 4 + 2] = z;

    return multiplyInto(from, matrix, from);
}

export function scale(x: number, y: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[0] = x;
    matrix[4 + 1] = y;

    return multiplyInto(from, matrix, from);
}

export function scale3d(x: number, y: number, z: number, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[0] = x;
    matrix[4 + 1] = y;
    matrix[2 * 4 + 2] = z;

    return multiplyInto(from, matrix, from);
}
