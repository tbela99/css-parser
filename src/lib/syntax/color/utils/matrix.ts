
// from https://www.w3.org/TR/css-color-4/multiply-matrices.js
/**
 * Simple matrix (and vector) multiplication
 * Warning: No error handling for incompatible dimensions!
 * @author Lea Verou 2020 MIT License
 */
// A is m x n. B is n x p. product is m x p.
export function multiplyMatrices(A: number[] | number[][], B: number[] | number[][]): number[] {
    let m: number = A.length;

    if (!Array.isArray(A[0])) {
        // A is vector, convert to [[a, b, c, ...]]
        A = <number[][]>[A];
    }

    if (!Array.isArray(B[0])) {
        // B is vector, convert to [[a], [b], [c], ...]]
        B = <number[][]>(<number[]>B).map((x: number) => [x]);
    }

    let p: number = (<number[][]>B)[0].length;
    let B_cols: number[][] = (<number[][]>B)[0].map((_: number, i: number) => (<number[][]>B).map((x: number[]) => x[i])); // transpose B
    let product: number[][] | number[] = (<number[][]>A).map((row: number[]) => B_cols.map((col: number[]): number => {

        if (!Array.isArray(row)) {

            return col.reduce((a: number, c: number) => a + c * row, 0);
        }

        return row.reduce((a: number, c: number, i: number) => a + c * (col[i] || 0), 0);
    }));

    if (m === 1) {

        product = <number[]>product[0]; // Avoid [[a, b, c, ...]]
    }

    if (p === 1) {

        return (<number[][]>product).map((x: number[]) => x[0]); // Avoid [[a], [b], [c], ...]]
    }

    return <number[]>product;
}
