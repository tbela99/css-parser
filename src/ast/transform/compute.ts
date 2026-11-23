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
import { multiplyInto, setIdentity, toZero } from "./utils.ts";
import { EnumToken } from "../types.ts";
import { translate, translate3d, translateX, translateY, translateZ } from "./translate.ts";
import { getAngle, getNumber } from "../../syntax/color/color.ts";
import { rotate, rotate3D } from "./rotate.ts";
import { scale, scale3d, scaleX, scaleY, scaleZ } from "./scale.ts";
import { minify } from "./minify.ts";
import { skew, skewX, skewY } from "./skew.ts";
import { serialize, setMatrixValues } from "./matrix.ts";
import { perspective } from "./perspective.ts";
import type { Matrix } from "./type.d.ts";
import { length2Px } from "../../syntax/syntax.ts";
import { StringDerived } from "../strings.ts";

/**
 * kind of a transform function name, and family of the name (see {@link transformKind})
 */
export const enum TransformKind {
    None = 0,
    Translate,
    TranslateX,
    TranslateY,
    TranslateZ,
    Translate3d,
    Rotate,
    RotateX,
    RotateY,
    RotateZ,
    Rotate3d,
    Scale,
    ScaleX,
    ScaleY,
    ScaleZ,
    Scale3d,
    Skew,
    SkewX,
    SkewY,
    Perspective,
    Matrix,
    Matrix3d,
    /**
     * the name of the `transform` property or of a prefixed version (`-webkit-transform`)
     */
    Property,
    /**
     * mask of the kind
     */
    KindMask = 0xff,
    /**
     * the name starts with `translate`
     */
    TranslateFamily = 1 << 8,
    /**
     * the name starts with `rotate`
     */
    RotateFamily = 2 << 8,
    /**
     * the name starts with `scale`
     */
    ScaleFamily = 3 << 8,
    /**
     * mask of the family
     */
    FamilyMask = 3 << 8,
}

/**
 * the transform functions, by name (case-sensitive)
 */
const transformKinds: Map<string, TransformKind> = new Map([
    ["translate", TransformKind.Translate],
    ["translateX", TransformKind.TranslateX],
    ["translateY", TransformKind.TranslateY],
    ["translateZ", TransformKind.TranslateZ],
    ["translate3d", TransformKind.Translate3d],
    ["rotate", TransformKind.Rotate],
    ["rotateX", TransformKind.RotateX],
    ["rotateY", TransformKind.RotateY],
    ["rotateZ", TransformKind.RotateZ],
    ["rotate3d", TransformKind.Rotate3d],
    ["scale", TransformKind.Scale],
    ["scaleX", TransformKind.ScaleX],
    ["scaleY", TransformKind.ScaleY],
    ["scaleZ", TransformKind.ScaleZ],
    ["scale3d", TransformKind.Scale3d],
    ["skew", TransformKind.Skew],
    ["skewX", TransformKind.SkewX],
    ["skewY", TransformKind.SkewY],
    ["perspective", TransformKind.Perspective],
    ["matrix", TransformKind.Matrix],
    ["matrix3d", TransformKind.Matrix3d],
]);

/**
 * the transform property and its prefixed versions
 */
const transformProperty: RegExp = /^(-[a-z]+-)?transform$/;

/**
 * the arena of the strings read by {@link computeTransformKind}: the function passed to the string table is not a
 * closure (no allocation per call)
 */
let kindArena: AstArena | null = null;

/**
 * see {@link transformKind}
 * @param id
 */
function computeTransformKind(id: number): number {
    const name: string = (kindArena as AstArena).resolveString(id);
    let kind: number = transformKinds.get(name) ?? TransformKind.None;

    if (kind === TransformKind.None && transformProperty.test(name)) {
        return TransformKind.Property;
    }

    if (name.startsWith("translate")) {
        kind |= TransformKind.TranslateFamily;
    } else if (name.startsWith("rotate")) {
        kind |= TransformKind.RotateFamily;
    } else if (name.startsWith("scale")) {
        kind |= TransformKind.ScaleFamily;
    }

    return kind;
}

/**
 * the kind of a string ({@link TransformKind.KindMask}: transform function or transform property) and the family of a
 * transform function name ({@link TransformKind.FamilyMask}). computed once per interned string
 * @param arena
 * @param id interned string id
 */
export function transformKind(arena: AstArena, id: number): number {
    kindArena = arena;

    return arena.stringDerived(id, StringDerived.TransformKind, computeTransformKind);
}

/**
 * numeric arguments of a transform function (the first 16 arguments), reused
 */
const args: Float64Array = new Float64Array(16);

/**
 * the matrix of the values of `matrix()` and `matrix3d()`
 */
const valuesMatrix: Matrix = new Float64Array(16);

/**
 * multiply a matrix in place by the matrix of a transform function
 * @param arena
 * @param token
 * @param matrixVar
 * @returns false if the matrix cannot be computed. the matrix is then partially updated
 */
export function computeTransform(arena: AstArena, token: Token, matrixVar: Matrix): boolean {
    if (arena.dataTypes[token] !== EnumToken.TransformFunctionTokenType) {
        return false;
    }

    const kind: number = transformKind(arena, arena.stringValue[token]) & TransformKind.KindMask;
    // number of arguments
    let count: number = 0;
    let child: Token;
    let typ: EnumToken;

    switch (kind) {
        case TransformKind.Translate:
        case TransformKind.TranslateX:
        case TransformKind.TranslateY:
        case TransformKind.TranslateZ:
        case TransformKind.Translate3d: {
            let val: number | null;

            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];

                if (
                    typ === EnumToken.CommentTokenType ||
                    typ === EnumToken.CommaTokenType ||
                    typ === EnumToken.WhitespaceTokenType
                ) {
                    continue;
                }

                val = length2Px(arena, child);

                if (val == null) {
                    return false;
                }

                if (count < 16) {
                    args[count] = val;
                }

                count++;
            }

            if (
                count === 0 ||
                count > (kind === TransformKind.Translate3d ? 3 : kind === TransformKind.Translate ? 2 : 1)
            ) {
                return false;
            }

            if (kind === TransformKind.TranslateX) {
                translateX(args[0], matrixVar);
            } else if (kind === TransformKind.TranslateY) {
                translateY(args[0], matrixVar);
            } else if (kind === TransformKind.TranslateZ) {
                translateZ(args[0], matrixVar);
            } else if (kind === TransformKind.Translate) {
                translate(args[0], count > 1 ? args[1] : undefined, matrixVar);
            } else {
                translate3d(args[0], count > 1 ? args[1] : undefined, count > 2 ? args[2] : undefined, matrixVar);
            }

            return true;
        }

        case TransformKind.Rotate:
        case TransformKind.RotateX:
        case TransformKind.RotateY:
        case TransformKind.RotateZ:
        case TransformKind.Rotate3d: {
            let x: number = 0;
            let y: number = 0;
            let z: number = 0;
            // the first three arguments and the last argument
            let first: Token = 0;
            let second: Token = 0;
            let third: Token = 0;
            let last: Token = 0;

            // the whitespace tokens are arguments
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];

                if (typ === EnumToken.CommentTokenType || typ === EnumToken.CommaTokenType) {
                    continue;
                }

                if (count === 0) {
                    first = child;
                } else if (count === 1) {
                    second = child;
                } else if (count === 2) {
                    third = child;
                }

                last = child;
                count++;
            }

            if (count !== (kind === TransformKind.Rotate3d ? 4 : 1)) {
                return false;
            }

            if (kind === TransformKind.RotateX) {
                x = 1;
            } else if (kind === TransformKind.RotateY) {
                y = 1;
            } else if (kind === TransformKind.Rotate || kind === TransformKind.RotateZ) {
                z = 1;
            } else {
                x = getNumber(arena, first);
                y = getNumber(arena, second);
                z = getNumber(arena, third);
            }

            const angle: number = getAngle(arena, last);

            if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z) || Number.isNaN(angle)) {
                return false;
            }

            if (kind === TransformKind.Rotate || kind === TransformKind.RotateZ) {
                rotate(angle * 2 * Math.PI, matrixVar);
            } else {
                rotate3D(angle * 2 * Math.PI, x, y, z, matrixVar);
            }

            return true;
        }

        case TransformKind.Scale:
        case TransformKind.ScaleX:
        case TransformKind.ScaleY:
        case TransformKind.ScaleZ:
        case TransformKind.Scale3d:
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];

                if (typ === EnumToken.CommentTokenType || typ === EnumToken.CommaTokenType) {
                    continue;
                }

                // whitespace tokens are not allowed
                if (typ !== EnumToken.NumberTokenType && typ !== EnumToken.PercentageTokenType) {
                    return false;
                }

                if (count < 16) {
                    args[count] = getNumber(arena, child);
                }

                count++;
            }

            if (kind === TransformKind.Scale3d) {
                if (count !== 3) {
                    return false;
                }

                scale3d(args[0], args[1], args[2], matrixVar);
            } else if (kind === TransformKind.Scale) {
                if (count !== 1 && count !== 2) {
                    return false;
                }

                scale(args[0], count > 1 ? args[1] : args[0], matrixVar);
            } else if (count !== 1) {
                return false;
            } else if (kind === TransformKind.ScaleX) {
                scaleX(args[0], matrixVar);
            } else if (kind === TransformKind.ScaleY) {
                scaleY(args[0], matrixVar);
            } else {
                scaleZ(args[0], matrixVar);
            }

            return true;

        case TransformKind.Skew:
        case TransformKind.SkewX:
        case TransformKind.SkewY:
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];

                if (
                    typ === EnumToken.CommentTokenType ||
                    typ === EnumToken.CommaTokenType ||
                    typ === EnumToken.WhitespaceTokenType
                ) {
                    continue;
                }

                if (count < 16) {
                    args[count] = getAngle(arena, child) * 2 * Math.PI;
                }

                count++;
            }

            if (count === 0 || count > (kind === TransformKind.Skew ? 2 : 1)) {
                return false;
            }

            if (kind === TransformKind.Skew) {
                skew(args[0], count > 1 ? args[1] : undefined, matrixVar);
            } else if (kind === TransformKind.SkewX) {
                skewX(args[0], matrixVar);
            } else {
                skewY(args[0], matrixVar);
            }

            return true;

        case TransformKind.Perspective: {
            // null for `none`
            let distance: number | null = null;
            let val: number | null;

            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];

                if (typ === EnumToken.CommentTokenType || typ === EnumToken.WhitespaceTokenType) {
                    continue;
                }

                count++;

                if (typ === EnumToken.IdenTokenType && arena.resolveString(arena.stringValue[child]) === "none") {
                    distance = null;
                    continue;
                }

                val = length2Px(arena, child);

                if (val == null) {
                    return false;
                }

                distance = val;
            }

            if (count !== 1) {
                return false;
            }

            perspective(distance, matrixVar);
            return true;
        }

        case TransformKind.Matrix:
        case TransformKind.Matrix3d:
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];

                if (
                    typ === EnumToken.WhitespaceTokenType ||
                    typ === EnumToken.CommentTokenType ||
                    typ === EnumToken.CommaTokenType
                ) {
                    continue;
                }

                if (count < 16) {
                    args[count] = getNumber(arena, child);
                }

                count++;
            }

            if (count !== (kind === TransformKind.Matrix ? 6 : 16)) {
                return false;
            }

            multiplyInto(matrixVar, setMatrixValues(args, count, valuesMatrix), matrixVar);
            return true;
    }

    return false;
}

/**
 * multiply a matrix in place by the matrices of a list of transform functions
 * @param arena
 * @param tokens
 * @param start index of the first function
 * @param end index after the last function
 * @param matrixVar
 * @returns false if the matrix cannot be computed. the matrix is then partially updated
 */
export function computeMatrix(
    arena: AstArena,
    tokens: Token[],
    start: number,
    end: number,
    matrixVar: Matrix,
): boolean {
    for (let i = start; i < end; i++) {
        if (!computeTransform(arena, tokens[i], matrixVar)) {
            return false;
        }
    }

    return true;
}

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
 * the matrix of the transform list
 */
const transformMatrix: Matrix = new Float64Array(16);

/**
 * the matrix of a run of functions of the transform list
 */
const runMatrix: Matrix = new Float64Array(16);

/**
 * the transform functions of the runs: index of the first token of each run, then the end of the last run. the arrays
 * are reused: their length is not reset (see {@link runCount} and {@link tokenCount})
 */
const runs: number[] = [];

/**
 * the tokens of the transform list without the comments and the whitespace tokens, see {@link splitTransformList}
 */
const tokens: Token[] = [];

/**
 * number of values of {@link runs}
 */
let runCount: number = 0;

/**
 * number of values of {@link tokens}
 */
let tokenCount: number = 0;

/**
 * the result of the computation, reused
 */
const computed: ComputedTransform = {
    values: transformMatrix,
    matrix: 0,
    cumulative: [],
    minified: [],
    created: true,
};

/**
 * compute the matrix of a transform list
 * @param arena
 * @param transformList the tokens of the value
 * @returns null if the matrix cannot be computed
 */
export function compute(arena: AstArena, transformList: Token[]): ComputedTransform | null {
    let token: Token;
    let child: Token;
    let kind: number;
    let typ: EnumToken;

    // all transform function arguments must be 0 or scale(1)
    for (let i = 0; i < transformList.length; i++) {
        token = transformList[i];
        kind = transformKind(arena, arena.stringValue[token]) & TransformKind.KindMask;

        if (
            kind === TransformKind.Rotate ||
            kind === TransformKind.RotateX ||
            kind === TransformKind.RotateY ||
            kind === TransformKind.RotateZ ||
            kind === TransformKind.Rotate3d
        ) {
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];

                if (typ === EnumToken.WhitespaceTokenType || typ === EnumToken.CommaTokenType) {
                    continue;
                }

                if (
                    (typ !== EnumToken.AngleTokenType &&
                        typ !== EnumToken.NumberTokenType &&
                        typ !== EnumToken.PercentageTokenType) ||
                    // angle >= 360deg, do not transform
                    Math.abs(getAngle(arena, child)) >= 1
                ) {
                    return null;
                }
            }
        }
    }

    splitTransformList(arena, transformList);

    // a new array: it may become the value of the declaration
    const cumulative: Token[] = [];
    const matrix: Matrix = setIdentity(transformMatrix);
    let minified: Token[] | null;
    // the runs produced tokens: `none` is the value of an empty list
    let empty: boolean = true;

    computed.created = true;

    for (let run = 0; run < runCount - 1; run++) {
        const start: number = runs[run];
        const end: number = runs[run + 1];

        if (!computeMatrix(arena, tokens, start, end, setIdentity(runMatrix))) {
            return null;
        }

        multiplyInto(matrix, runMatrix, matrix);

        minified = minify(arena, runMatrix);

        if (minified == null) {
            computed.created = false;
            empty = false;

            for (let i = start; i < end; i++) {
                pushTransform(arena, cumulative, tokens[i]);
            }
        } else {
            empty &&= minified.length === 0;

            for (let i = 0; i < minified.length; i++) {
                pushTransform(arena, cumulative, minified[i]);
            }
        }
    }

    const serialized: Token = serialize(arena, matrix);

    if (!empty && cumulative.length === 0) {
        cumulative.push(arena.createToken(EnumToken.IdenTokenType, "none"));
    }

    computed.cumulative = cumulative;
    computed.matrix = serialize(arena, toZero(matrix));
    computed.minified = minify(arena, matrix) ?? [serialized];

    return computed;
}

/**
 * append a token to a transform list. `none` is omitted
 * @param arena
 * @param list
 * @param token
 */
function pushTransform(arena: AstArena, list: Token[], token: Token): void {
    if (
        arena.dataTypes[token] !== EnumToken.IdenTokenType ||
        arena.resolveString(arena.stringValue[token]) !== "none"
    ) {
        list.push(token);
    }
}

/**
 * split a transform list into runs (see {@link runs} and {@link tokens}): the consecutive translations, rotations and
 * scales are grouped, the other tokens are alone. the comments and the whitespace tokens are ignored
 * @param arena
 * @param transformList
 */
function splitTransformList(arena: AstArena, transformList: Token[]): void {
    // family of the current run
    let pattern: number = 0;
    let family: number;
    let typ: EnumToken;
    let token: Token;

    runCount = 0;
    // the runs index the list without the ignored tokens
    tokenCount = 0;

    for (let i = 0; i < transformList.length; i++) {
        token = transformList[i];
        typ = arena.dataTypes[token];

        if (typ === EnumToken.CommentTokenType || typ === EnumToken.WhitespaceTokenType) {
            continue;
        }

        if (typ === EnumToken.TransformFunctionTokenType) {
            family = transformKind(arena, arena.stringValue[token]) & TransformKind.FamilyMask;

            if (pattern !== 0 && family === pattern) {
                // continue the current run
                tokens[tokenCount++] = token;
                continue;
            }

            pattern = family;
        }

        runs[runCount++] = tokenCount;
        tokens[tokenCount++] = token;
    }

    runs[runCount++] = tokenCount;
}
