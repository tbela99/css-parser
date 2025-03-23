import type {FunctionToken, LengthToken, Token} from "../../../@types/token.d.ts";
import {identity, Matrix} from "./utils.ts";
import {EnumToken} from "../types.ts";
import {length2Px} from "./convert.ts";
import {transformFunctions} from "../../syntax/index.ts";
import {stripCommaToken} from "../../validation/utils";
import {translate, translate3d, translateX, translateY, translateZ} from "./translate.ts";

export function compute(transformList: Token[]): Matrix | null {

    transformList = transformList.slice();
    stripCommaToken(transformList);

    if (transformList.length == 0) {

        return null;
    }

    const matrix: Matrix = identity();
    let values: number[] = [];
    let val: number | null;

    for (let i = 0; i < transformList.length; i++) {

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

                // console.error([(transformList[i] as FunctionToken).val, valCount]);

                if (children.length == 1 && children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none') {

                    values.fill(0, 0, valCount);

                } else {

                    for (let j = 0; j < children.length; j++) {

                        if (children[j].typ == EnumToken.WhitespaceTokenType) {

                            continue;
                        }

                        val = length2Px(children[j] as LengthToken);

                        if (val == null) {

                            return null;
                        }

                        values.push(val);
                    }

                }

                if (values.length == 0 || values.length > valCount) {

                    return null;
                }

                if ((transformList[i] as FunctionToken).val == 'translateX') {

                    translateX(values[0], matrix);

                } else if ((transformList[i] as FunctionToken).val == 'translateY') {

                    translateY(values[0], matrix);

                } else if ((transformList[i] as FunctionToken).val == 'translateZ') {

                    translateZ(values[0], matrix);
                }

                else {

                    // @ts-ignore
                    translate(values as [number] | [number, number], matrix);
                }
            }
                break;

            // case 'rotate':
            // case 'rotateX':
            // case 'rotateY':
            // // case 'rotateZ':
            // // case 'rotate3d':
            //
            // {
            //     let x: number = 0;
            //     let y: number = 0;
            //     let z: number = 0;
            //
            //     let angle: number;
            //     let values: number[] = [];
            //
            //     if ((transformList[i] as FunctionToken).val == 'rotateX' || (transformList[i] as FunctionToken).val == 'rotateY' || (transformList[i] as FunctionToken).val == 'rotateZ') {
            //
            //         for (const child of stripCommaToken((transformList[i] as FunctionToken).chi.slice()) as Token[]) {
            //
            //             if (child.typ == EnumToken.WhitespaceTokenType) {
            //
            //                 continue;
            //             }
            //
            //             // if (child.typ == EnumToken.IdenTokenType && child.val == 'none') {
            //             //
            //             //     return null;
            //             // }
            //
            //             if (child.typ == EnumToken.NumberTokenType && +child.val > 0) {
            //
            //                 return null;
            //             }
            //
            //             angle = getAngle(child as AngleToken | NumberToken);
            //
            //             if (angle == null) {
            //
            //                 return null;
            //             }
            //
            //             values.push(angle * 2 * Math.PI);
            //
            //             if ((transformList[i] as FunctionToken).val == 'rotateX') {
            //
            //                 x = 1;
            //             } else if ((transformList[i] as FunctionToken).val == 'rotateY') {
            //
            //                 y = 1;
            //             } else if ((transformList[i] as FunctionToken).val == 'rotateZ') {
            //
            //                 z = 1;
            //             }
            //         }
            //
            //         if (values.length != 1) {
            //
            //             return null;
            //         }
            //
            //         console.error({values});
            //
            //         return null;
            //     }
            //
            //     else if ((transformList[i] as FunctionToken).val == 'rotate') {
            //
            //     }
            // }
            //
            //     break;

            default:

                return null;
                // throw new TypeError(`Unknown transform function: ${(transformList[i] as FunctionToken).val}`);
        }
    }

    return matrix;
}