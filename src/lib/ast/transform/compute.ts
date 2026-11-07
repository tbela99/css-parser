import type { Token } from "../../../@types/token.d.ts";
import type { AstArena } from "../arena.ts";
import { identity, multiply, toZero } from "./utils.ts";
import { EnumToken } from "../types.ts";
import { stripCommaToken } from "../../validation/utils/list.ts";
import { translate, translate3d, translateX, translateY, translateZ } from "./translate.ts";
import { getAngle, getNumber } from "../../syntax/color/color.ts";
import { rotate, rotate3D } from "./rotate.ts";
import { scale, scale3d, scaleX, scaleY, scaleZ } from "./scale.ts";
import { minify } from "./minify.ts";
import { skew, skewX, skewY } from "./skew.ts";
import { matrix, serialize } from "./matrix.ts";
import { perspective } from "./perspective.ts";
import type { Matrix } from "./type.d.ts";
import { transformFunctions } from "../../syntax/constants.ts";
import { length2Px } from "../../syntax/syntax.ts";

export function compute(arena: AstArena, transformLists: Token[]): {
    matrix: Token;
    cumulative: Token[];
    minified: Token[];
} | null {
    transformLists = transformLists.slice();
    stripCommaToken(arena, transformLists);

    let matrix: Matrix | null = identity();
    let mat: Matrix;
    let transforms: Token[];
    const cumulative: Token[] = [];

    // all transform function arguments must be 0 or scale(1)
    for (const transform of transformLists) {
        switch (arena.strings[arena.stringValue[transform]]) {
            case "rotate":
            case "rotateX":
            case "rotateY":
            case "rotateZ":
            case "rotate3d":
                for (const child of arena.tokens(transform)) {
                    if (arena.dataTypes[child] == EnumToken.WhitespaceTokenType || arena.dataTypes[child] == EnumToken.CommaTokenType) {
                        continue;
                    }

                    if (
                        (arena.dataTypes[child] != EnumToken.AngleTokenType &&
                            arena.dataTypes[child] != EnumToken.NumberTokenType &&
                            arena.dataTypes[child] != EnumToken.PercentageTokenType) ||
                        // angle >= 360deg, do not transform
                        Math.abs(getAngle(arena, child)) >= 1
                    ) {
                        return null;
                    }
                }

                // break;
        }
    }

    for (const transformList of splitTransformList(arena, transformLists)) {
        mat = (computeMatrix(arena, transformList, identity()) as Matrix);

        if (mat == null) {
            return null;
        }

        matrix = multiply(matrix, mat) as Matrix;

        transforms = (minify(arena, mat) as number[]) ?? transformList;

        for (let i = 0; i < transforms.length; i++) {
            cumulative.push(transforms[i]);
        }
    }

    const serialized: Token = serialize(arena, matrix);

    if (cumulative.length > 0) {
        for (let i = 0; i < cumulative.length; i++) {
            if (arena.dataTypes[cumulative[i]] == EnumToken.IdenTokenType && arena.strings[arena.stringValue[cumulative[i]]] == "none") {
                cumulative.splice(i--, 1);
            }
        }

        if (cumulative.length == 0) {
            cumulative.push(arena.createToken(EnumToken.IdenTokenType, "none"));
        }
    }

    const result = {
        matrix: serialize(arena, toZero(matrix) as Matrix),
        cumulative,
        minified: minify(arena, matrix) ?? [serialized],
    };

    return result;
}

export function computeMatrix(arena: AstArena, transformList: Token[], matrixVar: Matrix): Matrix | null {
    let values: number[] = [];
    let val: number | null;
    let i: number = 0;

    for (; i < transformList.length; i++) {
        if (
            arena.dataTypes[transformList[i]] != EnumToken.TransformFunctionTokenType ||
            !transformFunctions.includes(arena.strings[arena.stringValue[transformList[i]]])
        ) {
            return null;
        }

        switch (arena.strings[arena.stringValue[transformList[i]]]) {
            case "translate":
            case "translateX":
            case "translateY":
            case "translateZ":
            case "translate3d":
                {
                    values.length = 0;

                    const children = (stripCommaToken(arena, arena.tokens(transformList[i])) ?? []);
                    const valCount: number =
                        arena.strings[arena.stringValue[transformList[i]]] == "translate3d"
                            ? 3
                            : arena.strings[arena.stringValue[transformList[i]]] == "translate"
                              ? 2
                              : 1;

                    for (let j = 0; j < children.length; j++) {
                        if (arena.dataTypes[children[j]] == EnumToken.WhitespaceTokenType) {
                            continue;
                        }

                        val = length2Px(arena, children[j]);

                        if (val == null) {
                            return null;
                        }

                        values.push(val as number);
                    }

                    if (values.length == 0 || values.length > valCount) {
                        return null;
                    }

                    if (arena.strings[arena.stringValue[transformList[i]]] == "translateX") {
                        matrixVar = translateX(values[0], matrixVar);
                    } else if (arena.strings[arena.stringValue[transformList[i]]] == "translateY") {
                        matrixVar = translateY(values[0], matrixVar);
                    } else if (arena.strings[arena.stringValue[transformList[i]]] == "translateZ") {
                        matrixVar = translateZ(values[0], matrixVar);
                    } else if (arena.strings[arena.stringValue[transformList[i]]] == "translate") {
                        matrixVar = translate(values as [number] | [number, number], matrixVar);
                    } else {
                        // @ts-ignore
                        matrixVar = translate3d(values as [number] | [number, number], matrixVar);
                    }
                }
                break;

            case "rotate":
            case "rotateX":
            case "rotateY":
            case "rotateZ":
            case "rotate3d":
                {
                    let x: number = 0;
                    let y: number = 0;
                    let z: number = 0;

                    let angle: number;
                    let values: Token[] = [];
                    let valuesCount: number = arena.strings[arena.stringValue[transformList[i]]] == "rotate3d" ? 4 : 1;

                    for (const child of (stripCommaToken(arena, arena.tokens(transformList[i])) ?? [])) {
                        values.push(child);

                        if (arena.strings[arena.stringValue[transformList[i]]] == "rotateX") {
                            x = 1;
                        } else if (arena.strings[arena.stringValue[transformList[i]]] == "rotateY") {
                            y = 1;
                        } else if (
                            arena.strings[arena.stringValue[transformList[i]]] == "rotate" ||
                            arena.strings[arena.stringValue[transformList[i]]] == "rotateZ"
                        ) {
                            z = 1;
                        }
                    }

                    if (values.length != valuesCount) {
                        return null;
                    }

                    if (arena.strings[arena.stringValue[transformList[i]]] == "rotate3d") {
                        x = getNumber(arena, values[0]);
                        y = getNumber(arena, values[1]);
                        z = getNumber(arena, values[2]);
                    }

                    angle = getAngle(arena, values[values.length - 1]);

                    if ([x, y, z, angle].some((t) => typeof t != "number" || Number.isNaN(+t))) {
                        return null;
                    }

                    if (
                        arena.strings[arena.stringValue[transformList[i]]] == "rotate" ||
                        arena.strings[arena.stringValue[transformList[i]]] == "rotateZ"
                    ) {
                        matrixVar = rotate(angle * 2 * Math.PI, matrixVar);
                    } else {
                        matrixVar = rotate3D(angle * 2 * Math.PI, x, y, z, matrixVar);
                    }
                }

                break;

            case "scale":
            case "scaleX":
            case "scaleY":
            case "scaleZ":
            case "scale3d":
                {
                    values.length = 0;

                    let child: Token;

                    const children = (stripCommaToken(arena, arena.tokens(transformList[i])) ?? []);

                    for (let k = 0; k < children.length; k++) {
                        child = children[k];

                        if (arena.dataTypes[child] != EnumToken.NumberTokenType && arena.dataTypes[child] != EnumToken.PercentageTokenType) {
                            return null;
                        }

                        values.push(getNumber(arena, child));
                    }

                    if (arena.strings[arena.stringValue[transformList[i]]] == "scale3d") {
                        if (values.length != 3) {
                            return null;
                        }

                        matrixVar = scale3d(values[0], values[1], values[2], matrixVar);
                        break;
                    }

                    if (arena.strings[arena.stringValue[transformList[i]]] == "scale") {
                        if (values.length != 1 && values.length != 2) {
                            return null;
                        }

                        matrixVar = scale(values[0], values[1] ?? values[0], matrixVar);
                        break;
                    }

                    if (values.length != 1) {
                        return null;
                    } else if (arena.strings[arena.stringValue[transformList[i]]] == "scaleX") {
                        matrixVar = scaleX(values[0], matrixVar);
                    } else if (arena.strings[arena.stringValue[transformList[i]]] == "scaleY") {
                        matrixVar = scaleY(values[0], matrixVar);
                    } else if (arena.strings[arena.stringValue[transformList[i]]] == "scaleZ") {
                        matrixVar = scaleZ(values[0], matrixVar);
                    }
                }

                break;

            case "skew":
            case "skewX":
            case "skewY":
                {
                    values.length = 0;

                    let child: Token;
                    let value: number | null;

                    for (let k = 0; k < arena.tokens(transformList[i]).length; k++) {
                        child = arena.tokens(transformList[i])[k];

                        if (
                            arena.dataTypes[child] == EnumToken.CommentTokenType ||
                            arena.dataTypes[child] == EnumToken.CommaTokenType ||
                            arena.dataTypes[child] == EnumToken.WhitespaceTokenType
                        ) {
                            continue;
                        }

                        value = getAngle(arena, child);
                        values.push(value * 2 * Math.PI);
                    }

                    if (
                        values.length == 0 ||
                        values.length > (arena.strings[arena.stringValue[transformList[i]]] == "skew" ? 2 : 1)
                    ) {
                        return null;
                    }

                    if (arena.strings[arena.stringValue[transformList[i]]] == "skew") {
                        matrixVar = skew(values as [number] | [number, number], matrixVar);
                    } else {
                        matrixVar =
                            arena.strings[arena.stringValue[transformList[i]]] == "skewX"
                                ? skewX(values[0], matrixVar)
                                : skewY(values[0], matrixVar);
                    }
                }

                break;

            case "perspective":
                {
                    const values: Array<number | "none"> = [];

                    let child: Token;
                    let value: number | null;

                    for (let k = 0; k < arena.tokens(transformList[i]).length; k++) {
                        child = arena.tokens(transformList[i])[k];

                        if (arena.dataTypes[child] == EnumToken.CommentTokenType || arena.dataTypes[child] == EnumToken.WhitespaceTokenType) {
                            continue;
                        }

                        if (arena.dataTypes[child] == EnumToken.IdenTokenType && arena.strings[arena.stringValue[child]] == "none") {
                            values.push("none");
                            continue;
                        }

                        value = length2Px(arena, child);

                        if (value == null) {
                            return null;
                        }

                        values.push(value);
                    }

                    if (values.length != 1) {
                        return null;
                    }

                    matrixVar = perspective(values[0], matrixVar);
                }

                break;

            case "matrix3d":
            case "matrix":
                {
                    const values: number[] = [];
                    let value: number | null;

                    for (const token of arena.tokens(transformList[i])) {
                        if (
                            [
                                EnumToken.WhitespaceTokenType,
                                EnumToken.CommentTokenType,
                                EnumToken.CommaTokenType,
                            ].includes(arena.dataTypes[token])
                        ) {
                            continue;
                        }

                        value = getNumber(arena, token);

                        if (value == null) {
                            return null;
                        }

                        values.push(value);
                    }

                    if (arena.strings[arena.stringValue[transformList[i]]] == "matrix") {
                        if (values.length != 6) {
                            return null;
                        }
                    } else if (values.length != 16) {
                        return null;
                    }

                    matrixVar = multiply(
                        matrixVar,
                        matrix(
                            values as
                                | [number, number, number, number, number, number]
                                | [
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                      number,
                                  ],
                        ) as Matrix,
                    );
                }

                break;

            default:
                return null;
        }
    }

    return matrixVar;
}

function splitTransformList(arena: AstArena, transformList: Token[]): Token[][] {
    let pattern: string | null = null;

    const tokens: Token[][] = [];

    for (let i = 0; i < transformList.length; i++) {
        if (
            arena.dataTypes[transformList[i]] == EnumToken.CommentTokenType ||
            arena.dataTypes[transformList[i]] == EnumToken.WhitespaceTokenType
        ) {
            continue;
        }

        if (
            pattern == null ||
            (arena.dataTypes[transformList[i]] == EnumToken.TransformFunctionTokenType &&
                !arena.strings[arena.stringValue[transformList[i]]].startsWith(pattern))
        ) {
            if (arena.dataTypes[transformList[i]] == EnumToken.TransformFunctionTokenType) {
                if (arena.strings[arena.stringValue[transformList[i]]].startsWith("scale")) {
                    pattern = "scale";
                } else if (arena.strings[arena.stringValue[transformList[i]]].startsWith("rotate")) {
                    pattern = "rotate";
                } else if (arena.strings[arena.stringValue[transformList[i]]].startsWith("translate")) {
                    pattern = "translate";
                } else {
                    pattern = null;
                }

                tokens.push([transformList[i]]);
                continue;
            }
        }

        if (
            pattern != null &&
            arena.dataTypes[transformList[i]] == EnumToken.TransformFunctionTokenType &&
            arena.strings[arena.stringValue[transformList[i]]].startsWith(pattern)
        ) {
            tokens[tokens.length - 1].push(transformList[i]);
            continue;
        }

        tokens.push([transformList[i]]);
    }

    return tokens;
}
