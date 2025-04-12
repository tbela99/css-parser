import type {AngleToken, FunctionToken, IdentToken, LengthToken, NumberToken, Token} from "../../../@types/token.d.ts";
import {identity, Matrix} from "./utils.ts";
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
import {serialize} from "./matrix.ts";
import {perspective} from "./perspective.ts";

export function compute(transformLists: Token[]): {
    // result: Token[] | null;
    matrix: Token,
    cumulative: Token[]
} | null {

    transformLists = transformLists.slice();
    stripCommaToken(transformLists);

    if (transformLists.length == 0) {

        return null;
    }

    let matrix: Matrix | null = identity();
    const names: Set<string> = new Set;
    const cumulative: Token[] = [];

    for (const transformList of splitTransformList(transformLists)) {

        matrix = computeMatrix(transformList, matrix);

        switch ((transformList[0] as FunctionToken).val) {

            case 'translate':
            case 'translateX':
            case 'translateY':
            case 'translateZ':
            case 'translate3d':

                if(names.has('translate')) {

                    names.delete('translate');
                }

                names.add('translate');
                break;

            case 'scale':
            case 'scaleX':
            case 'scaleY':
            case 'scaleZ':
            case 'scale3d':

                if(names.has('scale')) {

                    names.delete('scale');
                }

                names.add('scale');

                break;

            case 'rotate':
            case 'rotateX':
            case 'rotateY':
            case 'rotateZ':
            case 'rotate3d':

                if(names.has('rotate')) {

                    names.delete('rotate');
                }

                names.add('rotate');
                break;

            case 'skew':
            case 'skewX':
            case 'skewY':

                if(names.has('skew')) {

                    names.delete('skew');
                }

                names.add('skew');
                break;

            case 'perspective':

                if(names.has('perspective')) {

                    names.delete('perspective');
                }

                names.add('perspective');
                break;

            case 'matrix':
            case 'matrix3d':

                if(names.has('matrix')) {

                    names.delete('matrix');
                }

                names.add('matrix');
                break;
        }

        if (matrix == null) {

            return null;
        }

        cumulative.push(...(minify(computeMatrix(transformList, identity()) as Matrix) as Token[] ?? transformList));
    }

    return {
        // result: minify(matrix, [...names]),
        matrix: serialize(matrix),
        cumulative
    }
}

export function computeMatrix(transformList: Token[], matrix: Matrix): Matrix | null {

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

                    matrix = translateX(values[0], matrix);

                } else if ((transformList[i] as FunctionToken).val == 'translateY') {

                    matrix = translateY(values[0], matrix);

                } else if ((transformList[i] as FunctionToken).val == 'translateZ') {

                    matrix = translateZ(values[0], matrix);
                } else if ((transformList[i] as FunctionToken).val == 'translate') {

                    matrix = translate(values as [number] | [number, number], matrix);
                } else {

                    // @ts-ignore
                    matrix = translate3d(values as [number] | [number, number], matrix);
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

                    matrix = rotate(angle * 2 * Math.PI, matrix);
                } else {

                    matrix = rotate3D(angle * 2 * Math.PI, x, y, z, matrix);
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

                    matrix = scale3d(...values as [number, number, number], matrix);
                    break;
                }

                if ((transformList[i] as FunctionToken).val == 'scale') {

                    if (values.length != 1 && values.length != 2) {

                        return null;
                    }

                    matrix = scale(values[0], values[1] ?? values[0], matrix);
                    break;
                }

                if (values.length != 1) {

                    return null;
                } else if ((transformList[i] as FunctionToken).val == 'scaleX') {

                    matrix = scaleX(values[0], matrix);
                } else if ((transformList[i] as FunctionToken).val == 'scaleY') {

                    matrix = scaleY(values[0], matrix);
                } else if ((transformList[i] as FunctionToken).val == 'scaleZ') {

                    matrix = scaleZ(values[0], matrix);
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

                    matrix = skew(values as [number] | [number, number], matrix);
                } else {

                    matrix = (transformList[i] as FunctionToken).val == 'skewX' ? skewX(values[0], matrix) : skewY(values[0], matrix);
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

                matrix = perspective(values[0], matrix);
            }

                break;

            default:

                return null;
            // throw new TypeError(`Unknown transform function: ${(transformList[i] as FunctionToken).val}`);
        }
    }

    return matrix
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