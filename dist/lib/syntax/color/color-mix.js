import { EnumToken, ColorType } from '../../ast/types.js';
import { minmax, getNumber, toPrecisionValue, toPrecisionAngle } from './color.js';
import { srgbvalues, srgb2lsrgbvalues } from './srgb.js';
import { srgb2lch, xyz2lchvalues } from './lch.js';
import { srgb2rgb } from './rgb.js';
import { srgb2hslvalues } from './hsl.js';
import { srgb2hwb } from './hwb.js';
import { srgb2labvalues } from './lab.js';
import { srgb2p3values } from './p3.js';
import { getColorComponents } from './utils/components.js';
import { srgb2oklch } from './oklch.js';
import { srgb2oklab } from './oklab.js';
import { srgb2prophotorgbvalues } from './prophotorgb.js';
import { srgb2xyz_d65 } from './xyz.js';
import { XYZ_D65_to_D50, xyzd502lch } from './xyzd50.js';
import { srgb2rec2020values } from './rec2020.js';
import { isRectangularOrthogonalColorspace, isPolarColorspace } from '../syntax.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';

function interpolateHue(interpolationMethod, h1, h2) {
    switch (interpolationMethod) {
        case "longer":
            if (h2 - h1 < 180 && h2 - h1 > 0) {
                h1 += 360;
            }
            else if (h2 - h1 <= 0 && h2 - h1 > -180) {
                h2 += 360;
            }
            break;
        case "increasing":
            if (h2 < h1) {
                h2 += 360;
            }
            break;
        case "decreasing":
            if (h2 > h1) {
                h1 += 360;
            }
            break;
        case "shorter":
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
/**
 * Compute color mix
 * @param args
 * @returns
 */
function colorMix(...args) {
    // invalid color or custom color profile
    if (args.length == 0 || args[0].typ === EnumToken.DashedIdenTokenType) {
        return null;
    }
    let i = 0;
    let missingPercentageCount = 0;
    let totalPercentage = 0;
    let leftOverPercentage = 0;
    let colorSpace = "oklab";
    let hueInterpolationMethod = "shorter";
    let values = null;
    const colors = [];
    const percentages = [];
    const srgbComponentValues = [];
    const colorComponents = [];
    if (args[i]?.typ === EnumToken.IdenTokenType) {
        if (!equalsIgnoreCase(args[i++].val, "in")) {
            return null;
        }
        if (args[i]?.typ !== EnumToken.IdenTokenType) {
            return null;
        }
        if (isRectangularOrthogonalColorspace(args[i])) {
            colorSpace = args[i++].val;
        }
        else if (isPolarColorspace(args[i])) {
            colorSpace = args[i++].val;
            if (args[i]?.typ !== EnumToken.IdenTokenType && args[i]?.typ !== EnumToken.ColorTokenType) {
                return null;
            }
            if (args[i].typ === EnumToken.IdenTokenType && !equalsIgnoreCase(args[i].val, "hue")) {
                if (args[i]?.typ !== EnumToken.IdenTokenType) {
                    return null;
                }
                hueInterpolationMethod = args[i++].val;
                switch (hueInterpolationMethod) {
                    case "increasing":
                    case "decreasing":
                    case "longer":
                    case "shorter":
                        break;
                    default:
                        return null;
                }
                if (!equalsIgnoreCase(args[i++].val, "hue")) {
                    return null;
                }
            }
        }
    }
    while (i < args.length) {
        if (args[i].typ !== EnumToken.ColorTokenType ||
            ColorType.SYS == args[i].kin ||
            ColorType.DPSYS == args[i].kin ||
            ColorType.NON_STD == args[i].kin ||
            ColorType.CUSTOM_COLOR == args[i].kin ||
            equalsIgnoreCase(args[i].val, "currentcolor")) {
            return null;
        }
        colorComponents.push(getColorComponents(args[i]));
        values = srgbvalues(args[i]);
        if (values == null) {
            return null;
        }
        switch (colorSpace) {
            case "srgb":
                break;
            case "display-p3":
                // @ts-ignore
                values = srgb2p3values(...values);
                break;
            case "a98-rgb":
                // @ts-ignore
                values = srgb2a98values(...values);
                break;
            case "prophoto-rgb":
                // @ts-ignore
                values = srgb2prophotorgbvalues(...values);
                break;
            case "srgb-linear":
                // @ts-ignore
                values = srgb2lsrgbvalues(...values);
                break;
            case "rec2020":
                // @ts-ignore
                values = srgb2rec2020values(...values);
                break;
            case "xyz":
            case "xyz-d65":
                // @ts-ignore
                values = srgb2xyz_d65(...values);
                break;
            case "xyz-d50":
                // @ts-ignore
                values = XYZ_D65_to_D50(...srgb2xyz_d65(...values));
                break;
            case "rgb":
                // @ts-ignore
                values = srgb2rgb(...values);
                break;
            case "hsl":
                // @ts-ignore
                values = srgb2hslvalues(...values);
                break;
            case "hwb":
                // @ts-ignore
                values = srgb2hwb(...values);
                break;
            case "lab":
                // @ts-ignore
                values = srgb2labvalues(...values);
                break;
            case "lch":
                // @ts-ignore
                values = srgb2lch(...values);
                break;
            case "oklab":
                // @ts-ignore
                values = srgb2oklab(...values);
                break;
            case "oklch":
                // @ts-ignore
                values = srgb2oklch(...values);
                break;
            default:
                return null;
        }
        srgbComponentValues.push(values);
        colors.push(args[i++]);
        if (i >= args.length) {
            missingPercentageCount++;
            percentages.push(null);
            break;
        }
        if (args[i]?.typ === EnumToken.ColorTokenType) {
            percentages.push(null);
            missingPercentageCount++;
            continue;
        }
        if (args[i]?.typ === EnumToken.PercentageTokenType ||
            (args[i]?.typ === EnumToken.NumberTokenType && 0 == args[i].val)) {
            if (args[i].val < 0) {
                return null;
            }
            percentages.push(minmax(getNumber(args[i++]), 0, 1));
            totalPercentage += percentages.at(-1);
        }
    }
    // normalize percentages
    if (missingPercentageCount > 0) {
        let normalizedTotalPercentages = totalPercentage > 1 ? 0 : 1 - totalPercentage;
        for (i = 0; i < percentages.length; i++) {
            if (percentages[i] == null) {
                percentages[i] = normalizedTotalPercentages / missingPercentageCount;
            }
        }
        totalPercentage = 0;
        for (i = 0; i < percentages.length; i++) {
            totalPercentage += percentages[i];
        }
    }
    if (totalPercentage != 1) {
        if (totalPercentage < 1) {
            leftOverPercentage = 1 - totalPercentage;
        }
        const perc = totalPercentage == 0 ? 1 : totalPercentage;
        // scale down percentages
        for (i = 0; i < percentages.length; i++) {
            percentages[i] = percentages[i] / perc;
        }
        totalPercentage = 1;
    }
    i = colors.length;
    let currentIndex = 0;
    let r1;
    let r2;
    let r;
    let mult1;
    let mult2;
    let mult;
    let premult1;
    let premult2;
    let mixedPremult;
    let colorSpace1;
    const stack = [];
    const lchSpaces = ["lch", "oklch"];
    i = srgbComponentValues.length;
    while (i--) {
        stack.push({
            color: srgbComponentValues[i],
            alpha: percentages[i],
        });
    }
    // @ts-expect-error
    colorSpace1 = ColorType[colorComponents.at(-1).kin]?.toLowerCase?.();
    if (colorComponents[0][3] != null &&
        colorComponents[0][3].typ == EnumToken.IdenTokenType &&
        colorComponents[0][3].val == "none" &&
        colorComponents[1].length == 4) {
        // fix powerless alpha for last color if previous color has alpha
        stack[stack.length - 1].color[3] = stack[stack.length - 2].color[3];
    }
    // powerless hue for lch spaces
    if (lchSpaces.includes(colorSpace1) || lchSpaces.includes(colorSpace)) {
        if ((stack.length > 1 &&
            colorComponents[0][2].typ == EnumToken.IdenTokenType &&
            colorComponents[0][2].val == "none") ||
            stack[stack.length - 1].color[2] == 0) {
            stack[stack.length - 1].color[2] = stack[stack.length - 2].color[2];
        }
    }
    while (stack.length > 1) {
        r1 = stack.pop();
        r2 = stack.pop();
        // r2 powerless alpha
        if (colorComponents[++currentIndex][3] != null &&
            colorComponents[currentIndex][3].typ == EnumToken.IdenTokenType &&
            colorComponents[currentIndex][3].val == "none") {
            // fix powerless alpha for last color if previous color has alpha
            r2.color[3] = r1.color[3];
        }
        // @ts-expect-error
        colorSpace1 = ColorType[colorComponents[currentIndex].kin]?.toLowerCase?.();
        // powerless hue for lch spaces
        if (lchSpaces.includes(colorSpace1) || lchSpaces.includes(colorSpace)) {
            if ((colorComponents[currentIndex][2].typ == EnumToken.IdenTokenType &&
                colorComponents[currentIndex][2].val == "none") ||
                r2.color[2] == 0) {
                r2.color[2] = r1.color[2];
            }
        }
        if (hueInterpolationMethod != null) {
            let hueIndex = 2;
            let multiplier = 1;
            if (colorSpace == "hwb" || colorSpace == "hsl") {
                hueIndex = 0;
                multiplier = 360;
            }
            const [h1, h2] = interpolateHue(hueInterpolationMethod, r1.color[hueIndex] * multiplier, r2.color[hueIndex] * multiplier);
            r1.color[hueIndex] = h1 / multiplier;
            r2.color[hueIndex] = h2 / multiplier;
        }
        mult1 = r1.color[3] ?? 1;
        mult2 = r2.color[3] ?? 1;
        mult = mult1 * r1.alpha + mult2 * r2.alpha;
        premult1 = [r1.color[0] * mult1 * r1.alpha, r1.color[1] * mult1 * r1.alpha, r1.color[2] * mult1 * r1.alpha];
        premult2 = [r2.color[0] * mult2 * r2.alpha, r2.color[1] * mult2 * r2.alpha, r2.color[2] * mult2 * r2.alpha];
        mixedPremult = [premult1[0] + premult2[0], premult1[1] + premult2[1], premult1[2] + premult2[2]];
        if (mult == 0) {
            r = { color: [0, 0, 0, 0], alpha: 0 };
        }
        else {
            r = {
                color: [mixedPremult[0] / mult, mixedPremult[1] / mult, mixedPremult[2] / mult],
                alpha: mult,
            };
        }
        stack.push(r);
    }
    const result = stack.pop();
    values = result.color;
    values.length = 3;
    const alpha = result.alpha * (1 - leftOverPercentage);
    if (alpha != 1) {
        values.push(alpha);
    }
    switch (colorSpace) {
        case "xyz":
        case "xyz-d65":
        case "xyz-d50":
            if (colorSpace == "xyz-d50") {
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
                val: "lch",
                chi: values.map((v) => {
                    return {
                        typ: EnumToken.NumberTokenType,
                        val: toPrecisionValue(v),
                    };
                }),
                kin: ColorType.LCH,
            };
        case "srgb":
        case "srgb-linear":
        case "a98-rgb":
        case "rec2020":
            // @ts-ignore
            return {
                typ: EnumToken.ColorTokenType,
                val: "color",
                chi: [{ typ: EnumToken.IdenTokenType, val: colorSpace }].concat(
                // @ts-expect-error
                values.map((v) => {
                    return {
                        typ: EnumToken.NumberTokenType,
                        val: toPrecisionValue(v),
                    };
                })),
                kin: ColorType.COLOR,
                cal: "col",
            };
        case "rgb":
        case "hsl":
        case "hwb":
        case "lab":
        case "lch":
        case "oklab":
        case "oklch":
            if (colorSpace == "hsl" || colorSpace == "hwb") {
                // @ts-ignore
                if (values[2] < 0) {
                    // @ts-ignore
                    values[2] += 1;
                }
            }
            else if (colorSpace == "lch" || colorSpace == "oklch") {
                // @ts-ignore
                if (values[2] < 0) {
                    // @ts-ignore
                    values[2] += 360;
                }
                else if (values[2] > 360) {
                    // @ts-ignore
                    values[2] %= 360;
                }
            }
            // @ts-ignore
            const result = {
                typ: EnumToken.ColorTokenType,
                val: colorSpace,
                chi: values.map((v) => {
                    return {
                        typ: EnumToken.NumberTokenType,
                        val: toPrecisionValue(v),
                    };
                }),
                kin: ColorType[colorSpace.toUpperCase().replaceAll("-", "_")],
            };
            if (colorSpace == "hsl" || colorSpace == "hwb") {
                // @ts-ignore
                result.chi[0] = { typ: EnumToken.AngleTokenType, val: toPrecisionAngle(result.chi[0].val * 360) };
                // @ts-ignore
                result.chi[1] = { typ: EnumToken.PercentageTokenType, val: toPrecisionValue(result.chi[1].val) * 100 };
                // @ts-ignore
                result.chi[2] = { typ: EnumToken.PercentageTokenType, val: toPrecisionValue(result.chi[2].val) * 100 };
            }
            return result;
    }
    return null;
}

export { colorMix };
