/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.0
	License: MIT
 */
import { epsilon } from '../../syntax/constants.js';

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
/**
 * the identity matrix. must not be modified
 */
const identityMatrix = new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
/**
 * reset a matrix to the identity matrix
 * @param matrix
 */
function setIdentity(matrix) {
    matrix.set(identityMatrix);
    return matrix;
}
/**
 * true if the values of the matrix are equal (`===`) to the values of the identity matrix
 * @param matrix
 */
function isIdentity(matrix) {
    return (matrix[0] === 1 &&
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
        matrix[15] === 1);
}
/**
 * multiply two matrices: `result = matrixA × matrixB`. `result` can be one of the operands
 * @param matrixA
 * @param matrixB
 * @param result
 */
function multiplyInto(matrixA, matrixB, result) {
    const a0 = matrixA[0];
    const a1 = matrixA[1];
    const a2 = matrixA[2];
    const a3 = matrixA[3];
    const a4 = matrixA[4];
    const a5 = matrixA[5];
    const a6 = matrixA[6];
    const a7 = matrixA[7];
    const a8 = matrixA[8];
    const a9 = matrixA[9];
    const a10 = matrixA[10];
    const a11 = matrixA[11];
    const a12 = matrixA[12];
    const a13 = matrixA[13];
    const a14 = matrixA[14];
    const a15 = matrixA[15];
    for (let column = 0; column < 16; column += 4) {
        const b0 = matrixB[column];
        const b1 = matrixB[column + 1];
        const b2 = matrixB[column + 2];
        const b3 = matrixB[column + 3];
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
const augmented = new Float64Array(32);
/**
 * inverse of a matrix, used to extract the perspective. the result is a shared buffer (its first 16 values), valid
 * until the next call
 * @param matrix
 */
function inverse(matrix) {
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
        let maxRow = col;
        let maxVal = Math.abs(augmented[col * 4 + col]);
        for (let row = col + 1; row < 4; row++) {
            const val = Math.abs(augmented[row * 4 + col]);
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
            const swap = augmented[col];
            augmented[col] = augmented[maxRow];
            augmented[maxRow] = swap;
        }
        // Scale pivot row to make pivot element 1
        const pivot = augmented[col * 4 + col];
        for (let j = 0; j < 8; j++) {
            augmented[col * 4 + j] /= pivot;
        }
        // Eliminate column in other rows
        for (let row = 0; row < 4; row++) {
            if (row !== col) {
                const factor = augmented[row * 4 + col];
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
const powersOf10 = new Float64Array(23).map((_, i) => Number("1e" + i));
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
function toPrecision6(value) {
    const abs = value < 0 ? -value : value;
    if (abs >= 1e-15 && abs < 1e21) {
        const k = 5 - Math.floor(Math.log10(abs));
        const scaled = k >= 0 ? abs * powersOf10[k] : abs / powersOf10[-k];
        // the exponent computed from the logarithm is exact
        if (scaled >= 1e5 && scaled < 999999.5) {
            let n = Math.floor(scaled);
            const fraction = scaled - n;
            // not close to a tie
            if (fraction < 0.499999 || fraction > 0.500001) {
                if (fraction > 0.5) {
                    n++;
                }
                const result = k >= 0 ? n / powersOf10[k] : n * powersOf10[-k];
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
function round(number) {
    const rounded = Math.round(number);
    return Math.abs(rounded - number) <= epsilon ? rounded : toPrecision6(number);
}
/**
 * working copy of the matrix being decomposed
 */
const decomposeBuffer = new Float64Array(16);
/**
 * decompose a matrix: translate → rotate → skew → scale. the matrix is not modified
 *
 * `translate3d(25.9808px, 0, 15px) rotateY(60deg) skewX(49.9999deg) scale(1, 1.2)`
 * @param original
 * @param result receives the decomposition
 * @returns false if the matrix cannot be decomposed
 */
function decompose(original, result) {
    const matrix = decomposeBuffer;
    // Normalize last row
    if (original[15] === 0) {
        return false;
    }
    matrix.set(original);
    for (let i = 0; i < 16; i++)
        matrix[i] /= matrix[15];
    // Perspective extraction
    result.perspectiveX = 0;
    result.perspectiveY = 0;
    result.perspectiveZ = 0;
    result.perspectiveW = 1;
    if (matrix[3] !== 0 || matrix[7] !== 0 || matrix[11] !== 0) {
        const r0 = matrix[3];
        const r1 = matrix[7];
        const r2 = matrix[11];
        const r3 = matrix[15];
        const inverted = inverse(original);
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
    const row00 = matrix[0];
    const row01 = matrix[1];
    const row02 = matrix[2];
    const row10 = matrix[4];
    const row11 = matrix[5];
    const row12 = matrix[6];
    const row20 = matrix[8];
    const row21 = matrix[9];
    const row22 = matrix[10];
    const cross0 = row11 * row22 - row12 * row21;
    const cross1 = row12 * row20 - row10 * row22;
    const cross2 = row10 * row21 - row11 * row20;
    // Compute scale
    const scaleX = Math.hypot(row00, row01, row02);
    // normalized row 0
    let norm = Math.sqrt(row00 * row00 + row01 * row01 + row02 * row02);
    const row0Norm0 = norm === 0 ? 0 : row00 / norm;
    const row0Norm1 = norm === 0 ? 0 : row01 / norm;
    const row0Norm2 = norm === 0 ? 0 : row02 / norm;
    const skewXY = row0Norm0 * row10 + row0Norm1 * row11 + row0Norm2 * row12;
    const row1Proj0 = row10 - skewXY * row0Norm0;
    const row1Proj1 = row11 - skewXY * row0Norm1;
    const row1Proj2 = row12 - skewXY * row0Norm2;
    const scaleY = Math.hypot(row1Proj0, row1Proj1, row1Proj2);
    // normalized projection of row 1
    norm = Math.sqrt(row1Proj0 * row1Proj0 + row1Proj1 * row1Proj1 + row1Proj2 * row1Proj2);
    const row1Norm0 = norm === 0 ? 0 : row1Proj0 / norm;
    const row1Norm1 = norm === 0 ? 0 : row1Proj1 / norm;
    const row1Norm2 = norm === 0 ? 0 : row1Proj2 / norm;
    const skewXZ = row0Norm0 * row20 + row0Norm1 * row21 + row0Norm2 * row22;
    const skewYZ = row1Norm0 * row20 + row1Norm1 * row21 + row1Norm2 * row22;
    const row2Proj0 = row20 - skewXZ * row0Norm0 - skewYZ * row1Norm0;
    const row2Proj1 = row21 - skewXZ * row0Norm1 - skewYZ * row1Norm1;
    const row2Proj2 = row22 - skewXZ * row0Norm2 - skewYZ * row1Norm2;
    // normalized projection of row 2
    norm = Math.sqrt(row2Proj0 * row2Proj0 + row2Proj1 * row2Proj1 + row2Proj2 * row2Proj2);
    const row2Norm0 = norm === 0 ? 0 : row2Proj0 / norm;
    const row2Norm1 = norm === 0 ? 0 : row2Proj1 / norm;
    const row2Norm2 = norm === 0 ? 0 : row2Proj2 / norm;
    const determinant = row00 * cross0 + row01 * cross1 + row02 * cross2;
    const scaleZ = Math.hypot(row2Proj0, row2Proj1, row2Proj2) * (determinant < 0 ? -1 : 1);
    // Build rotation matrix from orthonormalized vectors
    const r00 = row0Norm0, r01 = row1Norm0, r02 = row2Norm0;
    const r10 = row0Norm1, r11 = row1Norm1, r12 = row2Norm1;
    const r20 = row0Norm2, r21 = row1Norm2, r22 = row2Norm2;
    // Convert to quaternion
    const trace = r00 + r11 + r22;
    let qw, qx, qy, qz;
    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1.0);
        qw = 0.25 / s;
        qx = (r21 - r12) * s;
        qy = (r02 - r20) * s;
        qz = (r10 - r01) * s;
    }
    else if (r00 > r11 && r00 > r22) {
        const s = 2.0 * Math.sqrt(1.0 + r00 - r11 - r22);
        qw = (r21 - r12) / s;
        qx = 0.25 * s;
        qy = (r01 + r10) / s;
        qz = (r02 + r20) / s;
    }
    else if (r11 > r22) {
        const s = 2.0 * Math.sqrt(1.0 + r11 - r00 - r22);
        qw = (r02 - r20) / s;
        qx = (r01 + r10) / s;
        qy = 0.25 * s;
        qz = (r12 + r21) / s;
    }
    else {
        const s = 2.0 * Math.sqrt(1.0 + r22 - r00 - r11);
        qw = (r10 - r01) / s;
        qx = (r02 + r20) / s;
        qy = (r12 + r21) / s;
        qz = 0.25 * s;
    }
    qx = toZeroValue(qx);
    qy = toZeroValue(qy);
    qz = toZeroValue(qz);
    // smallest non zero absolute value of the axis components
    let q = 0;
    let abs = Math.abs(qx);
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
    result.rotateAngle = Object.is(qw, 0) ? 0 : (2 * Math.acos(qw) * 180) / Math.PI;
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
function toZeroValue(value) {
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
function toZero(matrix) {
    for (let i = 0; i < 16; i++) {
        matrix[i] = toZeroValue(matrix[i]);
    }
    return matrix;
}
// https://drafts.csswg.org/css-transforms-1/#2d-matrix
function is2DMatrix(matrix) {
    // m13,m14,  m23, m24, m31, m32, m34, m43 are all 0
    return (matrix[2] === 0 &&
        matrix[3] === 0 &&
        matrix[6] === 0 &&
        matrix[7] === 0 &&
        matrix[8] === 0 &&
        matrix[9] === 0 &&
        matrix[11] === 0 &&
        matrix[14] === 0 &&
        matrix[10] === 1 &&
        matrix[15] === 1);
}

export { decompose, identityMatrix, is2DMatrix, isIdentity, multiplyInto, round, setIdentity, toPrecision6, toZero, toZeroValue };
