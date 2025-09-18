import {identity, multiply} from "./utils.ts";
import type {Matrix} from "./type.d.ts";

export function translateX(x: number, from: Matrix): Matrix {

    const matrix: Matrix = identity();

    matrix[3 * 4] = x;

    return multiply(from, matrix) as Matrix;
}

export function translateY(y: number, from: Matrix): Matrix {

    const matrix: Matrix = identity();
    matrix[3 * 4 + 1] = y;

    return multiply(from, matrix) as Matrix;
}

export function translateZ(z: number, from: Matrix): Matrix {

    const matrix: Matrix = identity();
    matrix[3 * 4 + 2] = z;

    return multiply(from, matrix) as Matrix;
}

export function translate(translate: [number] | [number, number], from: Matrix): Matrix {

    const matrix: Matrix = identity();
    matrix[3 * 4] = translate[0];
    matrix[3 * 4 + 1] = translate[1] ?? 0;

    return multiply(from, matrix) as Matrix;
}

export function translate3d(translate: [number, number, number], from: Matrix): Matrix {

    const matrix: Matrix = identity();
    matrix[3 * 4] = translate[0];
    matrix[3 * 4 + 1] = translate[1];
    matrix[3 * 4 + 2] = translate[2];

    return multiply(from, matrix) as Matrix;
}

