import { decompose, identityMatrix, multiplyInto, round, setIdentity, toZeroValue } from "./utils.ts";
import type { AstArena } from "../arena.ts";
import { epsilon } from "../../syntax/constants.ts";
import { EnumToken } from "../types.ts";
import type { Token } from "../../../@types/index.d.ts";
import { computeTransform, TransformKind, transformKind } from "./compute.ts";
import type { DecomposedMatrix3D, Matrix } from "./type.d.ts";

/**
 * the decomposition of the matrix being minified, reused
 */
const decomposed: DecomposedMatrix3D = {
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    skewXY: 0,
    skewXZ: 0,
    skewYZ: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    rotateAngle: 0,
    perspectiveX: 0,
    perspectiveY: 0,
    perspectiveZ: 0,
    perspectiveW: 1,
};

/**
 * a length in pixels
 * @param arena
 * @param value
 */
function px(arena: AstArena, value: number): Token {
    return arena.createToken(EnumToken.LengthTokenType, value, "px");
}

/**
 * an angle in degrees
 * @param arena
 * @param value
 */
function deg(arena: AstArena, value: number): Token {
    return arena.createToken(EnumToken.AngleTokenType, value, "deg");
}

/**
 * a number
 * @param arena
 * @param value
 */
function num(arena: AstArena, value: number): Token {
    return arena.createToken(EnumToken.NumberTokenType, value);
}

/**
 * a comma
 * @param arena
 */
function comma(arena: AstArena): Token {
    return arena.createToken(EnumToken.CommaTokenType);
}

/**
 * the shortest transform functions of a matrix: translate → rotate → skew → scale. the matrix is not modified
 * @param arena
 * @param matrix
 * @returns null if the matrix cannot be decomposed
 */
export function minify(arena: AstArena, matrix: Matrix): Token[] | null {
    if (!decompose(matrix, decomposed)) {
        return null;
    }

    const result: Token[] = [];

    // check identity
    if (
        !(
            round(decomposed.translateX) === 0 &&
            round(decomposed.translateY) === 0 &&
            round(decomposed.translateZ) === 0
        )
    ) {
        const x: boolean = round(decomposed.translateX) !== 0;
        const y: boolean = round(decomposed.translateY) !== 0;
        const z: boolean = round(decomposed.translateZ) !== 0;

        if (+x + +y + +z === 1) {
            if (x) {
                result.push(
                    arena.createFunction(EnumToken.TransformFunctionTokenType, "translate", [
                        px(arena, round(decomposed.translateX)),
                    ]),
                );
            } else {
                result.push(
                    arena.createFunction(EnumToken.TransformFunctionTokenType, y ? "translateY" : "translateZ", [
                        px(arena, round(y ? decomposed.translateY : decomposed.translateZ)),
                    ]),
                );
            }
        } else if (z) {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "translate3d", [
                    decomposed.translateX === 0 ? num(arena, 0) : px(arena, round(decomposed.translateX)),
                    comma(arena),
                    decomposed.translateY === 0 ? num(arena, 0) : px(arena, round(decomposed.translateY)),
                    comma(arena),
                    px(arena, round(decomposed.translateZ)),
                ]),
            );
        } else {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "translate", [
                    px(arena, round(decomposed.translateX)),
                    comma(arena),
                    px(arena, round(decomposed.translateY)),
                ]),
            );
        }
    }

    if (round(decomposed.rotateAngle) !== 0) {
        const x: number = decomposed.rotateX;
        const y: number = decomposed.rotateY;
        const z: number = decomposed.rotateZ;
        const angle: number = decomposed.rotateAngle;

        if (y === 0 && z === 0) {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "rotateX", [deg(arena, round(angle))]),
            );
        } else if (x === 0 && z === 0) {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "rotateY", [deg(arena, round(angle))]),
            );
        } else if (x === 0 && y === 0) {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "rotate", [deg(arena, round(angle))]),
            );
        } else {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "rotate3d", [
                    num(arena, round(x)),
                    comma(arena),
                    num(arena, round(y)),
                    comma(arena),
                    num(arena, round(z)),
                    comma(arena),
                    deg(arena, round(angle)),
                ]),
            );
        }
    }

    if (!(round(decomposed.skewXY) === 0 && round(decomposed.skewXZ) === 0)) {
        // a single angle
        const single: boolean = round(decomposed.skewXZ) === 0;
        const skewX: number = round((Math.atan(decomposed.skewXY) * 180) / Math.PI);
        const skewY: number = round((Math.atan(decomposed.skewXZ) * 180) / Math.PI);

        if (single) {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "skew", [deg(arena, round(skewX))]),
            );
        } else {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "skew", [
                    deg(arena, round(skewX)),
                    comma(arena),
                    deg(arena, round(skewY)),
                ]),
            );
        }
    }

    if (!(round(decomposed.scaleX) === 1 && round(decomposed.scaleY) === 1 && round(decomposed.scaleZ) === 1)) {
        const sx: number = toZeroValue(decomposed.scaleX);
        const sy: number = toZeroValue(decomposed.scaleY);
        const sz: number = toZeroValue(decomposed.scaleZ);
        const x: boolean = sx !== 1;
        const y: boolean = sy !== 1;
        const z: boolean = sz !== 1;

        if (+x + +y + +z === 1) {
            result.push(
                arena.createFunction(
                    EnumToken.TransformFunctionTokenType,
                    x ? "scaleX" : y ? "scaleY" : "scaleZ",
                    [num(arena, round(x ? sx : y ? sy : sz))],
                ),
            );
        } else if (!z) {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "scale", [
                    num(arena, round(sx)),
                    comma(arena),
                    num(arena, round(sy)),
                ]),
            );
        } else {
            result.push(
                arena.createFunction(EnumToken.TransformFunctionTokenType, "scale3d", [
                    num(arena, round(sx)),
                    comma(arena),
                    num(arena, round(sy)),
                    comma(arena),
                    num(arena, round(sz)),
                ]),
            );
        }
    }

    // identity
    if (result.length === 0 || (result.length === 1 && eqMatrix(arena, identityMatrix, result))) {
        result.length = 0;
        result.push(arena.createToken(EnumToken.IdenTokenType, "none"));
    }

    return result;
}

/**
 * the product of the matrices of the functions compared by {@link eqMatrix}
 */
const productMatrix: Matrix = new Float64Array(16);

/**
 * the matrix of a function compared by {@link eqMatrix}
 */
const functionMatrix: Matrix = new Float64Array(16);

/**
 * true if a list of transform functions is equivalent to a matrix (the values differ by at most `epsilon`)
 * @param arena
 * @param data
 * @param b
 */
export function eqMatrix(arena: AstArena, data: Matrix, b: Token[]): boolean {
    const mat: Matrix = setIdentity(productMatrix);

    for (let i = 0; i < b.length; i++) {
        if (!computeTransform(arena, b[i], setIdentity(functionMatrix))) {
            return false;
        }

        multiplyInto(mat, functionMatrix, mat);
    }

    for (let i = 0; i < 16; i++) {
        if (Math.abs(mat[i] - data[i]) > epsilon) {
            return false;
        }
    }

    return true;
}

/**
 * shorter form of a transform function: `translate3d(0, 10px, 0)` → `translateY(10px)`, `scale3d(2, 1, 1)` →
 * `scaleX(2)`, `skewX()` → `skew()`. the percentages of the scale functions are converted to numbers
 * @param arena
 * @param transform
 * @returns a new function, or the same function (possibly modified)
 */
export function minifyTransformFunctions(arena: AstArena, transform: Token): Token {
    const kind: number = transformKind(arena, arena.stringValue[transform]) & TransformKind.KindMask;

    if (kind === TransformKind.SkewX) {
        // inlined: arena.setStr(transform, "skew")
        arena.stringValue[transform] = arena.internString("skew");
        return transform;
    }

    if (
        kind !== TransformKind.Translate &&
        kind !== TransformKind.Translate3d &&
        kind !== TransformKind.Scale &&
        kind !== TransformKind.Scale3d
    ) {
        return transform;
    }

    const isScale: boolean = kind === TransformKind.Scale || kind === TransformKind.Scale3d;
    let typ: EnumToken;
    // the first three arguments
    let first: Token = 0;
    let second: Token = 0;
    let third: Token = 0;
    let count: number = 0;

    for (let token = arena.firstToken[transform]; token !== 0; token = arena.nextSibling[token]) {
        typ = arena.dataTypes[token];

        if (
            typ === EnumToken.CommentTokenType ||
            typ === EnumToken.WhitespaceTokenType ||
            typ === EnumToken.CommaTokenType
        ) {
            continue;
        }

        if (
            typ !== EnumToken.NumberTokenType &&
            typ !== EnumToken.LengthTokenType &&
            typ !== EnumToken.AngleTokenType &&
            typ !== EnumToken.PercentageTokenType
        ) {
            return transform;
        }

        if (typ === EnumToken.PercentageTokenType && isScale && !arena.hasFraction(token)) {
            arena.dataTypes[token] = EnumToken.NumberTokenType;
            arena.numericValue[token] /= 100;
        }

        if (count === 0) {
            first = token;
        } else if (count === 1) {
            second = token;
        } else if (count === 2) {
            third = token;
        }

        count++;
    }

    if (count === 0) {
        return transform;
    }

    if ((kind === TransformKind.Translate || kind === TransformKind.Scale) && count > 2) {
        return transform;
    }

    const ignoredValue: number = isScale ? 1 : 0;
    // the axes whose value is not the ignored value
    const x: boolean = arena.numericValue[first] !== ignoredValue;
    const y: boolean = count > 1 && arena.numericValue[second] !== ignoredValue;
    const z: boolean = count > 2 && arena.numericValue[third] !== ignoredValue;
    const size: number = +x + +y + +z;

    if (size === 2 && z) {
        return transform;
    }

    if (!isScale) {
        if (size === 0) {
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "translate", [
                arena.createToken(EnumToken.NumberTokenType, 0),
            ]);
        }

        if (size === 1) {
            return arena.createFunction(
                EnumToken.TransformFunctionTokenType,
                x ? "translate" : y ? "translateY" : "translateZ",
                [x ? first : y ? second : third],
            );
        }

        if (size === 2) {
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "translate", [
                first,
                arena.createToken(EnumToken.CommaTokenType),
                second,
            ]);
        }
    } else {
        if (size === 0) {
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "scale", [
                arena.createToken(EnumToken.NumberTokenType, 1),
            ]);
        }

        if (size === 1) {
            return arena.createFunction(
                EnumToken.TransformFunctionTokenType,
                x ? "scaleX" : y ? "scaleY" : "scaleZ",
                [x ? first : y ? second : third],
            );
        }

        if (size === 2) {
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "scale", [
                first,
                arena.createToken(EnumToken.CommaTokenType),
                second,
            ]);
        }
    }

    return transform;
}
