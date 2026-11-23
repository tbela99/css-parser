/**
 * Computation of the matrix of a transform list.
 *
 * The tokens are read in place (sibling links), the matrices are module level scratch buffers multiplied in place and
 * the names of the transform functions are classified once per interned string (see {@link transformKind}): a
 * computation only allocates the tokens it creates.
 *
 * @module
 * @internal
 */
import type { Token } from "../../../@types/token.d.ts";
import type { AstArena } from "../arena.ts";
import type { Matrix } from "./type.d.ts";
/**
 * kind of a transform function name, and family of the name (see {@link transformKind})
 */
export declare const enum TransformKind {
    None = 0,
    Translate = 1,
    TranslateX = 2,
    TranslateY = 3,
    TranslateZ = 4,
    Translate3d = 5,
    Rotate = 6,
    RotateX = 7,
    RotateY = 8,
    RotateZ = 9,
    Rotate3d = 10,
    Scale = 11,
    ScaleX = 12,
    ScaleY = 13,
    ScaleZ = 14,
    Scale3d = 15,
    Skew = 16,
    SkewX = 17,
    SkewY = 18,
    Perspective = 19,
    Matrix = 20,
    Matrix3d = 21,
    /**
     * the name of the `transform` property or of a prefixed version (`-webkit-transform`)
     */
    Property = 22,
    /**
     * mask of the kind
     */
    KindMask = 255,
    /**
     * the name starts with `translate`
     */
    TranslateFamily = 256,
    /**
     * the name starts with `rotate`
     */
    RotateFamily = 512,
    /**
     * the name starts with `scale`
     */
    ScaleFamily = 768,
    /**
     * mask of the family
     */
    FamilyMask = 768
}
/**
 * the kind of a string ({@link TransformKind.KindMask}: transform function or transform property) and the family of a
 * transform function name ({@link TransformKind.FamilyMask}). computed once per interned string
 * @param arena
 * @param id interned string id
 */
export declare function transformKind(arena: AstArena, id: number): number;
/**
 * multiply a matrix in place by the matrix of a transform function
 * @param arena
 * @param token
 * @param matrixVar
 * @returns false if the matrix cannot be computed. the matrix is then partially updated
 */
export declare function computeTransform(arena: AstArena, token: Token, matrixVar: Matrix): boolean;
/**
 * multiply a matrix in place by the matrices of a list of transform functions
 * @param arena
 * @param tokens
 * @param start index of the first function
 * @param end index after the last function
 * @param matrixVar
 * @returns false if the matrix cannot be computed. the matrix is then partially updated
 */
export declare function computeMatrix(arena: AstArena, tokens: Token[], start: number, end: number, matrixVar: Matrix): boolean;
/**
 * result of {@link compute}. the arrays are reused by the next computation
 */
export interface ComputedTransform {
    /**
     * the values of the matrix of the transform list, rounded (see `toZero()`). valid until the next computation
     */
    values: Matrix;
    /**
     * the matrix of the transform list: `none`, `matrix()` or `matrix3d()`
     */
    matrix: Token;
    /**
     * the transform list, each run of translations, rotations or scales and each other function minified
     */
    cumulative: Token[];
    /**
     * the minified matrix
     */
    minified: Token[];
    /**
     * true if the tokens of the `cumulative` list are all new tokens (none of the tokens of the transform list is
     * reused)
     */
    created: boolean;
}
/**
 * compute the matrix of a transform list
 * @param arena
 * @param transformList the tokens of the value
 * @returns null if the matrix cannot be computed
 */
export declare function compute(arena: AstArena, transformList: Token[]): ComputedTransform | null;
