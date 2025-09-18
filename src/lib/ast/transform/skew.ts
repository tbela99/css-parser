import {identity, multiply} from "./utils.ts";
import type {Matrix} from "./type.d.ts";

export function skewX(x: number, from: Matrix): Matrix {

    const matrix: Matrix = identity();

    matrix[4] = Math.tan(x);

    return multiply(from, matrix);
}

export function skewY(y: number, from: Matrix): Matrix {

    const matrix: Matrix = identity();

    matrix[1] = Math.tan(y);
    return multiply(from, matrix);
}

// convert angle to radian
export function skew(values: [number] | [number, number], from: Matrix): Matrix {

    const matrix: Matrix = identity();

    matrix[4] = Math.tan(values[0]);

    if (values.length > 1) {

        matrix[1] = Math.tan(values[1]!);
    }

    return multiply(from, matrix);
}