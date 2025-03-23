import {Matrix} from "./utils.ts";

/**
 * angle in radian
 * @param angle
 * @param x
 * @param y
 * @param z
 * @param matrix
 */
export function rotate3D(angle: number, x: number, y: number, z: number, matrix:Matrix): Matrix {

    const sc: number= Math.sin(angle/2)*Math.cos(angle/2);
    const sq: number = Math.sin(angle/2) * Math.sin(angle/2);

    const norm: number = Math.sqrt(x * x + y * y + z * z);
    const unit: number = norm === 0 ? 0 : 1 / norm;

    x *= unit;
    y *= unit;
    z *= unit;

    matrix[0][0] = 1 - 2 * (y*y + z*z) * sq;
    matrix[0][1] = 2 * (x * y * sq - z*sc);
    matrix[0][2] = 2 * (x*z*sq + y*sc);

    matrix[1][0] = 2 * (x*y*sq + z*sc);
    matrix[1][1] = 1 - 2 * (x*x + z*z) * sq;
    matrix[1][2] = 2 * (y*z*sq - x*sc);

    matrix[2][0] = 2 * (x*z*sq - y*sc);
    matrix[2][1] = 2 * (y*z*sq + x*sc);
    matrix[2][2] = 1 - 2 * (x*x + y*y) * sq;

    return matrix;
}

// export function rotateX(x: number): Matrix {
//
//    const  matrix: Matrix = identity();
//
//     const angle: number = x * Math.PI / 180;
//
//     matrix[1][1] = Math.cos(angle);
//     matrix[1][2] = Math.sin(angle);
//     matrix[0][2] = -1;
//
//     return matrix;
// }
//
// export function rotateY(y: number): Matrix {
//
//     const matrix: Matrix = identity();
//
//     const angle: number = y * Math.PI / 180;
//     matrix[0][0] = matrix[2][2] = Math.cos(angle);
//     matrix[0][1] = matrix[2][0] = Math.sin(angle);
//     matrix[0][2] = -1;
//
//     return matrix;
// }
//
// export function rotateZ(z: number): Matrix {
//
//     const matrix: Matrix = identity();
//
//     const angle: number = z * Math.PI / 180;
//     matrix[0][0] = matrix[1][1] = Math.cos(angle);
//     matrix[0][1] = matrix[1][0] = -Math.sin(angle);
//     matrix[2][0] = -1;
//
//     return matrix;
// }
//
// export const rotate = rotateZ;