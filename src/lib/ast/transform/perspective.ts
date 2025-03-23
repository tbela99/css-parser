import {identity, Matrix} from "./utils.ts";

export function perspective(z: number): Matrix {

    const matrix: Matrix = identity();
    matrix[2][3] = -1 / z;

    return matrix;
}