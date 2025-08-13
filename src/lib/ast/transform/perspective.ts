import type {Matrix} from "./utils.ts";
import {identity, multiply} from "./utils.ts";
import type {IdentToken} from "../../../@types/index.d.ts";

export function perspective(x: number | IdentToken, from: Matrix): Matrix {

    const matrix: Matrix = identity();
    // @ts-ignore
    matrix[2* 4 +3] = typeof x == 'object' && x.val == 'none' ? 0 : x == 0 ? Number.NEGATIVE_INFINITY : -1 / x;

    return multiply(from, matrix);
}
