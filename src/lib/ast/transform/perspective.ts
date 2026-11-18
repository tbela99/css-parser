import { multiplyInto, setIdentity } from "./utils.ts";
import type { Matrix } from "./type.d.ts";

/**
 * the perspective matrix. the function multiplies the matrix it receives in place: `from = from × perspective`
 */
const matrix: Matrix = new Float64Array(16);

/**
 * @param x distance, `null` for `none`
 * @param from
 */
export function perspective(x: number | null, from: Matrix): Matrix {
    setIdentity(matrix);
    matrix[2 * 4 + 3] = x === null ? 0 : x === 0 ? Number.NEGATIVE_INFINITY : -1 / x;

    return multiplyInto(from, matrix, from);
}
