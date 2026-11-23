import type { AstArena } from "../arena.ts";
import type { Token } from "../../../@types/index.d.ts";
import type { Matrix } from "./type.d.ts";
/**
 * the shortest transform functions of a matrix: translate → rotate → skew → scale. the matrix is not modified
 * @param arena
 * @param matrix
 * @returns null if the matrix cannot be decomposed
 */
export declare function minify(arena: AstArena, matrix: Matrix): Token[] | null;
/**
 * true if a list of transform functions is equivalent to a matrix (the values differ by at most `epsilon`)
 * @param arena
 * @param data
 * @param b
 */
export declare function eqMatrix(arena: AstArena, data: Matrix, b: Token[]): boolean;
/**
 * shorter form of a transform function: `translate3d(0, 10px, 0)` → `translateY(10px)`, `scale3d(2, 1, 1)` →
 * `scaleX(2)`, `skewX()` → `skew()`. the percentages of the scale functions are converted to numbers
 * @param arena
 * @param transform
 * @returns a new function, or the same function (possibly modified)
 */
export declare function minifyTransformFunctions(arena: AstArena, transform: Token): Token;
