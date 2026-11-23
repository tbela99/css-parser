import type { DecomposedMatrix3D, Matrix } from "./type.d.ts";
/**
 * the identity matrix. must not be modified
 */
export declare const identityMatrix: Matrix;
/**
 * a new identity matrix
 */
export declare function identity(): Matrix;
/**
 * reset a matrix to the identity matrix
 * @param matrix
 */
export declare function setIdentity(matrix: Matrix): Matrix;
/**
 * true if the values of the matrix are equal (`===`) to the values of the identity matrix
 * @param matrix
 */
export declare function isIdentity(matrix: Matrix): boolean;
/**
 * multiply two matrices into a new matrix
 * @param matrixA
 * @param matrixB
 */
export declare function multiply(matrixA: Matrix, matrixB: Matrix): Matrix;
/**
 * multiply two matrices: `result = matrixA × matrixB`. `result` can be one of the operands
 * @param matrixA
 * @param matrixB
 * @param result
 */
export declare function multiplyInto(matrixA: Matrix, matrixB: Matrix, result: Matrix): Matrix;
/**
 * same value as `+value.toPrecision(6)`, computed without creating a string when the result does not depend on the
 * rounding errors of the computation.
 *
 * `toPrecision(6)` rounds the exact value to the integer `n` (`10^5 <= n < 10^6`) times a power of 10 (`10^-k`),
 * the decimal string is then parsed to the nearest double. `value × 10^k` is computed with an error below `1.2e-10`
 * (`10^k` is exact, the product is correctly rounded): the rounding to `n` is exact unless the product is close to a
 * tie. `n` and `10^k` are exact doubles: `n / 10^k` is the double nearest to the exact quotient, the value of the
 * parsed string. the other cases (ties, very small or very large values, `NaN`, infinite values) use `toPrecision()`
 * @param value
 */
export declare function toPrecision6(value: number): number;
/**
 * round a number to 6 significant digits, or to the nearest integer when it is closer than `epsilon`
 * @param number
 */
export declare function round(number: number): number;
/**
 * decompose a matrix: translate → rotate → skew → scale. the matrix is not modified
 *
 * `translate3d(25.9808px, 0, 15px) rotateY(60deg) skewX(49.9999deg) scale(1, 1.2)`
 * @param original
 * @param result receives the decomposition
 * @returns false if the matrix cannot be decomposed
 */
export declare function decompose(original: Matrix, result: DecomposedMatrix3D): boolean;
/**
 * a value close to 0 (`epsilon`) is set to 0, the other values are rounded to 6 significant digits
 * @param value
 */
export declare function toZeroValue(value: number): number;
/**
 * apply {@link toZeroValue} to the values of a matrix
 * @param matrix
 */
export declare function toZero(matrix: Matrix): Matrix;
export declare function is2DMatrix(matrix: Matrix): boolean;
