import type { AstArena } from "../arena.ts";
import type { Token } from "../../../@types/index.d.ts";
import type { Matrix } from "./type.d.ts";
/**
 * set the values of a `matrix()` (6 values) or of a `matrix3d()` (16 values) function, column-major order. the other
 * values of a `matrix()` are the values of the identity matrix
 * @param values
 * @param count number of values: 6 or 16
 * @param matrix the matrix that receives the values
 */
export declare function setMatrixValues(values: ArrayLike<number>, count: number, matrix: Matrix): Matrix;
/**
 * the tokens of a matrix: `none`, `matrix()` if it is a 2d matrix, `matrix3d()` otherwise
 * @param arena
 * @param matrix
 */
export declare function serialize(arena: AstArena, matrix: Matrix): Token;
