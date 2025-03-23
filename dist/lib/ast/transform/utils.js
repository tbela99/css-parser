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
    return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2];
}
function combine(point1, point2, ascl, bscl) {
    return [point1[0] * ascl + point2[0] * bscl, point1[1] * ascl + point2[1] * bscl, point1[2] * ascl + point2[2] * bscl];
}
function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function decompose(matrix) {
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
    let translate = [0, 0, 0];
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
    }
    else {
        // No perspective.
        perspective[0] = perspective[1] = perspective[2] = 0;
        perspective[3] = 1;
    }
    // Next take care of translation
    for (let i = 0; i < 3; i++) {
        translate[i] = matrix[3][i];
    }
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
    return {
        skew,
        scale,
        translate,
        perspective,
        quaternion
    };
}

export { decompose, identity };
