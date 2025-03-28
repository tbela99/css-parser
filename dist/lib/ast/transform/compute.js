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
import { rotate3D } from './rotate.js';

function compute(transformList) {
    transformList = transformList.slice();
    stripCommaToken(transformList);
    if (transformList.length == 0) {
        return null;
    }
    const matrix = identity();
    let values = [];
    let val;
    for (let i = 0; i < transformList.length; i++) {
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
                    // console.error([(transformList[i] as FunctionToken).val, valCount]);
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
                        translateX(values[0], matrix);
                    }
                    else if (transformList[i].val == 'translateY') {
                        translateY(values[0], matrix);
                    }
                    else if (transformList[i].val == 'translateZ') {
                        translateZ(values[0], matrix);
                    }
                    else {
                        // @ts-ignore
                        translate(values, matrix);
                    }
                }
                break;
            case 'rotate':
            case 'rotateX':
            case 'rotateY':
            case 'rotateZ':
            case 'rotate3d':
                //
                {
                    let x = 0;
                    let y = 0;
                    let z = 0;
                    let angle;
                    let values = [];
                    let valuesCount = transformList[i].val == 'rotate3d' ? 4 : 1;
                    if (['rotate', 'rotateX', 'rotateY', 'rotateZ', 'rotate3d'].includes(transformList[i].val)) {
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
                        // console.error({values, valuesCount});
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
                        // console.error([x, y, z, angle * 2 * Math.PI]);
                        // if ((transformList[i] as FunctionToken).val == 'rotate' || (transformList[i] as FunctionToken).val == 'rotateZ') {
                        rotate3D(angle * 2 * Math.PI, x, y, z, matrix);
                        // console.error({matrix});
                        // continue;
                        // }
                        // console.error({values});
                        // return null;
                    }
                    // else
                    //     if ((transformList[i] as FunctionToken).val == 'rotate') {
                    //
                    // }
                }
                break;
            default:
                return null;
            // throw new TypeError(`Unknown transform function: ${(transformList[i] as FunctionToken).val}`);
        }
    }
    return matrix;
}

export { compute };
