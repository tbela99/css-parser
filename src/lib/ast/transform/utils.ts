/**
 * Matrix operations of the transform functions. The matrices are `Float64Array(16)` in column-major order.
 *
 * The operations write into matrices provided by the caller (no allocation): the computation of a transform list uses
 * a few module level scratch matrices. The arithmetic is performed in the same order as the textbook formulas, the
 * results do not depend on the buffers used.
 *
 * @module
 * @internal
 */
import { epsilon } from "../../syntax/constants.ts";
import type { DecomposedMatrix3D, Matrix } from "./type.d.ts";

/**
 * the identity matrix. must not be modified
 */
export const identityMatrix: Matrix = new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/**
 * a new identity matrix
 */
export function identity(): Matrix {
    return identityMatrix.slice() as Matrix;
}

/**
 * reset a matrix to the identity matrix
 * @param matrix
 */
export function setIdentity(matrix: Matrix): Matrix {
    matrix.set(identityMatrix);
    return matrix;
}

/**
 * true if the values of the matrix are equal (`===`) to the values of the identity matrix
 * @param matrix
 */
export function isIdentity(matrix: Matrix): boolean {
    return (
        matrix[0] === 1 &&
        matrix[1] === 0 &&
        matrix[2] === 0 &&
        matrix[3] === 0 &&
        matrix[4] === 0 &&
        matrix[5] === 1 &&
        matrix[6] === 0 &&
        matrix[7] === 0 &&
        matrix[8] === 0 &&
        matrix[9] === 0 &&
        matrix[10] === 1 &&
        matrix[11] === 0 &&
        matrix[12] === 0 &&
        matrix[13] === 0 &&
        matrix[14] === 0 &&
        matrix[15] === 1
    );
}

/**
 * multiply two matrices into a new matrix
 * @param matrixA
 * @param matrixB
 */
export function multiply(matrixA: Matrix, matrixB: Matrix): Matrix {
    return multiplyInto(matrixA, matrixB, new Float64Array(16));
}

/**
 * multiply two matrices: `result = matrixA × matrixB`. `result` can be one of the operands
 * @param matrixA
 * @param matrixB
 * @param result
 */
export function multiplyInto(matrixA: Matrix, matrixB: Matrix, result: Matrix): Matrix {
    const a0: number = matrixA[0];
    const a1: number = matrixA[1];
    const a2: number = matrixA[2];
    const a3: number = matrixA[3];
    const a4: number = matrixA[4];
    const a5: number = matrixA[5];
    const a6: number = matrixA[6];
    const a7: number = matrixA[7];
    const a8: number = matrixA[8];
    const a9: number = matrixA[9];
    const a10: number = matrixA[10];
    const a11: number = matrixA[11];
    const a12: number = matrixA[12];
    const a13: number = matrixA[13];
    const a14: number = matrixA[14];
    const a15: number = matrixA[15];

    for (let column = 0; column < 16; column += 4) {
        const b0: number = matrixB[column];
        const b1: number = matrixB[column + 1];
        const b2: number = matrixB[column + 2];
        const b3: number = matrixB[column + 3];

        result[column] = a0 * b0 + a4 * b1 + a8 * b2 + a12 * b3;
        result[column + 1] = a1 * b0 + a5 * b1 + a9 * b2 + a13 * b3;
        result[column + 2] = a2 * b0 + a6 * b1 + a10 * b2 + a14 * b3;
        result[column + 3] = a3 * b0 + a7 * b1 + a11 * b2 + a15 * b3;
    }

    return result;
}

/**
 * augmented matrix of {@link inverse}
 */
const augmented: Float64Array = new Float64Array(32);

/**
 * inverse of a matrix, used to extract the perspective. the result is a shared buffer (its first 16 values), valid
 * until the next call
 * @param matrix
 */
function inverse(matrix: Matrix): Float64Array | null {
    // Create augmented matrix [matrix | identity]
    for (let row = 0; row < 4; row++) {
        for (let j = 0; j < 4; j++) {
            augmented[row * 8 + j] = matrix[row * 4 + j];
            augmented[row * 8 + 4 + j] = row === j ? 1 : 0;
        }
    }

    // Gaussian elimination with partial pivoting
    for (let col = 0; col < 4; col++) {
        // Find pivot row with maximum absolute value
        let maxRow: number = col;
        let maxVal: number = Math.abs(augmented[col * 4 + col]);

        for (let row = col + 1; row < 4; row++) {
            const val: number = Math.abs(augmented[row * 4 + col]);

            if (val > maxVal) {
                maxVal = val;
                maxRow = row;
            }
        }

        // Check for singularity
        if (maxVal < epsilon) {
            return null;
        }

        // Swap rows if necessary
        if (maxRow !== col) {
            const swap: number = augmented[col];

            augmented[col] = augmented[maxRow];
            augmented[maxRow] = swap;
        }

        // Scale pivot row to make pivot element 1
        const pivot: number = augmented[col * 4 + col];

        for (let j = 0; j < 8; j++) {
            augmented[col * 4 + j] /= pivot;
        }

        // Eliminate column in other rows
        for (let row = 0; row < 4; row++) {
            if (row !== col) {
                const factor: number = augmented[row * 4 + col];

                for (let j = 0; j < 8; j++) {
                    augmented[row * 4 + j] -= factor * augmented[col * 4 + j];
                }
            }
        }
    }

    // the inverse is read from the first 16 values
    return augmented;
}

/**
 * the powers of 10 that are exactly represented by a double
 */
const powersOf10: Float64Array = new Float64Array(23).map((_: number, i: number): number => Number("1e" + i));

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
export function toPrecision6(value: number): number {
    const abs: number = value < 0 ? -value : value;

    if (abs >= 1e-15 && abs < 1e21) {
        const k: number = 5 - Math.floor(Math.log10(abs));
        const scaled: number = k >= 0 ? abs * powersOf10[k] : abs / powersOf10[-k];

        // the exponent computed from the logarithm is exact
        if (scaled >= 1e5 && scaled < 999999.5) {
            let n: number = Math.floor(scaled);
            const fraction: number = scaled - n;

            // not close to a tie
            if (fraction < 0.499999 || fraction > 0.500001) {
                if (fraction > 0.5) {
                    n++;
                }

                const result: number = k >= 0 ? n / powersOf10[k] : n * powersOf10[-k];

                return value < 0 ? -result : result;
            }
        }
    }

    return +value.toPrecision(6);
}

/**
 * round a number to 6 significant digits, or to the nearest integer when it is closer than `epsilon`
 * @param number
 */
export function round(number: number): number {
    const rounded: number = Math.round(number);
    return Math.abs(rounded - number) <= epsilon ? rounded : toPrecision6(number);
}

/**
 * working copy of the matrix being decomposed
 */
const decomposeBuffer: Matrix = new Float64Array(16);

/**
 * decompose a matrix: translate → rotate → skew → scale. the matrix is not modified
 *
 * `translate3d(25.9808px, 0, 15px) rotateY(60deg) skewX(49.9999deg) scale(1, 1.2)`
 * @param original
 * @param result receives the decomposition
 * @returns false if the matrix cannot be decomposed
 */
export function decompose(original: Matrix, result: DecomposedMatrix3D): boolean {
    const matrix: Matrix = decomposeBuffer;

    // Normalize last row
    if (original[15] === 0) {
        return false;
    }

    matrix.set(original);

    for (let i = 0; i < 16; i++) matrix[i] /= matrix[15];

    // Perspective extraction
    result.perspectiveX = 0;
    result.perspectiveY = 0;
    result.perspectiveZ = 0;
    result.perspectiveW = 1;

    if (matrix[3] !== 0 || matrix[7] !== 0 || matrix[11] !== 0) {
        const r0: number = matrix[3];
        const r1: number = matrix[7];
        const r2: number = matrix[11];
        const r3: number = matrix[15];
        const inverted: Float64Array | null = inverse(original);

        if (inverted === null) {
            return false;
        }

        // dot product of the right hand side and of the rows of the transposed inverse
        result.perspectiveX = r0 * inverted[0] + r1 * inverted[4] + r2 * inverted[8] + r3 * inverted[12];
        result.perspectiveY = r0 * inverted[1] + r1 * inverted[5] + r2 * inverted[9] + r3 * inverted[13];
        result.perspectiveZ = r0 * inverted[2] + r1 * inverted[6] + r2 * inverted[10] + r3 * inverted[14];
        result.perspectiveW = r0 * inverted[3] + r1 * inverted[7] + r2 * inverted[11] + r3 * inverted[15];

        // Clear perspective from matrix
        matrix[3] = 0;
        matrix[7] = 0;
        matrix[11] = 0;
        matrix[15] = 1;
    }

    // Translation
    result.translateX = matrix[12];
    result.translateY = matrix[13];
    result.translateZ = matrix[14];

    // the 3x3 matrix
    const row00: number = matrix[0];
    const row01: number = matrix[1];
    const row02: number = matrix[2];
    const row10: number = matrix[4];
    const row11: number = matrix[5];
    const row12: number = matrix[6];
    const row20: number = matrix[8];
    const row21: number = matrix[9];
    const row22: number = matrix[10];

    const cross0: number = row11 * row22 - row12 * row21;
    const cross1: number = row12 * row20 - row10 * row22;
    const cross2: number = row10 * row21 - row11 * row20;

    // Compute scale
    const scaleX: number = Math.hypot(row00, row01, row02);

    // normalized row 0
    let norm: number = Math.sqrt(row00 * row00 + row01 * row01 + row02 * row02);
    const row0Norm0: number = norm === 0 ? 0 : row00 / norm;
    const row0Norm1: number = norm === 0 ? 0 : row01 / norm;
    const row0Norm2: number = norm === 0 ? 0 : row02 / norm;

    const skewXY: number = row0Norm0 * row10 + row0Norm1 * row11 + row0Norm2 * row12;
    const row1Proj0: number = row10 - skewXY * row0Norm0;
    const row1Proj1: number = row11 - skewXY * row0Norm1;
    const row1Proj2: number = row12 - skewXY * row0Norm2;

    const scaleY: number = Math.hypot(row1Proj0, row1Proj1, row1Proj2);

    // normalized projection of row 1
    norm = Math.sqrt(row1Proj0 * row1Proj0 + row1Proj1 * row1Proj1 + row1Proj2 * row1Proj2);
    const row1Norm0: number = norm === 0 ? 0 : row1Proj0 / norm;
    const row1Norm1: number = norm === 0 ? 0 : row1Proj1 / norm;
    const row1Norm2: number = norm === 0 ? 0 : row1Proj2 / norm;

    const skewXZ: number = row0Norm0 * row20 + row0Norm1 * row21 + row0Norm2 * row22;
    const skewYZ: number = row1Norm0 * row20 + row1Norm1 * row21 + row1Norm2 * row22;

    const row2Proj0: number = row20 - skewXZ * row0Norm0 - skewYZ * row1Norm0;
    const row2Proj1: number = row21 - skewXZ * row0Norm1 - skewYZ * row1Norm1;
    const row2Proj2: number = row22 - skewXZ * row0Norm2 - skewYZ * row1Norm2;

    // normalized projection of row 2
    norm = Math.sqrt(row2Proj0 * row2Proj0 + row2Proj1 * row2Proj1 + row2Proj2 * row2Proj2);
    const row2Norm0: number = norm === 0 ? 0 : row2Proj0 / norm;
    const row2Norm1: number = norm === 0 ? 0 : row2Proj1 / norm;
    const row2Norm2: number = norm === 0 ? 0 : row2Proj2 / norm;

    const determinant: number = row00 * cross0 + row01 * cross1 + row02 * cross2;
    const scaleZ: number = Math.hypot(row2Proj0, row2Proj1, row2Proj2) * (determinant < 0 ? -1 : 1);

    // Build rotation matrix from orthonormalized vectors
    const r00: number = row0Norm0,
        r01: number = row1Norm0,
        r02: number = row2Norm0;
    const r10: number = row0Norm1,
        r11: number = row1Norm1,
        r12: number = row2Norm1;
    const r20: number = row0Norm2,
        r21: number = row1Norm2,
        r22: number = row2Norm2;

    // Convert to quaternion
    const trace: number = r00 + r11 + r22;
    let qw: number, qx: number, qy: number, qz: number;

    if (trace > 0) {
        const s: number = 0.5 / Math.sqrt(trace + 1.0);
        qw = 0.25 / s;
        qx = (r21 - r12) * s;
        qy = (r02 - r20) * s;
        qz = (r10 - r01) * s;
    } else if (r00 > r11 && r00 > r22) {
        const s: number = 2.0 * Math.sqrt(1.0 + r00 - r11 - r22);
        qw = (r21 - r12) / s;
        qx = 0.25 * s;
        qy = (r01 + r10) / s;
        qz = (r02 + r20) / s;
    } else if (r11 > r22) {
        const s: number = 2.0 * Math.sqrt(1.0 + r11 - r00 - r22);
        qw = (r02 - r20) / s;
        qx = (r01 + r10) / s;
        qy = 0.25 * s;
        qz = (r12 + r21) / s;
    } else {
        const s: number = 2.0 * Math.sqrt(1.0 + r22 - r00 - r11);
        qw = (r10 - r01) / s;
        qx = (r02 + r20) / s;
        qy = (r12 + r21) / s;
        qz = 0.25 * s;
    }

    qx = toZeroValue(qx);
    qy = toZeroValue(qy);
    qz = toZeroValue(qz);

    // smallest non zero absolute value of the axis components
    let q: number = 0;
    let abs: number = Math.abs(qx);

    if (q === 0 || (abs > 0 && abs < q)) {
        q = abs;
    }

    abs = Math.abs(qy);

    if (q === 0 || (abs > 0 && abs < q)) {
        q = abs;
    }

    abs = Math.abs(qz);

    if (q === 0 || (abs > 0 && abs < q)) {
        q = abs;
    }

    if (q > 0) {
        qx /= q;
        qy /= q;
        qz /= q;
    }

    result.rotateX = qx;
    result.rotateY = qy;
    result.rotateZ = qz;
    result.rotateAngle = Object.is(qw, +0) ? 0 : (2 * Math.acos(qw) * 180) / Math.PI;
    result.scaleX = scaleX;
    result.scaleY = scaleY;
    result.scaleZ = scaleZ;
    result.skewXY = skewXY;
    result.skewXZ = skewXZ;
    result.skewYZ = skewYZ;

    return true;
}

/**
 * a value close to 0 (`epsilon`) is set to 0, the other values are rounded to 6 significant digits
 * @param value
 */
export function toZeroValue(value: number): number {
    if (Math.abs(value) <= epsilon) {
        return 0;
    }

    // the integers that have at most 6 digits are not changed by the rounding: no string is created
    if (Number.isInteger(value) && value < 1e6 && value > -1e6) {
        return value;
    }

    return toPrecision6(value);
}

/**
 * apply {@link toZeroValue} to the values of a matrix
 * @param matrix
 */
export function toZero(matrix: Matrix): Matrix {
    for (let i = 0; i < 16; i++) {
        matrix[i] = toZeroValue(matrix[i]);
    }

    return matrix;
}

// https://drafts.csswg.org/css-transforms-1/#2d-matrix
export function is2DMatrix(matrix: Matrix): boolean {
    // m13,m14,  m23, m24, m31, m32, m34, m43 are all 0
    return (
        matrix[2] === 0 &&
        matrix[3] === 0 &&
        matrix[6] === 0 &&
        matrix[7] === 0 &&
        matrix[8] === 0 &&
        matrix[9] === 0 &&
        matrix[11] === 0 &&
        matrix[14] === 0 &&
        matrix[10] === 1 &&
        matrix[15] === 1
    );
}
