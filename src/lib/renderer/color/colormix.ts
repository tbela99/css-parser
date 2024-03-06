import {ColorToken, IdentToken, PercentageToken} from "../../../@types";
import {isRectangularOrthogonalColorspace} from "../../parser";
import {EnumToken} from "../../ast";
import {getNumber, values2hsltoken} from "./color";
import {srgb2lsrgb, srgbvalues} from "./srgb";
import {srgb2xyz} from "./xyzd65";
import {srgb2lch} from "./lch";
import {srgb2rgb} from "./rgb";
import {srgb2hsl} from "./hsl";
import {srgb2hwb} from "./hwb";
import {srgb2lab} from "./lab";
import {p32srgb} from "./displayp3";

export function colorMix(colorSpace: IdentToken, hueInterpolationMethod: IdentToken | null, color1: ColorToken, percentage1: PercentageToken | null, color2: ColorToken, percentage2: PercentageToken | null): ColorToken | null {

    if (percentage1 == null) {

        if (percentage2 == null) {

            // @ts-ignore
            percentage1 = {typ: EnumToken.NumberTokenType, val: '.5'};
            // @ts-ignore
            percentage2 = {typ: EnumToken.NumberTokenType, val: '.5'};
        } else {

            if (+percentage2.val <= 0) {

                return null;
            }

            if (+percentage2.val >= 100) {

                // @ts-ignore
                percentage2 = {typ: EnumToken.NumberTokenType, val: '1'};
            }

            // @ts-ignore
            percentage1 = {typ: EnumToken.NumberTokenType, val: String(1 - percentage2.val / 100)};
        }
    } else {

        // @ts-ignore
        if (percentage1.val <= 0) {

            return null;
        }

        if (percentage2 == null) {

            // @ts-ignore
            if (percentage1.val >= 100) {

                // @ts-ignore
                percentage1 = {typ: EnumToken.NumberTokenType, val: '1'};
            }

            // @ts-ignore
            percentage2 = {typ: EnumToken.NumberTokenType, val: String(1 - percentage1.val / 100)};
        } else {

            // @ts-ignore
            if (percentage2.val <= 0) {

                return null;
            }
        }
    }

    let values1: number[] | null = srgbvalues(color1) ?? null;
    let values2: number[] | null = srgbvalues(color2) ?? null;

    if (values1 == null || values2 == null) {

        return null;
    }

    const p1: number = getNumber(<IdentToken | PercentageToken>percentage1);
    const p2: number = getNumber(<IdentToken | PercentageToken>percentage2);

    const mul1: number = values1.length == 4 ? <number>values1.pop() : 1;
    const mul2: number = values2.length == 4 ? <number>values2.pop() : 1;
    const mul: number = mul1 * p1 + mul2 * p2;

    // @ts-ignore
    const calculate = () => [colorSpace].concat((<number[]>values1).map((v1: number, i: number) => {

        return {
            // @ts-ignore
            typ: EnumToken.NumberTokenType, val: String((mul1 * v1 * p1 + mul2 * values2[i] * p2) / mul)
        }
    }).concat(mul == 1 ? [] : [{
        typ: EnumToken.NumberTokenType, val: String(mul)
    }]));

    // ['srgb', 'srgb-linear', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'lab', 'oklab', 'xyz', 'xyz-d50', 'xyz-d65']

    switch (colorSpace.val) {

        case 'srgb':

            break;

        case 'display-p3':

            // @ts-ignore
            values1 = p32srgb(...values1);
            // @ts-ignore
            values2 = p32srgb(...values2);
            break;

        case 'srgb-linear':

            // @ts-ignore
            values1 = srgb2lsrgb(...values1);
            // @ts-ignore
            values2 = srgb2lsrgb(...values2);
            break;

        case 'xyz':
        case 'xyz-d65':

            // @ts-ignore
            values1 = srgb2xyz(...values1);
            // @ts-ignore
            values2 = srgb2xyz(...values2);
            break;

        case 'rgb':

            // @ts-ignore
            values1 = srgb2rgb(...values1);
            // @ts-ignore
            values2 = srgb2rgb(...values2);
            break;

        case 'hsl':

            // @ts-ignore
            values1 = srgb2hsl(...values1);
            // @ts-ignore
            values2 = srgb2hsl(...values2);

            break;

        case 'hwb':

            // @ts-ignore
            values1 = srgb2hwb(...values1);
            // @ts-ignore
            values2 = srgb2hwb(...values2);
            break;

        case 'lab':

            // @ts-ignore
            values1 = srgb2lab(...values1);
            // @ts-ignore
            values2 = srgb2lab(...values2);
            break;

        case 'lch':

            // @ts-ignore
            values1 = srgb2lch(...values1);
            // @ts-ignore
            values2 = srgb2lch(...values2);
            break;

        case 'oklab':

            // @ts-ignore
            values1 = srgb2lch(...values1);
            // @ts-ignore
            values2 = srgb2lch(...values2);
            break;

        case 'oklch':

            // @ts-ignore
            values1 = srgb2lch(...values1);
            // @ts-ignore
            values2 = srgb2lch(...values2);
            break;

        default:

            return null;
    }

    switch (colorSpace.val) {

        case 'srgb':
        case 'srgb-linear':
        case 'xyz':
        case 'xyz-d65':

            // @ts-ignore
            return <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val: 'color',
                chi: calculate(),
                kin: 'color',
                cal: 'col'
            };

        case 'rgb':
        case 'hsl':
        case 'hwb':
        case 'lab':
        case 'lch':
        case 'oklab':
        case 'oklch':

            // @ts-ignore
            const result: ColorToken = <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val: colorSpace.val,
                chi: calculate().slice(1),
                kin: colorSpace.val
            };

            if (colorSpace.val == 'hsl' || colorSpace.val == 'hwb') {

                // @ts-ignore
                result.chi[0] = {typ: EnumToken.AngleTokenType, val: String(result.chi[0].val * 360), unit: 'deg'};
                // @ts-ignore
                result.chi[1] = {typ: EnumToken.PercentageTokenType, val: String(result.chi[1].val * 100)};
                // @ts-ignore
                result.chi[2] = {typ: EnumToken.PercentageTokenType, val: String(result.chi[2].val * 100)};

            }

            // console.error(JSON.stringify(result, null, 1));

            return result;
    }

    return null;
}