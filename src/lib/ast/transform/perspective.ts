import { identity, multiply } from "./utils.ts";
import type { Matrix } from "./type.d.ts";

export function perspective(x: number | "none", from: Matrix): Matrix {
    const matrix: Matrix = identity();

    matrix[2 * 4 + 3] = x == "none" ? 0 : x === 0 ? Number.NEGATIVE_INFINITY : -1 / x;

    return multiply(from, matrix);
}
