import { gcd } from '../math/math.js';

function determinant(matrix) {
    return matrix[0][0] * matrix[1][1] * matrix[2][2] * matrix[3][3] - matrix[0][0] * matrix[1][2] * matrix[2][3] * matrix[3][1] -
        matrix[0][1] * matrix[1][0] * matrix[2][3] * matrix[3][2] + matrix[0][1] * matrix[1][2] * matrix[2][0] * matrix[3][3] -
        matrix[0][2] * matrix[1][0] * matrix[2][1] * matrix[3][3] + matrix[0][2] * matrix[1][1] * matrix[2][0] * matrix[3][2] -
        matrix[0][3] * matrix[1][0] * matrix[2][1] * matrix[3][2] + matrix[0][3] * matrix[1][1] * matrix[2][2] * matrix[3][0];
}
function identity() {
    return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
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
        if (maxVal < 1e-10) {
            throw new Error("Matrix is singular and cannot be inverted");
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
function transpose(matrix) {
    // Crée une nouvelle matrice vide 4x4
    // @ts-ignore
    let transposed = [[], [], [], []];
    // Parcourt chaque ligne et colonne pour transposer
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            transposed[j][i] = matrix[i][j];
        }
    }
    return transposed;
}
function multVecMatrix(vector, matrix) {
    const result = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i] += matrix[i][j] * vector[j];
        }
    }
    return result;
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
    if (point1.length === 4 && point2.length === 4) {
        return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2] + point1[3] * point2[3];
    }
    return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2];
}
function combine(point1, point2, ascl, bscl) {
    return [point1[0] * ascl + point2[0] * bscl, point1[1] * ascl + point2[1] * bscl, point1[2] * ascl + point2[2] * bscl];
}
function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
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
function decompose(original) {
    // Normalize the matrix.
    if (original[3][3] === 0) {
        return null;
    }
    // @ts-ignore
    const matrix = original.reduce((acc, curr) => acc.concat([curr.slice()]), []);
    const div = Math.abs(1 / matrix[3][3]);
    // const div = 1 / matrix[3][3];
    if (div != 1) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                matrix[i][j] *= div;
            }
        }
    }
    // perspectiveMatrix is used to solve for perspective, but it also provides
    // an easy way to test for singularity of the upper 3x3 component.
    let perspectiveMatrix = matrix;
    for (let i = 0; i < 3; i++) {
        perspectiveMatrix[i][3] = 0;
    }
    perspectiveMatrix[3][3] = 1;
    if (determinant(perspectiveMatrix) === 0) {
        return null;
    }
    let rightHandSide = [0, 0, 0, 0];
    let perspective = [0, 0, 0, 0];
    let translate = [matrix[3][0], matrix[3][1], matrix[3][2]];
    // First, isolate perspective.
    if (original[0][3] !== 0 || original[1][3] !== 0 || original[2][3] !== 0) {
        // rightHandSide is the right hand side of the equation.
        rightHandSide[0] = original[0][3];
        rightHandSide[1] = original[1][3];
        rightHandSide[2] = original[2][3];
        rightHandSide[3] = original[3][3];
        // Solve the equation by inverting perspectiveMatrix and multiplying
        // rightHandSide by the inverse.
        let inversePerspectiveMatrix = inverse(perspectiveMatrix);
        let transposedInversePerspectiveMatrix = transpose(inversePerspectiveMatrix);
        perspective = multVecMatrix(rightHandSide, transposedInversePerspectiveMatrix);
    }
    else {
        // No perspective.
        perspective[0] = perspective[1] = perspective[2] = 0;
        perspective[3] = 1;
    }
    // Next take care of translation
    //     for (let i = 0; i < 3; i++) {
    //
    //         translate[i] = matrix[3][i];
    //     }
    let row = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    // Now get scale and shear. 'row' is a 3 element array of 3 component vectors
    for (let i = 0; i < 3; i++) {
        row[i][0] = matrix[i][0];
        row[i][1] = matrix[i][1];
        row[i][2] = matrix[i][2];
    }
    let scale = [0, 0, 0];
    let skew = [0, 0, 0];
    // Compute X scale factor and normalize first row.
    scale[0] = pLength(row[0]);
    row[0] = normalize(row[0]);
    // Compute XY shear factor and make 2nd row orthogonal to 1st.
    skew[0] = dot(row[0], row[1]);
    row[1] = combine(row[1], row[0], 1.0, -skew[0]);
    // Now, compute Y scale and normalize 2nd row.
    scale[1] = pLength(row[1]);
    row[1] = normalize(row[1]);
    skew[0] /= scale[1];
    // Compute XZ and YZ shears, orthogonalize 3rd row
    skew[1] = dot(row[0], row[2]);
    row[2] = combine(row[2], row[0], 1.0, -skew[1]);
    skew[2] = dot(row[1], row[2]);
    row[2] = combine(row[2], row[1], 1.0, -skew[2]);
    // Next, get Z scale and normalize 3rd row.
    scale[2] = pLength(row[2]);
    row[2] = normalize(row[2]);
    skew[1] /= scale[2];
    skew[2] /= scale[2];
    // At this point, the matrix (in rows) is orthonormal.
    // Check for a coordinate system flip.  If the determinant
    // is -1, then negate the matrix and the scaling factors.
    let pdum3 = cross(row[1], row[2]);
    if (dot(row[0], pdum3) < 0) {
        for (let i = 0; i < 3; i++) {
            scale[i] *= -1;
            row[i][0] *= -1;
            row[i][1] *= -1;
            row[i][2] *= -1;
        }
    }
    let quaternion = [0, 0, 0, 0];
    // Now, get the rotations out
    quaternion[0] = 0.5 * Math.sqrt(Math.max(1 + row[0][0] - row[1][1] - row[2][2], 0));
    quaternion[1] = 0.5 * Math.sqrt(Math.max(1 - row[0][0] + row[1][1] - row[2][2], 0));
    quaternion[2] = 0.5 * Math.sqrt(Math.max(1 - row[0][0] - row[1][1] + row[2][2], 0));
    quaternion[3] = 0.5 * Math.sqrt(Math.max(1 + row[0][0] + row[1][1] + row[2][2], 0));
    if (row[2][1] > row[1][2]) {
        quaternion[0] = -quaternion[0];
    }
    if (row[0][2] > row[2][0]) {
        quaternion[1] = -quaternion[1];
    }
    if (row[1][0] > row[0][1]) {
        quaternion[2] = -quaternion[2];
    }
    // apply rotation
    let x = quaternion[0];
    let y = quaternion[1];
    let z = quaternion[2];
    let w = quaternion[3];
    const rotationMatrix = identity();
    // Construct a composite rotation matrix from the quaternion values
    // rotationMatrix is an identity 4x4 matrix initially
    rotationMatrix[0][0] = 1 - 2 * (y * y + z * z);
    rotationMatrix[0][1] = 2 * (x * y - z * w);
    rotationMatrix[0][2] = 2 * (x * z + y * w);
    rotationMatrix[1][0] = 2 * (x * y + z * w);
    rotationMatrix[1][1] = 1 - 2 * (x * x + z * z);
    rotationMatrix[1][2] = 2 * (y * z - x * w);
    rotationMatrix[2][0] = 2 * (x * z - y * w);
    rotationMatrix[2][1] = 2 * (y * z + x * w);
    rotationMatrix[2][2] = 1 - 2 * (x * x + y * y);
    const { x: x1, y: y1, z: z1, angle } = getRotation3D(rotationMatrix);
    return {
        // @ts-ignore
        skew: toZero(skew),
        scale: toZero(scale),
        rotate: toZero([x1, y1, z1, angle]),
        translate: toZero(translate),
        perspective: original[2][3] == 0 ? null : +(-1 / original[2][3]).toPrecision(6),
        quaternion
    };
}
function toZero(v) {
    for (let i = 0; i < v.length; i++) {
        if (Math.abs(v[i]) <= 1e-5) {
            v[i] = 0;
        }
        else {
            v[i] = +v[i].toPrecision(6);
        }
    }
    return v;
}
// Fonction pour calculer rotate3d à partir de matrix3d
function getRotation3D(matrix) {
    // Extraire la sous-matrice 3x3 de rotation
    const r11 = matrix[0][0], r12 = matrix[0][1], r13 = matrix[0][2];
    const r21 = matrix[1][0], r22 = matrix[1][1], r23 = matrix[1][2];
    const r31 = matrix[2][0], r32 = matrix[2][1], r33 = matrix[2][2];
    // Calculer la trace (somme des éléments diagonaux)
    const trace = r11 + r22 + r33;
    // Calculer l’angle de rotation (en radians)
    const cosTheta = (trace - 1) / 2;
    // Calculer sin(θ) avec le signe correct
    const sinThetaRaw = Math.sqrt(1 - cosTheta * cosTheta);
    const xRaw = r32 - r23; // -0.467517
    const yRaw = r13 - r31; // 0.776535
    const zRaw = r21 - r12; // 0.776535
    // Déterminer le signe de sin(θ) basé sur la direction
    const sinTheta = (xRaw < 0 && yRaw > 0 && zRaw > 0) ? -sinThetaRaw : sinThetaRaw;
    // Calculer l’angle avec atan2
    const angle = +(Math.atan2(sinTheta, cosTheta) * 180 / Math.PI).toFixed(6);
    let x = 0, y = 0, z = 0;
    if (Math.abs(sinTheta) < 1e-6) { // Cas où l’angle est proche de 0° ou 180°
        const x1 = +r11.toPrecision(6);
        const y1 = +r22.toPrecision(6);
        const z1 = +r33.toPrecision(6);
        const max = Math.max(x1, y1, z1);
        x = y = z = 0;
        if (max === x1) {
            x = 1;
        }
        if (max === y1) {
            y = 1;
        }
        if (max === z1) {
            z = 1;
        }
    }
    else {
        x = (r32 - r23) / (2 * sinTheta);
        y = (r13 - r31) / (2 * sinTheta);
        z = (r21 - r12) / (2 * sinTheta);
    }
    // Normaliser le vecteur (optionnel, mais utile pour vérification)
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length > 0) {
        x /= length;
        y /= length;
        z /= length;
    }
    const pc = Math.abs(gcd(x, gcd(y, z)));
    if (pc > 0.1 && pc <= Math.abs(x) && pc <= Math.abs(y) && pc <= Math.abs(z)) {
        x /= pc;
        y /= pc;
        z /= pc;
    }
    else {
        const min = Math.min(Math.abs(x), Math.abs(y), Math.abs(z));
        if (min > 0.1) {
            x = +(x / min).toPrecision(6);
            y = +(y / min).toPrecision(6);
            z = +(z / min).toPrecision(6);
        }
    }
    return { x, y, z, angle };
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

export { decompose, identity, is2DMatrix, multiply, toZero };
