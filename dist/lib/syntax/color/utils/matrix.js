// from https://www.w3.org/TR/css-color-4/multiply-matrices.js
/**
 * Simple matrix (and vector) multiplication
 * Warning: No error handling for incompatible dimensions!
 * @author Lea Verou 2020 MIT License
 */
// A is m x n. B is n x p. product is m x p.
function multiplyMatrices(A, B) {
    // if (!Array.isArray(A[0])) {
    //     // A is vector, convert to [[a, b, c, ...]]
    //     A = <number[][]>[A];
    // }
    if (!Array.isArray(B[0])) {
        // B is vector, convert to [[a], [b], [c], ...]]
        B = B.map((x) => [x]);
    }
    let p = B[0].length;
    let B_cols = B[0].map((_, i) => B.map((x) => x[i])); // transpose B
    // @ts-expect-error
    let product = A.map((row) => B_cols.map((col) => {
        // if (!Array.isArray(row)) {
        //     return col.reduce((a: number, c: number) => a + c * row, 0);
        // }
        return row.reduce((a, c, i) => a + c * (col[i] || 0), 0);
    }));
    // if (m === 1) {
    //     product = <number[]>product[0]; // Avoid [[a, b, c, ...]]
    // }
    if (p === 1) {
        // @ts-expect-error
        return product.map((x) => x[0]); // Avoid [[a], [b], [c], ...]]
    }
    return product;
}

export { multiplyMatrices };
