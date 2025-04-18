import type {AngleToken, FunctionToken, IdentToken, LengthToken, NumberToken, Token} from "../../../@types/token.d.ts";
import {identity, Matrix, multiply} from "./utils.ts";
import {EnumToken} from "../types.ts";
import {length2Px} from "./convert.ts";
import {transformFunctions} from "../../syntax/index.ts";
import {stripCommaToken} from "../../validation/utils";
import {translate, translate3d, translateX, translateY, translateZ} from "./translate.ts";
import {getAngle, getNumber} from "../../renderer/color";
import {rotate, rotate3D} from "./rotate.ts";
import {scale, scale3d, scaleX, scaleY, scaleZ} from "./scale.ts";
import {minify} from "./minify.ts";
import {skew, skewX, skewY} from "./skew.ts";
import {matrix, serialize} from "./matrix.ts";
import {perspective} from "./perspective.ts";

export function compute(transformLists: Token[]): {
    matrix: Token,
    cumulative: Token[],
    minified: Token[]
} | null {

    transformLists = transformLists.slice();
    stripCommaToken(transformLists);

    if (transformLists.length == 0) {

        return null;
    }

    let matrix: Matrix | null = identity();
    let mat: Matrix;
    const cumulative: Token[] = [];

    for (const transformList of splitTransformList(transformLists)) {

        mat = computeMatrix(transformList, identity()) as Matrix;

        if (mat == null) {

            return null;
        }

        matrix = multiply(matrix, mat) as Matrix;
        cumulative.push(...(minify(mat) as Token[] ?? transformList));
    }

    const serialized: Token = serialize(matrix);

    return {
        matrix: serialize(matrix),
        cumulative,
        minified: minify(matrix) ?? [serialized]
    }
}

export function computeMatrix(transformList: Token[], matrixVar: Matrix): Matrix | null {

    let values: number[] = [];
    let val: number | null;
    let i: number = 0;

    for (; i < transformList.length; i++) {

        if (transformList[i].typ == EnumToken.WhitespaceTokenType) {

            continue;
        }

        if (transformList[i].typ != EnumToken.FunctionTokenType || !transformFunctions.includes((transformList[i] as FunctionToken).val)) {

            return null;
        }

        switch ((transformList[i] as FunctionToken).val) {

            case 'translate':
            case 'translateX':
            case 'translateY':
            case 'translateZ':
            case 'translate3d': {

                values.length = 0;
                const children = stripCommaToken((transformList[i] as FunctionToken).chi.slice()) as Token[];

                if (children == null || children.length == 0) {

                    return null;
                }

                const valCount: number = (transformList[i] as FunctionToken).val == 'translate3d' || (transformList[i] as FunctionToken).val == 'translate' ? 3 : 1;

                if (children.length == 1 && children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none') {

                    values.fill(0, 0, valCount);

                } else {

                    for (let j = 0; j < children.length; j++) {

                        if (children[j].typ == EnumToken.WhitespaceTokenType) {

                            continue;
                        }

                        val = length2Px(children[j] as LengthToken);

                        if (typeof val != 'number' || Number.isNaN(val)) {

                            return null;
                        }

                        values.push(val as number);
                    }
                }

                if (values.length == 0 || values.length > valCount) {

                    return null;
                }

                if ((transformList[i] as FunctionToken).val == 'translateX') {

                    matrixVar = translateX(values[0], matrixVar);

                } else if ((transformList[i] as FunctionToken).val == 'translateY') {

                    matrixVar = translateY(values[0], matrixVar);

                } else if ((transformList[i] as FunctionToken).val == 'translateZ') {

                    matrixVar = translateZ(values[0], matrixVar);
                } else if ((transformList[i] as FunctionToken).val == 'translate') {

                    matrixVar = translate(values as [number] | [number, number], matrixVar);
                } else {

                    // @ts-ignore
                    matrixVar = translate3d(values as [number] | [number, number], matrixVar);
                }
            }
                break;

            case 'rotate':
            case 'rotateX':
            case 'rotateY':
            case 'rotateZ':
            case 'rotate3d': {
                let x: number = 0;
                let y: number = 0;
                let z: number = 0;

                let angle: number;
                let values: Token[] = [];
                let valuesCount: number = (transformList[i] as FunctionToken).val == 'rotate3d' ? 4 : 1;

                for (const child of stripCommaToken((transformList[i] as FunctionToken).chi.slice()) as Token[]) {

                    if (child.typ == EnumToken.WhitespaceTokenType) {

                        continue;
                    }

                    values.push(child);

                    if ((transformList[i] as FunctionToken).val == 'rotateX') {

                        x = 1;
                    } else if ((transformList[i] as FunctionToken).val == 'rotateY') {

                        y = 1;
                    } else if ((transformList[i] as FunctionToken).val == 'rotate' || (transformList[i] as FunctionToken).val == 'rotateZ') {

                        z = 1;
                    }
                }

                if (values.length != valuesCount) {

                    return null;
                }

                if ((transformList[i] as FunctionToken).val == 'rotate3d') {

                    x = getNumber(values[0] as NumberToken);
                    y = getNumber(values[1] as NumberToken);
                    z = getNumber(values[2] as NumberToken);
                }

                angle = getAngle(values.at(-1) as AngleToken | NumberToken);

                if ([x, y, z, angle].some(t => typeof t != 'number' || Number.isNaN(+t))) {

                    return null;
                }

                if ((transformList[i] as FunctionToken).val == 'rotate' || (transformList[i] as FunctionToken).val == 'rotateZ') {

                    matrixVar = rotate(angle * 2 * Math.PI, matrixVar);
                } else {

                    matrixVar = rotate3D(angle * 2 * Math.PI, x, y, z, matrixVar);
                }
            }

                break;

            case 'scale':
            case 'scaleX':
            case 'scaleY':
            case 'scaleZ':
            case 'scale3d': {

                values.length = 0;

                let child: Token;

                for (let k = 0; k < (transformList[i] as FunctionToken).chi.length; k++) {

                    child = (transformList[i] as FunctionToken).chi[k];

                    if (child.typ == EnumToken.CommentTokenType || child.typ == EnumToken.WhitespaceTokenType) {

                        continue;
                    }

                    if (child.typ != EnumToken.NumberTokenType) {

                        return null;
                    }

                    values.push(getNumber(child));
                }

                if (values.length == 0) {

                    return null;
                }

                if ((transformList[i] as FunctionToken).val == 'scale3d') {

                    if (values.length != 3) {

                        return null;
                    }

                    matrixVar = scale3d(...values as [number, number, number], matrixVar);
                    break;
                }

                if ((transformList[i] as FunctionToken).val == 'scale') {

                    if (values.length != 1 && values.length != 2) {

                        return null;
                    }

                    matrixVar = scale(values[0], values[1] ?? values[0], matrixVar);
                    break;
                }

                if (values.length != 1) {

                    return null;
                } else if ((transformList[i] as FunctionToken).val == 'scaleX') {

                    matrixVar = scaleX(values[0], matrixVar);
                } else if ((transformList[i] as FunctionToken).val == 'scaleY') {

                    matrixVar = scaleY(values[0], matrixVar);
                } else if ((transformList[i] as FunctionToken).val == 'scaleZ') {

                    matrixVar = scaleZ(values[0], matrixVar);
                }
            }

                break;

            case 'skew':
            case 'skewX':
            case 'skewY': {

                values.length = 0;

                let child: Token;
                let value: number | null;

                for (let k = 0; k < (transformList[i] as FunctionToken).chi.length; k++) {

                    child = (transformList[i] as FunctionToken).chi[k];

                    if (child.typ == EnumToken.CommentTokenType || child.typ == EnumToken.WhitespaceTokenType) {

                        continue;
                    }

                    value = getAngle(child as AngleToken | NumberToken);

                    if (value == null) {

                        return null;
                    }

                    values.push(value * 2 * Math.PI);
                }

                if (values.length == 0 || (values.length > ((transformList[i] as FunctionToken).val == 'skew' ? 2 : 1))) {

                    return null;
                }

                if ((transformList[i] as FunctionToken).val == 'skew') {

                    matrixVar = skew(values as [number] | [number, number], matrixVar);
                } else {

                    matrixVar = (transformList[i] as FunctionToken).val == 'skewX' ? skewX(values[0], matrixVar) : skewY(values[0], matrixVar);
                }
            }

                break;

            case 'perspective': {

                const values: Array<number | IdentToken> = [];

                let child: Token;
                let value: number | null;

                for (let k = 0; k < (transformList[i] as FunctionToken).chi.length; k++) {

                    child = (transformList[i] as FunctionToken).chi[k];

                    if (child.typ == EnumToken.CommentTokenType || child.typ == EnumToken.WhitespaceTokenType) {

                        continue;
                    }

                    if (child.typ == EnumToken.IdenTokenType && child.val == 'none') {

                        values.push(child);
                        continue;
                    }

                    value = length2Px(child as LengthToken | NumberToken);

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

            case 'matrix3d':
                return null;

            case 'matrix': {

                const values: number[] = [];
                let value: number | null;

                for (const token of (transformList[i] as FunctionToken).chi) {

                    if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(token.typ)) {

                        continue;
                    }

                    value = getNumber(token as NumberToken);

                    if (value == null) {

                        return null;
                    }

                    values.push(value);
                }

                if ((transformList[i] as FunctionToken).val == 'matrix') {

                    if (values.length != 6) {

                        return null;
                    }
                } else if (values.length != 16) {

                    return null;
                }

                matrixVar = multiply(matrixVar, matrix(values as [number, number, number, number, number, number] | [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]) as Matrix);
            }

                break;

            default:

                return null;
        }
    }

    return matrixVar
}

function splitTransformList(transformList: Token[]): Token[][] {

    let pattern: string | null = null;

    const tokens: Token[][] = [];

    for (let i = 0; i < transformList.length; i++) {

        if (transformList[i].typ == EnumToken.CommentTokenType || transformList[i].typ == EnumToken.WhitespaceTokenType) {

            continue;
        }

        if (pattern == null || (transformList[i].typ == EnumToken.FunctionTokenType && !(transformList[i] as FunctionToken).val.startsWith(pattern))) {

            if (transformList[i].typ == EnumToken.FunctionTokenType) {

                if ((transformList[i] as FunctionToken).val.startsWith('scale')) {
                    pattern = 'scale';
                } else if ((transformList[i] as FunctionToken).val.startsWith('rotate')) {
                    pattern = 'rotate';
                } else if ((transformList[i] as FunctionToken).val.startsWith('translate')) {
                    pattern = 'translate';
                } else {
                    pattern = null;
                }

                tokens.push([transformList[i]]);
                continue;
            }
        }

        if (pattern != null && transformList[i].typ == EnumToken.FunctionTokenType && (transformList[i] as FunctionToken).val.startsWith(pattern)) {

            tokens[tokens.length - 1].push(transformList[i]);
            continue;
        }

        tokens.push([transformList[i]]);
    }

    return tokens;
}