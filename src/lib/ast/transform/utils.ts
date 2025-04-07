import {gcd} from "../math/math.ts";

export declare type Point = [number, number, number];
export declare type Vector = [number, number, number, number];
export declare type Matrix = [Vector, Vector, Vector, Vector];

interface DecomposedMatrix3D {
    skew: [number, number, number];
    scale: [number, number, number];
    rotate: [number, number, number, number];
    translate: [number, number, number];
    perspective: [number, number, number, number];
    quaternion: [number, number, number, number];
}

function determinant(matrix: Matrix): number {
    return matrix[0][0] * matrix[1][1] * matrix[2][2] * matrix[3][3] - matrix[0][0] * matrix[1][2] * matrix[2][3] * matrix[3][1] -
        matrix[0][1] * matrix[1][0] * matrix[2][3] * matrix[3][2] + matrix[0][1] * matrix[1][2] * matrix[2][0] * matrix[3][3] -
        matrix[0][2] * matrix[1][0] * matrix[2][1] * matrix[3][3] + matrix[0][2] * matrix[1][1] * matrix[2][0] * matrix[3][2] -
        matrix[0][3] * matrix[1][0] * matrix[2][1] * matrix[3][2] + matrix[0][3] * matrix[1][1] * matrix[2][2] * matrix[3][0];
}

export function identity(): Matrix {

    return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] as Matrix;
}


function inverse(matrix: Matrix): Matrix {

    // Create augmented matrix [matrix | identity]
    let augmented: Matrix = matrix.map((row, i) => [
        ...row,
        ...(i === 0 ? [1, 0, 0, 0] :
            i === 1 ? [0, 1, 0, 0] :
                i === 2 ? [0, 0, 1, 0] :
                    [0, 0, 0, 1])
    ]) as Matrix;

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
    return augmented.map(row => row.slice(4)) as Matrix;
}

function transpose(matrix: Matrix): Matrix {
    // Crée une nouvelle matrice vide 4x4
    // @ts-ignore
    let transposed: Matrix = [[], [], [], []] as Matrix;

    // Parcourt chaque ligne et colonne pour transposer
    for (let i = 0; i < 4; i++) {

        for (let j = 0; j < 4; j++) {

            transposed[j][i] = matrix[i][j];
        }
    }

    return transposed;
}

function multVecMatrix(vector: Vector, matrix: Matrix): Vector {

    const result: Vector = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {

        for (let j = 0; j < 4; j++) {

            result[i] += matrix[i][j] * vector[j];
        }
    }

    return result;
}

function pLength(point: Point): number {

    // Calcul de la norme euclidienne
    return Math.sqrt(point[0] * point[0] + point[1] * point[1] + point[2] * point[2]);
}

function normalize(point: Point): Point {

    const [x, y, z] = point;
    const norm: number = Math.sqrt(point[0] * point[0] + point[1] * point[1] + point[2] * point[2]);
    return norm === 0 ? [0, 0, 0] : [x / norm, y / norm, z / norm];
}

function interpolate(quaternionA: [number, number, number, number], quaternionB: [number, number, number, number], t: number = 1) {

    let product = dot(quaternionA, quaternionB);

    const quaternionDst: [number, number, number, number] = [0, 0, 0, 0];
// Clamp product to -1.0 <= product <= 1.0
    product = Math.min(product, 1.0);
    product = Math.max(product, -1.0);

    if (Math.abs(product) === 1.0) {
        return quaternionA;
    }

    const theta = Math.acos(product);
    const w = Math.sin(t * theta) / Math.sqrt(1 - product * product);

    for (let i = 0; i < 4; i++) {
        quaternionA[i] *= Math.cos(t * theta) - product * w;
        quaternionB[i] *= w;
        quaternionDst[i] = quaternionA[i] + quaternionB[i];
    }

    return;
}

function dot(point1: Point, point2: Point): number;
function dot(point1: [number, number, number, number], point2: [number, number, number, number]): number;

function dot(point1: Point | [number, number, number, number], point2: Point | [number, number, number, number]): number {

    if (point1.length === 4 && point2.length === 4) {

        return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2] + point1[3] * point2[3];
    }

    return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2];
}

function combine(point1: Point, point2: Point, ascl: number, bscl: number): Point {

    return [point1[0] * ascl + point2[0] * bscl, point1[1] * ascl + point2[1] * bscl, point1[2] * ascl + point2[2] * bscl];
}

function cross(a: Point, b: Point): Point {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function multiply(matrixA: Matrix, matrixB: Matrix): Matrix {

    let result: Matrix = Array(4).fill(0).map(() => Array(4).fill(0)) as Matrix;

    for (let i = 0; i < 4; i++) {

        for (let j = 0; j < 4; j++) {

            for (let k = 0; k < 4; k++) {

                result[j][i] += matrixA[k][i] * matrixB[j][k];
            }
        }
    }

    return result;
}

export function decompose2(matrix: Matrix) {

    let row0x = matrix[0][0]
    let row0y = matrix[1][0]
    let row1x = matrix[0][1]
    let row1y = matrix[1][1]

    // @ts-ignore
    const translate: [number, number] = [] as [number, number];
    // @ts-ignore
    const scale: [number, number] = [] as [number, number];

    translate[0] = matrix[0][3]
    translate[1] = matrix[1][3]

    scale[0] = Math.sqrt(row0x * row0x + row0y * row0y)
    scale[1] = Math.sqrt(row1x * row1x + row1y * row1y)

// If determinant is negative, one axis was flipped.
    let determinant = row0x * row1y - row0y * row1x
    if (determinant < 0) {

        // Flip axis with minimum unit vector dot product.
        if (row0x < row1y) {

            scale[0] = -scale[0]
        } else {

            scale[1] = -scale[1]
        }
    }

// Renormalize matrix to remove scale.
    if (scale[0]) {

        row0x *= 1 / scale[0]
        row0y *= 1 / scale[0]
    }


    if (scale[1]) {

        row1x *= 1 / scale[1]
        row1y *= 1 / scale[1]
    }

// Compute rotation and renormalize matrix.
    let angle = Math.atan2(row0y, row0x);

    if (angle) {

        let sn = -row0y
        // Rotate(-angle) = [cos(angle), sin(angle), -sin(angle), cos(angle)]
        //                = [row0x, -row0y, row0y, row0x]
        // Thanks to the normalization above.
        let cs = row0x
        let m11 = row0x
        let m12 = row0y
        let m21 = row1x
        let m22 = row1y
        row0x = cs * m11 + sn * m21
        row0y = cs * m12 + sn * m22
        row1x = -sn * m11 + cs * m21
        row1y = -sn * m12 + cs * m22
    }

    let m11 = row0x
    let m12 = row0y
    let m21 = row1x
    let m22 = row1y

// Convert into degrees because our rotation functions expect it.
//     angle = rad2deg(angle)

    angle *= 180 / Math.PI;

    return {
        translate, scale, angle: +angle.toPrecision(12), m11, m12, m21, m22
    }
}

export function decompose(matrix: Matrix): DecomposedMatrix3D | null {

    // Normalize the matrix.
    if (matrix[3][3] === 0) {

        return null;
    }

    for (let i = 0; i < 4; i++) {

        for (let j = 0; j < 4; j++) {

            matrix[i][j] /= matrix[3][3];
        }
    }

// perspectiveMatrix is used to solve for perspective, but it also provides
// an easy way to test for singularity of the upper 3x3 component.
    let perspectiveMatrix: Matrix = matrix;

    for (let i = 0; i < 3; i++) {

        perspectiveMatrix[i][3] = 0;
    }

    perspectiveMatrix[3][3] = 1;

    if (determinant(perspectiveMatrix) === 0) {

        return null;
    }

    let rightHandSide: Vector = [0, 0, 0, 0];
    let perspective: Vector = [0, 0, 0, 0];
    let translate: [number, number, number] = [0, 0, 0];

// First, isolate perspective.
    if (matrix[0][3] !== 0 || matrix[1][3] !== 0 || matrix[2][3] !== 0) {
        // rightHandSide is the right hand side of the equation.
        rightHandSide[0] = matrix[0][3];
        rightHandSide[1] = matrix[1][3];
        rightHandSide[2] = matrix[2][3];
        rightHandSide[3] = matrix[3][3];

        // Solve the equation by inverting perspectiveMatrix and multiplying
        // rightHandSide by the inverse.
        let inversePerspectiveMatrix = inverse(perspectiveMatrix);
        let transposedInversePerspectiveMatrix = transpose(inversePerspectiveMatrix);
        perspective = multVecMatrix(rightHandSide, transposedInversePerspectiveMatrix);
    } else {
        // No perspective.
        perspective[0] = perspective[1] = perspective[2] = 0;
        perspective[3] = 1;
    }

// Next take care of translation
    for (let i = 0; i < 3; i++) {

        translate[i] = matrix[3][i];
    }

    let row: [[number, number, number], [number, number, number], [number, number, number]] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

// Now get scale and shear. 'row' is a 3 element array of 3 component vectors
    for (let i = 0; i < 3; i++) {
        row[i][0] = matrix[i][0];
        row[i][1] = matrix[i][1];
        row[i][2] = matrix[i][2];
    }

    let scale: [number, number, number] = [0, 0, 0];
    let skew: [number, number, number] = [0, 0, 0];

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

    let quaternion: [number, number, number, number] = [0, 0, 0, 0];

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
    let x: number = quaternion[0];
    let y: number = quaternion[1];
    let z: number = quaternion[2];
    let w: number = quaternion[3];

    const rotationMatrix: Matrix = identity();
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

    const {x: x1, y: y1, z: z1, angle} = getRotation3D(rotationMatrix);

    return {
        // @ts-ignore
        skew: toZero(skew) as [number, number, number],
        scale: toZero(scale) as [number, number, number],
        rotate: toZero([x1, y1, z1, angle]) as [number, number, number, number],
        translate: toZero(translate) as [number, number, number],
        perspective,
        quaternion
    };
}

export function toZero(v: [number, number] | [number, number, number] | [number, number, number, number]) {

    for (let i = 0; i < v.length; i++) {

        if (Math.abs(v[i]) <= 1e-6) {

            v[i] = 0;
        } else {

            v[i] = +v[i].toPrecision(6);
        }
    }

    return v;
}


// Fonction pour calculer rotate3d à partir de matrix3d
function getRotation3D(matrix: Matrix): { x: number, y: number, z: number, angle: number } {

    // Extraire la sous-matrice 3x3 de rotation
    const r11: number = matrix[0][0], r12: number = matrix[0][1], r13: number = matrix[0][2];
    const r21: number = matrix[1][0], r22: number = matrix[1][1], r23: number = matrix[1][2];
    const r31: number = matrix[2][0], r32: number = matrix[2][1], r33: number = matrix[2][2];

    // Calculer la trace (somme des éléments diagonaux)
    const trace: number = r11 + r22 + r33;

    // Calculer l’angle de rotation (en radians)
    const cosTheta: number = (trace - 1) / 2;

    // Calculer sin(θ) avec le signe correct
    const sinThetaRaw: number = Math.sqrt(1 - cosTheta * cosTheta);
    const xRaw: number = r32 - r23; // -0.467517
    const yRaw: number = r13 - r31; // 0.776535
    const zRaw: number = r21 - r12; // 0.776535
    // Déterminer le signe de sin(θ) basé sur la direction
    const sinTheta: number = (xRaw < 0 && yRaw > 0 && zRaw > 0) ? -sinThetaRaw : sinThetaRaw;

    // Calculer l’angle avec atan2
    const angle: number = +(Math.atan2(sinTheta, cosTheta) * 180 / Math.PI).toFixed(6);
    let x = 0, y = 0, z = 0;

    if (Math.abs(sinTheta) < 1e-6) { // Cas où l’angle est proche de 0° ou 180°

        const x1: number = +r11.toPrecision(6);
        const y1: number = +r22.toPrecision(6);
        const z1:   number = +r33.toPrecision(6);
        const max: number = Math.max(x1, y1, z1);

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

    } else {
        x = (r32 - r23) / (2 * sinTheta);
        y = (r13 - r31) / (2 * sinTheta);
        z = (r21 - r12) / (2 * sinTheta);
    }

    // Normaliser le vecteur (optionnel, mais utile pour vérification)
    const length: number = Math.sqrt(x * x + y * y + z * z);

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
    } else {

        const min = Math.min(Math.abs(x), Math.abs(y), Math.abs(z));

        if (min > 0.1) {

            x = +(x / min).toPrecision(6);
            y = +(y / min).toPrecision(6);
            z = +(z / min).toPrecision(6);
        }
    }

    return {x, y, z, angle};
}

export function recompose(
    translate: [number, number, number],
    scale: [number, number, number],
    skew: [number, number, number],
    perspective: [number, number, number, number],
    quaternion: [number, number, number, number]
): Matrix {

    let matrix: Matrix = identity();
// apply perspective
    for (let i = 0; i < 4; i++) {
        matrix[i][3] = perspective[i];
    }

// apply translation
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            matrix[3][i] += translate[j] * matrix[j][i];
        }
    }

// apply rotation
    let x = quaternion[0];
    let y = quaternion[1];
    let z = quaternion[2];
    let w = quaternion[3];

    const rotationMatrix: Matrix = identity();
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

    matrix = multiply(matrix, rotationMatrix);

    let temp: Matrix = identity();

// apply skew
// temp is an identity 4x4 matrix initially
    if (skew[2]) {
        temp[2][1] = skew[2];
        matrix = multiply(matrix, temp);
    }

    if (skew[1]) {
        temp[2][1] = 0;
        temp[2][0] = skew[1];
        matrix = multiply(matrix, temp);
    }

    if (skew[0]) {
        temp[2][0] = 0;
        temp[1][0] = skew[0];
        matrix = multiply(matrix, temp);
    }

// apply scale
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            matrix[i][j] *= scale[i];
        }
    }

    return matrix;
}

// https://drafts.csswg.org/css-transforms-1/#2d-matrix
export function is2DMatrix(matrix: Matrix): boolean {

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