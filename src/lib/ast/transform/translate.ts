import {identity, Matrix, multiply} from "./utils.ts";

export function translateX(x: number, from: Matrix): Matrix {

    const matrix = identity();

    matrix[3][0] = x;

    return multiply(from, matrix) as Matrix;
}

export function translateY(y: number, from: Matrix): Matrix {

    const matrix = identity()
    matrix[3][1] = y;

    return multiply(from, matrix) as Matrix;
}

export function translateZ(z: number, from: Matrix): Matrix {

    const matrix = identity();
    matrix[3][2] = z;

    return multiply(from, matrix) as Matrix;
}

export function translate(translate: [number] | [number, number] | [number, number, number], from: Matrix): Matrix {

    const matrix = identity();
    matrix[3][0] = translate[0];
    matrix[3][1] = translate[1] ?? 0;
    matrix[3][2] = translate[2] ?? 0;

    return multiply(from, matrix) as Matrix;
}

export const translate3d = translate;