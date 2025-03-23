import {Matrix} from "./utils.ts";

export function translateX(x: number, matrix: Matrix): Matrix {

    matrix[3][0] = x;

    return matrix;
}

export function translateY(y: number, matrix: Matrix): Matrix {

    matrix[3][1] = y;

    return matrix;
}

export function translateZ(z: number, matrix: Matrix): Matrix {

    matrix[3][2] = z;

    return matrix;
}

export function translate(translate: [number] | [number, number] | [number, number, number], matrix: Matrix): Matrix {

    matrix[3][0] = translate[0];
    matrix[3][1] = translate[1] ?? 0;
    matrix[3][2] = translate[2] ?? 0;

    return matrix;
}

export const translate3d = translate;