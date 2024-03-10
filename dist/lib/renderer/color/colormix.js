import '../../parser/parse.js';
import { isRectangularOrthogonalColorspace } from '../../parser/utils/syntax.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { getNumber } from './color.js';
import { srgb2rgb } from './rgb.js';
import { powerlessColorComponent } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { srgb2hwb } from './hwb.js';
import { srgb2hsl } from './hsl.js';
import { srgbvalues, srgb2lsrgb } from './srgb.js';
import { srgb2xyz } from './xyzd65.js';
import { srgb2lch } from './lch.js';
import { srgb2lab } from './lab.js';
import { p32srgb } from './displayp3.js';
import { eq } from '../../parser/utils/eq.js';
import { srgb2oklch } from './oklch.js';
import { srgb2oklab } from './oklab.js';
import '../sourcemap/lib/encode.js';

function colorMix(colorSpace, hueInterpolationMethod, color1, percentage1, color2, percentage2) {
    if (hueInterpolationMethod != null && isRectangularOrthogonalColorspace(colorSpace)) {
        return null;
    }
    if (percentage1 == null) {
        if (percentage2 == null) {
            // @ts-ignore
            percentage1 = { typ: EnumToken.NumberTokenType, val: '.5' };
            // @ts-ignore
            percentage2 = { typ: EnumToken.NumberTokenType, val: '.5' };
        }
        else {
            if (+percentage2.val <= 0) {
                return null;
            }
            if (+percentage2.val >= 100) {
                // @ts-ignore
                percentage2 = { typ: EnumToken.NumberTokenType, val: '1' };
            }
            // @ts-ignore
            percentage1 = { typ: EnumToken.NumberTokenType, val: String(1 - percentage2.val / 100) };
        }
    }
    else {
        // @ts-ignore
        if (percentage1.val <= 0) {
            return null;
        }
        if (percentage2 == null) {
            // @ts-ignore
            if (percentage1.val >= 100) {
                // @ts-ignore
                percentage1 = { typ: EnumToken.NumberTokenType, val: '1' };
            }
            // @ts-ignore
            percentage2 = { typ: EnumToken.NumberTokenType, val: String(1 - percentage1.val / 100) };
        }
        else {
            // @ts-ignore
            if (percentage2.val <= 0) {
                return null;
            }
        }
    }
    let values1 = srgbvalues(color1);
    let values2 = srgbvalues(color2);
    if (values1 == null || values2 == null) {
        return null;
    }
    const components1 = getComponents(color1);
    const components2 = getComponents(color2);
    if (eq(components1[3], powerlessColorComponent) && values2.length == 4) {
        values1[3] = values2[3];
    }
    if (eq(components2[3], powerlessColorComponent) && values1.length == 4) {
        values2[3] = values1[3];
    }
    const p1 = getNumber(percentage1);
    const p2 = getNumber(percentage2);
    const mul1 = values1.length == 4 ? values1.pop() : 1;
    const mul2 = values2.length == 4 ? values2.pop() : 1;
    const mul = mul1 * p1 + mul2 * p2;
    // @ts-ignore
    const calculate = () => [colorSpace].concat(values1.map((v1, i) => {
        return {
            // @ts-ignore
            typ: EnumToken.NumberTokenType, val: String((mul1 * v1 * p1 + mul2 * values2[i] * p2) / mul)
        };
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
    //
    // let space1: string[] = ['srgb', 'rgb', 'xyz', 'xyz-d65', 'xyz-d50'];
    // let space2: string[] = ['lch', 'oklch'];
    // let space3: string[] = ['lab', 'oklab'];
    //
    // let match: boolean = false;
    //
    // for (const space of [space1, space2, space3]) {
    //
    //     // rectify
    //     // if (space.includes(colorSpace.val)) {
    //
    //     for (let i = 0; i < 3; i++) {
    //
    //         if (space.includes(color1.kin) && space.includes(color2.kin)) {
    //
    //             if (eq(components1[i], powerless)) {
    //
    //                 values2[i] = values1[i];
    //             } else if (eq(components2[i], powerless)) {
    //
    //                 values1[i] = values2[i];
    //             }
    //
    //             match = true;
    //         }
    //     }
    //
    //     //     break;
    //     // }
    //
    //     if (match) {
    //
    //         break;
    //     }
    // }
    // carry over
    // for (let i = 0; i < Math.min(components1.length, components2.length); i++) {
    //
    //     if (eq(pow))
    // }
    // console.error({colorSpace, values1, values2})
    const lchSpaces = ['lch', 'oklch'];
    // powerless
    if (lchSpaces.includes(color1.kin) || lchSpaces.includes(colorSpace.val)) {
        if (eq(components1[2], powerlessColorComponent) || values1[2] == 0) {
            values1[2] = values2[2];
        }
    }
    // powerless
    if (lchSpaces.includes(color1.kin) || lchSpaces.includes(colorSpace.val)) {
        if (eq(components2[2], powerlessColorComponent) || values2[2] == 0) {
            values2[2] = values1[2];
        }
    }
    // console.error({values1, values2});
    // if (isPolarColorspace(colorSpace)) {
    //
    //     interpolateHue(hueInterpolationMethod ?? {typ: EnumToken.IdenTokenType, val: 'shorter'}, values1, values2[]);
    // }
    switch (colorSpace.val) {
        case 'srgb':
        case 'srgb-linear':
        case 'xyz':
        case 'xyz-d65':
            // @ts-ignore
            return {
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
            if (['hsl', 'hwb'].includes(colorSpace.val)) {
                // console.error({values1, values2});
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
            }
            else if (['lch', 'oklch'].includes(colorSpace.val)) {
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
            const result = {
                typ: EnumToken.ColorTokenType,
                val: colorSpace.val,
                chi: calculate().slice(1),
                kin: colorSpace.val
            };
            if (colorSpace.val == 'hsl' || colorSpace.val == 'hwb') {
                // @ts-ignore
                result.chi[0] = { typ: EnumToken.AngleTokenType, val: String(result.chi[0].val * 360), unit: 'deg' };
                // @ts-ignore
                result.chi[1] = { typ: EnumToken.PercentageTokenType, val: String(result.chi[1].val * 100) };
                // @ts-ignore
                result.chi[2] = { typ: EnumToken.PercentageTokenType, val: String(result.chi[2].val * 100) };
            }
            // console.error(JSON.stringify(result, null, 1));
            // console.error({mul, p1, p2, mul1, mul2, values1, values2});
            return result;
    }
    return null;
}

export { colorMix };
