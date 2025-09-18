import {identity, multiply} from "./utils.ts";
import type {Matrix} from "./type.d.ts";

export function scaleX(x: number, from: Matrix): Matrix {

    const matrix = identity();
    matrix[0] = x;

    return multiply(from, matrix);
}

export function scaleY(y: number, from: Matrix): Matrix {

    const matrix = identity();

    matrix[4 + 1] = y;

    return multiply(from, matrix);
}

export function scaleZ(z: number, from: Matrix): Matrix {

    const matrix = identity();

    matrix[2 * 4 + 2] = z;

    return multiply(from, matrix) as Matrix;
}

export function scale(x: number, y: number, from: Matrix): Matrix {

    const matrix = identity();
    matrix[0] = x;
    matrix[4 + 1] = y;

    return multiply(from, matrix);
}

export function scale3d(x: number, y: number, z: number, from: Matrix): Matrix {

    const matrix = identity();
    matrix[0] = x;
    matrix[4 + 1] = y;
    matrix[2 * 4 + 2] = z;

    return multiply(from, matrix);
}