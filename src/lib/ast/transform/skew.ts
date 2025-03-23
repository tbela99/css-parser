import {identity, Matrix} from "./utils.ts";

export function skewX(x: number): Matrix {

    const matrix: Matrix = identity();

    matrix[2][0] = Math.tan( x * Math.PI / 180);
    return matrix;
}

export function skewY(y: number): Matrix {

    const matrix: Matrix = identity();

    matrix[0][1] = Math.tan( y * Math.PI / 180);
    return matrix;
}

// convert angle to radian
export function skew(x: number, y?: number): Matrix {

    const matrix: Matrix = identity();

    matrix[2][0] = Math.tan( x * Math.PI / 180);

    if (y != null) {

        matrix[0][1] = Math.tan(y * Math.PI / 180);
    }

    return matrix;
}