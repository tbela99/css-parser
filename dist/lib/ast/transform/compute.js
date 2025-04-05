import { identity } from './utils.js';
import { EnumToken } from '../types.js';
import { length2Px } from './convert.js';
import { transformFunctions } from '../../syntax/syntax.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/utils/config.js';
import { getNumber, getAngle } from '../../renderer/color/color.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { stripCommaToken } from '../../validation/utils/list.js';
import { translateX, translateY, translateZ, translate } from './translate.js';
import { rotate, rotate3D } from './rotate.js';
import { scale3d, scale, scaleX, scaleY, scaleZ } from './scale.js';
import { minify } from './minify.js';
import { serialize } from './matrix.js';

function compute(transformLists) {
    transformLists = transformLists.slice();
    stripCommaToken(transformLists);
    if (transformLists.length == 0) {
        return null;
    }
    const tokens = [];
    let matrix;
    for (const transformList of splitTransformList(transformLists)) {
        matrix = computeMatrix(transformList);
        if (matrix == null) {
            return null;
        }
        tokens.push(matrix);
    }
    // for (let i = 0; i < tokens.length; i++) {
    //
    //     for (let j = 0; j < tokens[i].length; j++) {
    //
    //         toZero(tokens[i][j]);
    //     }
    // }
    return tokens.reduce((acc, t) => acc.concat(minify(t) ?? serialize(t)), []);
}
function computeMatrix(transformList) {
    let matrix = identity();
    let values = [];
    let val;
    let i = 0;
    for (; i < transformList.length; i++) {
        if (transformList[i].typ == EnumToken.WhitespaceTokenType) {
            continue;
        }
        if (transformList[i].typ != EnumToken.FunctionTokenType || !transformFunctions.includes(transformList[i].val)) {
            return null;
        }
        switch (transformList[i].val) {
            case 'translate':
            case 'translateX':
            case 'translateY':
            case 'translateZ':
            case 'translate3d':
                {
                    values.length = 0;
                    const children = stripCommaToken(transformList[i].chi.slice());
                    if (children == null || children.length == 0) {
                        return null;
                    }
                    const valCount = transformList[i].val == 'translate3d' || transformList[i].val == 'translate' ? 3 : 1;
                    if (children.length == 1 && children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none') {
                        values.fill(0, 0, valCount);
                    }
                    else {
                        for (let j = 0; j < children.length; j++) {
                            if (children[j].typ == EnumToken.WhitespaceTokenType) {
                                continue;
                            }
                            val = length2Px(children[j]);
                            if (typeof val != 'number' || Number.isNaN(val)) {
                                return null;
                            }
                            values.push(val);
                        }
                    }
                    if (values.length == 0 || values.length > valCount) {
                        return null;
                    }
                    if (transformList[i].val == 'translateX') {
                        matrix = translateX(values[0], matrix);
                    }
                    else if (transformList[i].val == 'translateY') {
                        matrix = translateY(values[0], matrix);
                    }
                    else if (transformList[i].val == 'translateZ') {
                        matrix = translateZ(values[0], matrix);
                    }
                    else {
                        // @ts-ignore
                        matrix = translate(values, matrix);
                    }
                }
                break;
            case 'rotate':
            case 'rotateX':
            case 'rotateY':
            case 'rotateZ':
            case 'rotate3d':
                {
                    let x = 0;
                    let y = 0;
                    let z = 0;
                    let angle;
                    let values = [];
                    let valuesCount = transformList[i].val == 'rotate3d' ? 4 : 1;
                    for (const child of stripCommaToken(transformList[i].chi.slice())) {
                        if (child.typ == EnumToken.WhitespaceTokenType) {
                            continue;
                        }
                        values.push(child);
                        if (transformList[i].val == 'rotateX') {
                            x = 1;
                        }
                        else if (transformList[i].val == 'rotateY') {
                            y = 1;
                        }
                        else if (transformList[i].val == 'rotate' || transformList[i].val == 'rotateZ') {
                            z = 1;
                        }
                    }
                    if (values.length != valuesCount) {
                        return null;
                    }
                    if (transformList[i].val == 'rotate3d') {
                        x = getNumber(values[0]);
                        y = getNumber(values[1]);
                        z = getNumber(values[2]);
                    }
                    angle = getAngle(values.at(-1));
                    if ([x, y, z, angle].some(t => typeof t != 'number' || Number.isNaN(+t))) {
                        return null;
                    }
                    if (transformList[i].val == 'rotate' || transformList[i].val == 'rotateZ') {
                        matrix = rotate(angle * 2 * Math.PI, matrix);
                    }
                    else {
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
                let child;
                for (let k = 0; k < transformList[i].chi.length; k++) {
                    child = transformList[i].chi[k];
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
                if (transformList[i].val == 'scale3d') {
                    if (values.length != 3) {
                        return null;
                    }
                    matrix = scale3d(...values, matrix);
                    break;
                }
                if (transformList[i].val == 'scale') {
                    if (values.length != 1 && values.length != 2) {
                        return null;
                    }
                    matrix = scale(values[0], values[1] ?? values[0], matrix);
                    break;
                }
                if (values.length != 1) {
                    return null;
                }
                else if (transformList[i].val == 'scaleX') {
                    matrix = scaleX(values[0], matrix);
                }
                else if (transformList[i].val == 'scaleY') {
                    matrix = scaleY(values[0], matrix);
                }
                else if (transformList[i].val == 'scaleZ') {
                    matrix = scaleZ(values[0], matrix);
                }
                break;
            }
            default:
                return null;
            // throw new TypeError(`Unknown transform function: ${(transformList[i] as FunctionToken).val}`);
        }
    }
    return matrix;
}
function splitTransformList(transformList) {
    let pattern = null;
    const tokens = [];
    for (let i = 0; i < transformList.length; i++) {
        if (transformList[i].typ == EnumToken.CommentTokenType || transformList[i].typ == EnumToken.WhitespaceTokenType) {
            continue;
        }
        if (pattern == null || (transformList[i].typ == EnumToken.FunctionTokenType && !transformList[i].val.startsWith(pattern))) {
            if (transformList[i].typ == EnumToken.FunctionTokenType) {
                if (transformList[i].val.startsWith('scale')) {
                    pattern = 'scale';
                }
                else if (transformList[i].val.startsWith('rotate')) {
                    pattern = 'rotate';
                }
                else if (transformList[i].val.startsWith('translate')) {
                    pattern = 'translate';
                }
                else {
                    pattern = null;
                }
                tokens.push([transformList[i]]);
                continue;
            }
        }
        if (pattern != null && transformList[i].typ == EnumToken.FunctionTokenType && transformList[i].val.startsWith(pattern)) {
            tokens[tokens.length - 1].push(transformList[i]);
            continue;
        }
        tokens.push([transformList[i]]);
    }
    return tokens;
}

export { compute, computeMatrix };
