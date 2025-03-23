import {identity, Matrix} from "./utils.ts";

export function scaleX(x: number): Matrix {


    const matrix: Matrix = identity();

    matrix[0][0] = x;

    return matrix;
}

export function scaleY(y: number): Matrix {

    const matrix: Matrix = identity();

    matrix[1][1] = y;

    return matrix;
}

export function scaleZ(z: number): Matrix {

    const matrix: Matrix = identity();

    matrix[2][2] = z;

    return matrix;
}

export function scale(x: number, y?: number): Matrix {

    const matrix: Matrix = identity();

    matrix[0][0] = x;
    matrix[1][1] = y ?? x;

    return matrix;
}