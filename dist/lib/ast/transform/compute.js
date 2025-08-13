import { multiply, toZero, identity } from './utils.js';
import { EnumToken } from '../types.js';
import { transformFunctions } from '../../syntax/syntax.js';
import { length2Px } from '../../syntax/utils.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { getNumber, getAngle } from '../../syntax/color/color.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { stripCommaToken } from '../../validation/utils/list.js';
import { translateX, translateY, translateZ, translate, translate3d } from './translate.js';
import { rotate, rotate3D } from './rotate.js';
import { scale3d, scale, scaleX, scaleY, scaleZ } from './scale.js';
import { minify } from './minify.js';
import { skew, skewX, skewY } from './skew.js';
import { serialize, matrix } from './matrix.js';
import { perspective } from './perspective.js';

function compute(transformLists) {
    transformLists = transformLists.slice();
    stripCommaToken(transformLists);
    let matrix = identity();
    let mat;
    const cumulative = [];
    for (const transformList of splitTransformList(transformLists)) {
        mat = computeMatrix(transformList, identity());
        if (mat == null) {
            return null;
        }
        matrix = multiply(matrix, mat);
        cumulative.push(...(minify(mat) ?? transformList));
    }
    const serialized = serialize(matrix);
    if (cumulative.length > 0) {
        for (let i = 0; i < cumulative.length; i++) {
            if (cumulative[i].typ == EnumToken.IdenTokenType && cumulative[i].val == 'none') {
                cumulative.splice(i--, 1);
            }
        }
        if (cumulative.length == 0) {
            cumulative.push({
                typ: EnumToken.IdenTokenType, val: 'none'
            });
        }
    }
    // console.error({matrix});
    // matrix = toZero(matrix) as Matrix;
    return {
        matrix: serialize(toZero(matrix)),
        cumulative,
        minified: minify(matrix) ?? [serialized]
    };
}
function computeMatrix(transformList, matrixVar) {
    let values = [];
    let val;
    let i = 0;
    for (; i < transformList.length; i++) {
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
                    const valCount = transformList[i].val == 'translate3d' || transformList[i].val == 'translate' ? 3 : 1;
                    for (let j = 0; j < children.length; j++) {
                        if (children[j].typ == EnumToken.WhitespaceTokenType) {
                            continue;
                        }
                        val = length2Px(children[j]);
                        if (val == null) {
                            return null;
                        }
                        values.push(val);
                    }
                    if (values.length == 0 || values.length > valCount) {
                        return null;
                    }
                    if (transformList[i].val == 'translateX') {
                        matrixVar = translateX(values[0], matrixVar);
                    }
                    else if (transformList[i].val == 'translateY') {
                        matrixVar = translateY(values[0], matrixVar);
                    }
                    else if (transformList[i].val == 'translateZ') {
                        matrixVar = translateZ(values[0], matrixVar);
                    }
                    else if (transformList[i].val == 'translate') {
                        matrixVar = translate(values, matrixVar);
                    }
                    else {
                        // @ts-ignore
                        matrixVar = translate3d(values, matrixVar);
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
                        matrixVar = rotate(angle * 2 * Math.PI, matrixVar);
                    }
                    else {
                        matrixVar = rotate3D(angle * 2 * Math.PI, x, y, z, matrixVar);
                    }
                }
                break;
            case 'scale':
            case 'scaleX':
            case 'scaleY':
            case 'scaleZ':
            case 'scale3d':
                {
                    values.length = 0;
                    let child;
                    const children = stripCommaToken(transformList[i].chi.slice());
                    for (let k = 0; k < children.length; k++) {
                        child = children[k];
                        if (child.typ != EnumToken.NumberTokenType) {
                            return null;
                        }
                        values.push(getNumber(child));
                    }
                    if (transformList[i].val == 'scale3d') {
                        if (values.length != 3) {
                            return null;
                        }
                        matrixVar = scale3d(...values, matrixVar);
                        break;
                    }
                    if (transformList[i].val == 'scale') {
                        if (values.length != 1 && values.length != 2) {
                            return null;
                        }
                        matrixVar = scale(values[0], values[1] ?? values[0], matrixVar);
                        break;
                    }
                    if (values.length != 1) {
                        return null;
                    }
                    else if (transformList[i].val == 'scaleX') {
                        matrixVar = scaleX(values[0], matrixVar);
                    }
                    else if (transformList[i].val == 'scaleY') {
                        matrixVar = scaleY(values[0], matrixVar);
                    }
                    else if (transformList[i].val == 'scaleZ') {
                        matrixVar = scaleZ(values[0], matrixVar);
                    }
                }
                break;
            case 'skew':
            case 'skewX':
            case 'skewY':
                {
                    values.length = 0;
                    let child;
                    let value;
                    for (let k = 0; k < transformList[i].chi.length; k++) {
                        child = transformList[i].chi[k];
                        if (child.typ == EnumToken.CommentTokenType ||
                            child.typ == EnumToken.CommaTokenType ||
                            child.typ == EnumToken.WhitespaceTokenType) {
                            continue;
                        }
                        value = getAngle(child);
                        values.push(value * 2 * Math.PI);
                    }
                    if (values.length == 0 || (values.length > (transformList[i].val == 'skew' ? 2 : 1))) {
                        return null;
                    }
                    if (transformList[i].val == 'skew') {
                        matrixVar = skew(values, matrixVar);
                    }
                    else {
                        matrixVar = transformList[i].val == 'skewX' ? skewX(values[0], matrixVar) : skewY(values[0], matrixVar);
                    }
                }
                break;
            case 'perspective':
                {
                    const values = [];
                    let child;
                    let value;
                    for (let k = 0; k < transformList[i].chi.length; k++) {
                        child = transformList[i].chi[k];
                        if (child.typ == EnumToken.CommentTokenType || child.typ == EnumToken.WhitespaceTokenType) {
                            continue;
                        }
                        if (child.typ == EnumToken.IdenTokenType && child.val == 'none') {
                            values.push(child);
                            continue;
                        }
                        value = length2Px(child);
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
            case 'matrix':
                {
                    const values = [];
                    let value;
                    for (const token of transformList[i].chi) {
                        if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(token.typ)) {
                            continue;
                        }
                        value = getNumber(token);
                        if (value == null) {
                            return null;
                        }
                        values.push(value);
                    }
                    if (transformList[i].val == 'matrix') {
                        if (values.length != 6) {
                            return null;
                        }
                    }
                    else if (values.length != 16) {
                        return null;
                    }
                    matrixVar = multiply(matrixVar, matrix(values));
                }
                break;
            default:
                return null;
        }
    }
    return matrixVar;
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
