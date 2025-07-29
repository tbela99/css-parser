const epsilon = 1e-5;
function identity() {
    return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
}
function pLength(point) {
    // Calcul de la norme euclidienne
    return Math.sqrt(point[0] * point[0] + point[1] * point[1] + point[2] * point[2]);
}
function normalize(point) {
    const [x, y, z] = point;
    const norm = Math.sqrt(point[0] * point[0] + point[1] * point[1] + point[2] * point[2]);
    return norm === 0 ? [0, 0, 0] : [x / norm, y / norm, z / norm];
}
function dot(point1, point2) {
    // if (point1.length === 4 && point2.length === 4) {
    //
    //     return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2] + point1[3] * point2[3];
    // }
    let result = 0;
    for (let i = 0; i < point1.length; i++) {
        result += point1[i] * point2[i];
    }
    return result;
    // return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2];
}
function multiply(matrixA, matrixB) {
    let result = Array(4).fill(0).map(() => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                result[j][i] += matrixA[k][i] * matrixB[j][k];
            }
        }
    }
    return result;
}
function inverse(matrix) {
    // Create augmented matrix [matrix | identity]
    let augmented = matrix.map((row, i) => [
        ...row,
        ...(i === 0 ? [1, 0, 0, 0] :
            i === 1 ? [0, 1, 0, 0] :
                i === 2 ? [0, 0, 1, 0] :
                    [0, 0, 0, 1])
    ]);
    // Gaussian elimination with partial pivoting
    for (let col = 0; col < 4; col++) {
        // Find pivot row with maximum absolute value
        let maxRow = col;
        let maxVal = Math.abs(augmented[col][col]);
        for (let row = col + 1; row < 4; row++) {
            let val = Math.abs(augmented[row][col]);
            if (val > maxVal) {
                maxVal = val;
                maxRow = row;
            }
        }
        // Check for singularity
        if (maxVal < 1e-5) {
            return null;
        }
        // Swap rows if necessary
        if (maxRow !== col) {
            [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
        }
        // Scale pivot row to make pivot element 1
        let pivot = augmented[col][col];
        for (let j = 0; j < 8; j++) {
            augmented[col][j] /= pivot;
        }
        // Eliminate column in other rows
        for (let row = 0; row < 4; row++) {
            if (row !== col) {
                let factor = augmented[row][col];
                for (let j = 0; j < 8; j++) {
                    augmented[row][j] -= factor * augmented[col][j];
                }
            }
        }
    }
    // Extract the inverse from the right side of the augmented matrix
    return augmented.map(row => row.slice(4));
}
// function transpose(matrix: Matrix): Matrix {
//     // Crée une nouvelle matrice vide 4x4
//     // @ts-ignore
//     let transposed: Matrix = [[], [], [], []] as Matrix;
//
//     // Parcourt chaque ligne et colonne pour transposer
//     for (let i = 0; i < 4; i++) {
//
//         for (let j = 0; j < 4; j++) {
//
//             transposed[j][i] = matrix[i][j];
//         }
//     }
//
//     return transposed;
// }
function round(number) {
    return Math.abs(number) < epsilon ? 0 : +number.toPrecision(6);
}
// translate3d(25.9808px, 0, 15px ) rotateY(60deg) skewX(49.9999deg) scale(1, 1.2)
// translate → rotate → skew → scale
function decompose(original) {
    const matrix = original.flat();
    // Normalize last row
    if (matrix[15] === 0) {
        return null;
    }
    for (let i = 0; i < 16; i++)
        matrix[i] /= matrix[15];
    // Perspective extraction
    const perspective = [0, 0, 0, 1];
    if (matrix[3] !== 0 || matrix[7] !== 0 || matrix[11] !== 0) {
        const rightHandSide = [matrix[3], matrix[7], matrix[11], matrix[15]];
        const perspectiveMatrix = matrix.slice();
        perspectiveMatrix[3] = 0;
        perspectiveMatrix[7] = 0;
        perspectiveMatrix[11] = 0;
        perspectiveMatrix[15] = 1;
        // @ts-ignore
        const inverted = inverse(original.reduce((acc, row, i) => acc.concat([row.slice()]), []))?.flat?.();
        if (!inverted) {
            return null;
        }
        const transposedInverse = transposeMatrix4(inverted);
        perspective[0] = dot(rightHandSide, transposedInverse.slice(0, 4));
        perspective[1] = dot(rightHandSide, transposedInverse.slice(4, 8));
        perspective[2] = dot(rightHandSide, transposedInverse.slice(8, 12));
        perspective[3] = dot(rightHandSide, transposedInverse.slice(12, 16));
        // Clear perspective from matrix
        matrix[3] = 0;
        matrix[7] = 0;
        matrix[11] = 0;
        matrix[15] = 1;
    }
    // Translation
    const translate = [matrix[12], matrix[13], matrix[14]];
    matrix[12] = matrix[13] = matrix[14] = 0;
    // Build the 3x3 matrix
    const row0 = [matrix[0], matrix[1], matrix[2]];
    const row1 = [matrix[4], matrix[5], matrix[6]];
    const row2 = [matrix[8], matrix[9], matrix[10]];
    // Compute scale
    const scaleX = pLength(row0);
    const row0Norm = normalize(row0);
    const skewXY = dot(row0Norm, row1);
    const row1Proj = [
        row1[0] - skewXY * row0Norm[0],
        row1[1] - skewXY * row0Norm[1],
        row1[2] - skewXY * row0Norm[2]
    ];
    const scaleY = pLength(row1Proj);
    const row1Norm = normalize(row1Proj);
    const skewXZ = dot(row0Norm, row2);
    const skewYZ = dot(row1Norm, row2);
    const row2Proj = [
        row2[0] - skewXZ * row0Norm[0] - skewYZ * row1Norm[0],
        row2[1] - skewXZ * row0Norm[1] - skewYZ * row1Norm[1],
        row2[2] - skewXZ * row0Norm[2] - skewYZ * row1Norm[2]
    ];
    const scaleZ = pLength(row2Proj);
    const row2Norm = normalize(row2Proj);
    // Build rotation matrix from orthonormalized vectors
    const r00 = row0Norm[0], r01 = row1Norm[0], r02 = row2Norm[0];
    const r10 = row0Norm[1], r11 = row1Norm[1], r12 = row2Norm[1];
    const r20 = row0Norm[2], r21 = row1Norm[2], r22 = row2Norm[2];
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
    [qx, qy, qz] = toZero([qx, qy, qz]);
    // const q = gcd(qx, gcd(qy, qz));
    let q = [Math.abs(qx), Math.abs(qy), Math.abs(qz)].reduce((acc, curr) => {
        if (acc == 0 || (curr > 0 && curr < acc)) {
            acc = curr;
        }
        return acc;
    }, 0);
    if (q > 0) {
        qx /= q;
        qy /= q;
        qz /= q;
    }
    const rotate = [qx, qy, qz, Object.is(qw, 0) ? 0 : 2 * Math.acos(qw) * 180 / Math.PI];
    const scale = [scaleX, scaleY, scaleZ];
    const skew = [skewXY, skewXZ, skewYZ];
    return {
        translate,
        scale,
        rotate,
        skew,
        perspective
    };
}
function transposeMatrix4(m) {
    return [
        m[0], m[4], m[8], m[12],
        m[1], m[5], m[9], m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15],
    ];
}
function toZero(v) {
    for (let i = 0; i < v.length; i++) {
        if (Math.abs(v[i]) <= epsilon) {
            v[i] = 0;
        }
        else {
            v[i] = +v[i].toPrecision(6);
        }
    }
    return v;
}
// https://drafts.csswg.org/css-transforms-1/#2d-matrix
function is2DMatrix(matrix) {
    // m13,m14,  m23, m24, m31, m32, m34, m43 are all 0
    return matrix[0][2] === 0 &&
        matrix[0][3] === 0 &&
        matrix[1][2] === 0 &&
        matrix[1][3] === 0 &&
        matrix[2][0] === 0 &&
        matrix[2][1] === 0 &&
        matrix[2][3] === 0 &&
        matrix[3][2] === 0 &&
        matrix[2][2] === 1 &&
        matrix[3][3] === 1;
}

export { decompose, epsilon, identity, is2DMatrix, multiply, round, toZero };
