import '../../parser/parse.js';
import { isRectangularOrthogonalColorspace, isPolarColorspace } from '../../parser/utils/syntax.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { getNumber } from './color.js';
import { srgb2rgb } from './rgb.js';
import { powerlessColorComponent } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { srgb2hwb } from './hwb.js';
import { srgb2hsl } from './hsl.js';
import { srgbvalues, srgb2lsrgb } from './srgb.js';
import { srgb2lch, xyz2lchvalues } from './lch.js';
import { srgb2lab } from './lab.js';
import { srgb2p3 } from './p3.js';
import { eq } from '../../parser/utils/eq.js';
import { srgb2oklch } from './oklch.js';
import { srgb2oklab } from './oklab.js';
import { srgb2a98values } from './a98rgb.js';
import { srgb2prophotorgbvalues } from './prophotorgb.js';
import { srgb2xyz } from './xyz.js';
import { XYZ_D65_to_D50, xyzd502lch } from './xyzd50.js';
import { srgb2rec2020 } from './rec2020.js';
import '../sourcemap/lib/encode.js';

function interpolateHue(interpolationMethod, h1, h2) {
    switch (interpolationMethod.val) {
        case 'longer':
            if (h2 - h1 < 180 && h2 - h1 > 0) {
                h1 += 360;
            }
            else if (h2 - h1 <= 0 && h2 - h1 > -180) {
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
            }
            else if (h2 - h1 < -180) {
                h2 += 360;
            }
            break;
    }
    return [h1, h2];
}
function colorMix(colorSpace, hueInterpolationMethod, color1, percentage1, color2, percentage2) {
    if (hueInterpolationMethod != null && isRectangularOrthogonalColorspace(colorSpace)) {
        return null;
    }
    if (isPolarColorspace(colorSpace) && hueInterpolationMethod == null) {
        hueInterpolationMethod = { typ: EnumToken.IdenTokenType, val: 'shorter' };
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
    switch (colorSpace.val) {
        case 'srgb':
            break;
        case 'display-p3':
            // @ts-ignore
            values1 = srgb2p3(...values1);
            // @ts-ignore
            values2 = srgb2p3(...values2);
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
            values1 = srgb2lsrgb(...values1);
            // @ts-ignore
            values2 = srgb2lsrgb(...values2);
            break;
        case 'rec2020':
            // @ts-ignore
            values1 = srgb2rec2020(...values1);
            // @ts-ignore
            values2 = srgb2rec2020(...values2);
            break;
        case 'xyz':
        case 'xyz-d65':
        case 'xyz-d50':
            // @ts-ignore
            values1 = srgb2xyz(...values1);
            // @ts-ignore
            values2 = srgb2xyz(...values2);
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
    if (hueInterpolationMethod != null) {
        let hueIndex = 2;
        let multiplier = 1;
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
            let values = values1.map((v1, i) => (mul1 * v1 * p1 + mul2 * values2[i] * p2) / mul)
                .concat(mul == 1 ? [] : [mul]);
            if (colorSpace.val == 'xyz-d50') {
                // @ts-ignore
                values = xyzd502lch(...values);
            }
            else {
                // @ts-ignore
                values = xyz2lchvalues(...values);
            }
            // @ts-ignore
            return {
                typ: EnumToken.ColorTokenType,
                val: 'lch',
                chi: values.map(v => {
                    return {
                        typ: EnumToken.NumberTokenType,
                        val: String(v)
                    };
                }),
                kin: 'lch'
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
            // console.error(result);
            return result;
    }
    return null;
}

export { colorMix };
