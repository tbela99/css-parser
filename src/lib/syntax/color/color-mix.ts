import type {ColorToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";
import {getNumber} from "./color.ts";
import {srgb2lsrgbvalues, srgbvalues} from "./srgb.ts";
import {srgb2lch, xyz2lchvalues} from "./lch.ts";
import {srgb2rgb} from "./rgb.ts";
import {srgb2hslvalues} from "./hsl.ts";
import {srgb2hwb} from "./hwb.ts";
import {srgb2labvalues} from "./lab.ts";
import {srgb2p3values} from "./p3.ts";
import {getComponents} from "./utils/index.ts";
import {srgb2oklch} from "./oklch.ts";
import {srgb2oklab} from "./oklab.ts";
import {srgb2prophotorgbvalues} from "./prophotorgb.ts";
import {srgb2xyz_d50} from "./xyz.ts";
import {XYZ_D65_to_D50, xyzd502lch} from "./xyzd50.ts";
import {srgb2rec2020values} from "./rec2020.ts";
import {isPolarColorspace, isRectangularOrthogonalColorspace} from "../index.ts";

function interpolateHue(interpolationMethod: IdentToken, h1: number, h2: number): number[] {

    switch (interpolationMethod.val) {

        case 'longer':

            if (h2 - h1 < 180 && h2 - h1 > 0) {
                h1 += 360;
            } else if (h2 - h1 <= 0 && h2 - h1 > -180) {

                h2 += 360;
            }

            break;

        case 'increasing':

            if (h2 < h1) {
                h2 += 360;
            }

            break;

        case 'decreasing':

            if (h2 > h1) {

                h1 += 360;
            }

            break;

        case 'shorter':
        default:

            // shorter
            if (h2 - h1 > 180) {
                h1 += 360;
            } else if (h2 - h1 < -180) {

                h2 += 360;
            }

            break;
    }


    return [h1, h2];
}

export function colorMix(colorSpace: IdentToken, hueInterpolationMethod: IdentToken | null, color1: ColorToken, percentage1: PercentageToken | NumberToken | null, color2: ColorToken, percentage2: PercentageToken | NumberToken | null): ColorToken | null {

    if (color1.val.toLowerCase() == 'currentcolor' || color2.val == 'currentcolor'.toLowerCase()) {

        return null;
    }

    if (hueInterpolationMethod != null && isRectangularOrthogonalColorspace(colorSpace)) {

        return null;
    }

    if (isPolarColorspace(colorSpace) && hueInterpolationMethod == null) {

        hueInterpolationMethod = {typ: EnumToken.IdenTokenType, val: 'shorter'};
    }

    if (percentage1 == null) {

        if (percentage2 == null) {

            // @ts-ignore
            percentage1 = {typ: EnumToken.NumberTokenType, val: .5};
            // @ts-ignore
            percentage2 = {typ: EnumToken.NumberTokenType, val: .5};
        } else {

            if (+percentage2.val <= 0) {

                return null;
            }

            if (+percentage2.val >= 100) {

                percentage2 = {typ: EnumToken.NumberTokenType, val: 1} as NumberToken;
            }

            // @ts-ignore
            percentage1 = {typ: EnumToken.NumberTokenType, val: 1 - (percentage2 as NumberToken).val / 100};
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
                percentage1 = {typ: EnumToken.NumberTokenType, val: 1};
            }

            // @ts-ignore
            percentage2 = {typ: EnumToken.NumberTokenType, val: 1 - percentage1.val / 100};
        } else {

            // @ts-ignore
            if (percentage2.val <= 0) {

                return null;
            }
        }
    }

    let values1: number[] = <number[]>srgbvalues(color1);
    let values2: number[] = <number[]>srgbvalues(color2);

    if (values1 == null || values2 == null) {

        return null;
    }

    const components1: Token[] | null = getComponents(color1);
    const components2: Token[] | null = getComponents(color2);

    if (components1 == null || components2 == null) {

        return null;
    }

    if ((components1[3] != null && components1[3].typ == EnumToken.IdenTokenType && (components1[3] as IdentToken).val == 'none') && values2.length == 4) {

        values1[3] = values2[3];
    }

    if ((components2[3] != null && components2[3].typ == EnumToken.IdenTokenType && (components2[3] as IdentToken).val == 'none') && values1.length == 4) {

        values2[3] = values1[3];
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

    switch (colorSpace.val) {

        case 'srgb':

            break;

        case 'display-p3':

            // @ts-ignore
            values1 = srgb2p3values(...values1);
            // @ts-ignore
            values2 = srgb2p3values(...values2);
            break;

        case 'a98-rgb':

            // @ts-ignore
            values1 = srgb2a98values(...values1);
            // @ts-ignore
            values2 = srgb2a98values(...values2);
            break;

        case 'prophoto-rgb':

            // @ts-ignore
            values1 = srgb2prophotorgbvalues(...values1);
            // @ts-ignore
            values2 = srgb2prophotorgbvalues(...values2);
            break;

        case 'srgb-linear':

            // @ts-ignore
            values1 = srgb2lsrgbvalues(...values1);
            // @ts-ignore
            values2 = srgb2lsrgbvalues(...values2);
            break;

        case 'rec2020':

            // @ts-ignore
            values1 = srgb2rec2020values(...values1);
            // @ts-ignore
            values2 = srgb2rec2020values(...values2);
            break;

        case 'xyz':
        case 'xyz-d65':
        case 'xyz-d50':

            // @ts-ignore
            values1 = srgb2xyz_d50(...values1);
            // @ts-ignore
            values2 = srgb2xyz_d50(...values2);

            if (colorSpace.val == 'xyz-d50') {
                // @ts-ignore
                values1 = XYZ_D65_to_D50(...values1);
                // @ts-ignore
                values2 = XYZ_D65_to_D50(...values2);
            }

            break;

        case 'rgb':

            // @ts-ignore
            values1 = srgb2rgb(...values1);
            // @ts-ignore
            values2 = srgb2rgb(...values2);
            break;

        case 'hsl':

            // @ts-ignore
            values1 = srgb2hslvalues(...values1);
            // @ts-ignore
            values2 = srgb2hslvalues(...values2);
            break;

        case 'hwb':

            // @ts-ignore
            values1 = srgb2hwb(...values1);
            // @ts-ignore
            values2 = srgb2hwb(...values2);
            break;

        case 'lab':

            // @ts-ignore
            values1 = srgb2labvalues(...values1);
            // @ts-ignore
            values2 = srgb2labvalues(...values2);
            break;

        case 'lch':

            // @ts-ignore
            values1 = srgb2lch(...values1);
            // @ts-ignore
            values2 = srgb2lch(...values2);
            break;

        case 'oklab':

            // @ts-ignore
            values1 = srgb2oklab(...values1);
            // @ts-ignore
            values2 = srgb2oklab(...values2);
            break;

        case 'oklch':

            // @ts-ignore
            values1 = srgb2oklch(...values1);
            // @ts-ignore
            values2 = srgb2oklch(...values2);
            break;

        default:

            return null;
    }

    const lchSpaces: string[] = ['lch', 'oklch'];
    const colorSpace1 = ColorType[color1.kin].toLowerCase().replaceAll('_', '-');
    const colorSpace2 = ColorType[color2.kin].toLowerCase().replaceAll('_', '-');


    // powerless
    if (lchSpaces.includes(colorSpace1) || lchSpaces.includes(colorSpace.val)) {

        if ((components1[2].typ == EnumToken.IdenTokenType && (components1[2] as IdentToken).val == 'none') || values1[2] == 0) {

            values1[2] = values2[2];
        }
    }

    // powerless
    if (lchSpaces.includes(colorSpace2) || lchSpaces.includes(colorSpace.val)) {

        if ((components2[2].typ == EnumToken.IdenTokenType && (components2[2] as IdentToken).val == 'none') || values2[2] == 0) {

            values2[2] = values1[2];
        }
    }

    if (hueInterpolationMethod != null) {

        let hueIndex: number = 2;
        let multiplier: number = 1;

        if (['hwb', 'hsl'].includes(colorSpace.val)) {

            hueIndex = 0;
            multiplier = 360;
        }

        const [h1, h2] = interpolateHue(hueInterpolationMethod, values1[hueIndex] * multiplier, values2[hueIndex] * multiplier);

        values1[hueIndex] = h1 / multiplier;
        values2[hueIndex] = h2 / multiplier;
    }

    switch (colorSpace.val) {

        case 'xyz':
        case 'xyz-d65':
        case 'xyz-d50':

            let values: number[] = (<number[]>values1).map((v1: number, i: number) => (mul1 * v1 * p1 + mul2 * values2[i] * p2) / mul)
                .concat(mul == 1 ? [] : [mul]);

            if (colorSpace.val == 'xyz-d50') {
                // @ts-ignore
                values = xyzd502lch(...values);
            } else {

                // @ts-ignore
                values = xyz2lchvalues(...values);
            }

            // @ts-ignore
            return <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val: 'lch',
                chi: values.map(v => {
                    return {

                        typ: EnumToken.NumberTokenType,
                        val: v
                    }
                }),
                kin: ColorType.LCH
            };

        case 'srgb':
        case 'srgb-linear':
        case 'a98-rgb':
        case 'rec2020':

            // @ts-ignore
            return {
                typ: EnumToken.ColorTokenType,
                val: 'color',
                chi: calculate(),
                kin: ColorType.COLOR,
                cal: 'col'
            } as ColorToken;

        case 'rgb':
        case 'hsl':
        case 'hwb':
        case 'lab':
        case 'lch':
        case 'oklab':
        case 'oklch':

            if (['hsl', 'hwb'].includes(colorSpace.val)) {

                // @ts-ignore
                if (values1[2] < 0) {

                    // @ts-ignore
                    values1[2] += 1;
                }

                // @ts-ignore
                if (values2[2] < 0) {

                    // @ts-ignore
                    values2[2] += 1;
                }

            } else if (['lch', 'oklch'].includes(colorSpace.val)) {

                // @ts-ignore
                if (values1[2] < 0) {

                    // @ts-ignore
                    values1[2] += 360;
                }

                // @ts-ignore
                if (values2[2] < 0) {

                    // @ts-ignore
                    values2[2] += 360;
                }
            }

            // @ts-ignore
            const result: ColorToken = <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val: colorSpace.val,
                chi: calculate().slice(1),
                kin: ColorType[colorSpace.val.toUpperCase().replaceAll('-', '_') as keyof typeof ColorType]
            };

            if (colorSpace.val == 'hsl' || colorSpace.val == 'hwb') {

                // @ts-ignore
                result.chi[0] = {typ: EnumToken.AngleTokenType, val: result.chi[0].val * 360};
                // @ts-ignore
                result.chi[1] = {typ: EnumToken.PercentageTokenType, val: result.chi[1].val * 100};
                // @ts-ignore
                result.chi[2] = {typ: EnumToken.PercentageTokenType, val: result.chi[2].val * 100};

            }

            return result;
    }

    return null;
}