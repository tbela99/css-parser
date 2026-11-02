/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumToken, ColorType, EnumAstNodeStatus } from '../../ast/types.js';
import { minmax, getNumber } from './color.js';
import { srgbvalues, srgb2lsrgbvalues, hslvalues } from './srgb.js';
import { srgb2lch, xyz2lchvalues, getLCHComponents } from './lch.js';
import { srgb2hslvalues } from './hsl.js';
import { srgb2hwb, hwbvalues } from './hwb.js';
import { srgb2labvalues } from './lab.js';
import { srgb2lp3values, srgb2p3values } from './p3.js';
import { getColorComponents } from './utils/components.js';
import { srgb2oklch, getOKLCHComponents } from './oklch.js';
import { srgb2oklab } from './oklab.js';
import { srgb2prophotorgbvalues } from './prophotorgb.js';
import { srgb2xyz_d65 } from './xyz.js';
import { XYZ_D65_to_D50, xyzd502lch } from './xyzd50.js';
import { srgb2rec2020values } from './rec2020.js';
import { isRectangularOrthogonalColorspace, isPolarColorspace } from '../syntax.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';
import { srgb2a98values } from './a98rgb.js';
import { colorRange } from '../constants.js';

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
function colorMix(arena, ...args) {
    // invalid color or custom color profile
    if (args.length == 0 || arena.dataTypes[args[0]] === EnumToken.DashedIdenTokenType) {
        return null;
    }
    let i = 0;
    let missingPercentageCount = 0;
    let totalPercentage = 0;
    let leftOverPercentage = 0;
    let colorSpace = "oklab";
    let hueInterpolationMethod = "shorter";
    let values = null;
    // const colors: Token[] = [];
    const percentages = [];
    const srgbComponentValues = [];
    const colorComponents = [];
    const colors = [];
    if (arena.dataTypes[args[i]] === EnumToken.IdenTokenType) {
        if (!equalsIgnoreCase(arena.strings[arena.stringValue[args[i++]]], "in")) {
            return null;
        }
        if (arena.dataTypes[args[i]] !== EnumToken.IdenTokenType) {
            return null;
        }
        if (isRectangularOrthogonalColorspace(arena, args[i])) {
            colorSpace = arena.strings[arena.stringValue[args[i++]]];
        }
        else if (isPolarColorspace(arena, args[i])) {
            colorSpace = arena.strings[arena.stringValue[args[i++]]];
            if (arena.dataTypes[args[i]] !== EnumToken.IdenTokenType && arena.dataTypes[args[i]] !== EnumToken.ColorTokenType) {
                return null;
            }
            if (arena.dataTypes[args[i]] === EnumToken.IdenTokenType && !equalsIgnoreCase(arena.strings[arena.stringValue[args[i]]], "hue")) {
                if (arena.dataTypes[args[i]] !== EnumToken.IdenTokenType) {
                    return null;
                }
                hueInterpolationMethod = arena.strings[arena.stringValue[args[i++]]];
                switch (hueInterpolationMethod) {
                    case "increasing":
                    case "decreasing":
                    case "longer":
                    case "shorter":
                        break;
                    default:
                        return null;
                }
                if (!equalsIgnoreCase(arena.strings[arena.stringValue[args[i++]]], "hue")) {
                    return null;
                }
            }
        }
    }
    while (i < args.length) {
        if (arena.dataTypes[args[i]] !== EnumToken.ColorTokenType ||
            ColorType.SYS == arena.colorType[args[i]] ||
            ColorType.DPSYS == arena.colorType[args[i]] ||
            ColorType.NON_STD == arena.colorType[args[i]] ||
            ColorType.CUSTOM_COLOR == arena.colorType[args[i]] ||
            equalsIgnoreCase(arena.strings[arena.stringValue[args[i]]], "currentcolor")) {
            return null;
        }
        colorComponents.push(getColorComponents(arena, args[i]));
        values = srgbvalues(arena, args[i]);
        if (values == null) {
            return null;
        }
        // if (colorSpace == "hwb") {
        //     colorSpace = "srgb";
        // }
        colors.push(processPowerlessComponents(arena, args[i]));
        switch (colorSpace) {
            case "srgb":
                break;
            case "display-p3":
                values = srgb2p3values(values[0], values[1], values[2], values[3]);
                break;
            case "display-p3-linear":
                values = srgb2lp3values(values[0], values[1], values[2], values[3]);
                break;
            case "a98-rgb":
                values = srgb2a98values(values[0], values[1], values[2], values[3]);
                break;
            case "prophoto-rgb":
                values = srgb2prophotorgbvalues(values[0], values[1], values[2], values[3]);
                break;
            case "srgb-linear":
                values = srgb2lsrgbvalues(values[0], values[1], values[2], values[3]);
                break;
            case "rec2020":
                values = srgb2rec2020values(values[0], values[1], values[2], values[3]);
                break;
            case "xyz":
            case "xyz-d65":
                values = srgb2xyz_d65(values[0], values[1], values[2], values[3]);
                break;
            case "xyz-d50":
                values = srgb2xyz_d65(values[0], values[1], values[2], values[3]);
                values = XYZ_D65_to_D50(values[0], values[1], values[2], values[3]);
                break;
            case "hsl":
                values = srgb2hslvalues(values[0], values[1], values[2], values[3]);
                break;
            case "hwb":
                values = srgb2hwb(values[0], values[1], values[2], values[3]);
                break;
            case "lab":
                values = srgb2labvalues(values[0], values[1], values[2], values[3]);
                break;
            case "lch":
                values = srgb2lch(values[0], values[1], values[2], values[3]);
                break;
            case "oklab":
                values = srgb2oklab(values[0], values[1], values[2], values[3]);
                break;
            case "oklch":
                values = srgb2oklch(values[0], values[1], values[2], values[3]);
                break;
            default:
                return null;
        }
        srgbComponentValues.push(values);
        // colors.push(args[i++]);
        i++;
        if (i >= args.length) {
            missingPercentageCount++;
            percentages.push(null);
            break;
        }
        if (arena.dataTypes[args[i]] === EnumToken.ColorTokenType) {
            percentages.push(null);
            missingPercentageCount++;
            continue;
        }
        if (arena.dataTypes[args[i]] === EnumToken.PercentageTokenType ||
            (arena.dataTypes[args[i]] === EnumToken.NumberTokenType && 0 == arena.numericValue[args[i]])) {
            if (arena.numericValue[args[i]] < 0) {
                return null;
            }
            percentages.push(minmax(getNumber(arena, args[i++]), 0, 1));
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
    }
    const stack = [];
    // const lchSpaces: string[] = ["lch", "oklch"];
    const isLCHOrOKLCH = colorSpace === "lch" || colorSpace == "oklch";
    i = srgbComponentValues.length;
    while (i--) {
        stack.push({
            color: srgbComponentValues[i],
            alpha: percentages[i],
        });
    }
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
    let offset1 = arena.colorType[colors[0]] == ColorType.COLOR ? 1 : 0;
    if (colorComponents[0][offset1 + 3] != null &&
        arena.dataTypes[colorComponents[0][offset1 + 3]] == EnumToken.IdenTokenType &&
        arena.strings[arena.stringValue[colorComponents[0][offset1 + 3]]] == "none" &&
        colorComponents[1].length == offset1 + 4) {
        // fix powerless alpha for last color if previous color has alpha
        stack[stack.length - 1].color[3] = stack[stack.length - 2].color[3];
    }
    // console.error(stack);
    if (stack.length > 1) {
        // powerless hue for lch spaces
        // if (lchSpaces.includes(colorSpace)) {
        // console.error(JSON.stringify({colorSpace1, colorSpace, stack, colorComponents}, null, 1));
        if ((stack[stack.length - 1].color[0] == 0 && arena.dataTypes[colorComponents[0][offset1]] == EnumToken.IdenTokenType &&
            arena.strings[arena.stringValue[colorComponents[0][offset1]]] == "none") ||
            arena.flags[colorComponents[0][0]] & EnumAstNodeStatus.PowerlessColorComponent) {
            stack[stack.length - 1].color[0] = stack[stack.length - 2].color[0];
        }
        if ((stack[stack.length - 1].color[1] == 0 && arena.dataTypes[colorComponents[0][offset1 + 1]] == EnumToken.IdenTokenType &&
            arena.strings[arena.stringValue[colorComponents[0][offset1 + 1]]] == "none") ||
            arena.flags[colorComponents[0][1]] & EnumAstNodeStatus.PowerlessColorComponent) {
            stack[stack.length - 1].color[1] = stack[stack.length - 2].color[1];
        }
        if ((stack[stack.length - 1].color[2] == 0 && arena.dataTypes[colorComponents[0][offset1 + 2]] == EnumToken.IdenTokenType &&
            arena.strings[arena.stringValue[colorComponents[0][offset1 + 2]]] == "none") ||
            arena.flags[colorComponents[0][2]] & EnumAstNodeStatus.PowerlessColorComponent ||
            (isLCHOrOKLCH &&
                (stack[stack.length - 1].color[1] == 0 ||
                    stack[stack.length - 1].color[0] == 0 ||
                    stack[stack.length - 1].color[0] ==
                        colorRange[arena.colorType[colors[0]] == ColorType.LCH ? "lch" : "oklch"].l[1]))) {
            stack[stack.length - 1].color[2] = stack[stack.length - 2].color[2];
        }
        // }
    }
    // console.error([arena.dataTypes[colorComponents[0][offset1]] == EnumToken.IdenTokenType, arena.strings[arena.stringValue[colorComponents[0][offset1]]] == "none"]);
    // console.error(isLCHOrOKLCH, colorComponents, stack);
    while (stack.length > 1) {
        r1 = stack.pop();
        r2 = stack.pop();
        offset1 = arena.colorType[colors[++currentIndex]] == ColorType.COLOR ? 1 : 0;
        // r2 powerless alpha
        if (colorComponents[currentIndex][offset1 + 3] != null &&
            arena.dataTypes[colorComponents[currentIndex][offset1 + 3]] == EnumToken.IdenTokenType &&
            arena.strings[arena.stringValue[colorComponents[currentIndex][offset1 + 3]]] == "none") {
            // fix powerless alpha for last color if previous color has alpha
            r2.color[3] = r1.color[3];
        }
        // powerless hue for lch spaces
        if ((r2.color[0] == 0 && arena.dataTypes[colorComponents[currentIndex][offset1]] == EnumToken.IdenTokenType &&
            arena.strings[arena.stringValue[colorComponents[currentIndex][offset1]]] == "none") ||
            arena.flags[colorComponents[currentIndex][offset1]] & EnumAstNodeStatus.PowerlessColorComponent) {
            r2.color[0] = r1.color[0];
        }
        if ((r2.color[1] == 0 && arena.dataTypes[colorComponents[currentIndex][offset1 + 1]] == EnumToken.IdenTokenType &&
            arena.strings[arena.stringValue[colorComponents[currentIndex][offset1 + 1]]] == "none") ||
            arena.flags[colorComponents[currentIndex][offset1 + 1]] & EnumAstNodeStatus.PowerlessColorComponent) {
            r2.color[1] = r1.color[1];
        }
        if ((r2.color[2] == 0 && arena.dataTypes[colorComponents[currentIndex][offset1 + 2]] == EnumToken.IdenTokenType &&
            arena.strings[arena.stringValue[colorComponents[currentIndex][offset1 + 2]]] == "none") ||
            arena.flags[colorComponents[currentIndex][offset1 + 2]] & EnumAstNodeStatus.PowerlessColorComponent ||
            (isLCHOrOKLCH &&
                (r2.color[1] == 0 ||
                    r2.color[0] == 0 ||
                    r2.color[0] == colorRange[arena.colorType[colors[currentIndex]] == ColorType.LCH ? "lch" : "oklch"].l[1]))) {
            r2.color[2] = r1.color[2];
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
        // console.error({ r1, r2, r, premult1, mult1, premult2, mult2, mixedPremult, mult });
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
                values = xyzd502lch(values[0], values[1], values[2], values[3]);
            }
            else {
                values = xyz2lchvalues(values[0], values[1], values[2], values[3]);
            }
            return arena.createColor("lch", ColorType.LCH, values.map((val) => arena.createToken(EnumToken.NumberTokenType, val)));
        case "srgb":
        case "srgb-linear":
        case "a98-rgb":
        case "rec2020":
        case "display-p3":
        case "display-p3-linear":
        case "prophoto-rgb":
            {
                const color = arena.createColor("color", ColorType.COLOR, [arena.createToken(EnumToken.IdenTokenType, colorSpace)].concat(values.map((v) => arena.createToken(EnumToken.NumberTokenType, v))));
                arena.setUnitString(color, "col");
                return color;
            }
        // case "rgb":
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
                    values[2] += 360;
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
            const components = values.map((v) => arena.createToken(EnumToken.NumberTokenType, v));
            if (colorSpace == "hsl") {
                arena.dataTypes[components[0]] = EnumToken.AngleTokenType;
                arena.setUnitString(components[0], "deg");
                arena.dataTypes[components[1]] = EnumToken.PercentageTokenType;
                arena.dataTypes[components[2]] = EnumToken.PercentageTokenType;
            }
            return arena.createColor(colorSpace, ColorType[colorSpace.toUpperCase().replaceAll("-", "_")], components);
    }
    return null;
}
function processPowerlessComponents(arena, color) {
    let components;
    let values;
    switch (arena.colorType[color]) {
        case ColorType.LCH:
        case ColorType.OKLCH:
            values = arena.colorType[color] == ColorType.LCH ? getLCHComponents(arena, color) : getOKLCHComponents(arena, color);
            components = getColorComponents(arena, color);
            if (values == null || values.length < 3 || components == null) {
                break;
            }
            const max = arena.colorType[color] == ColorType.LCH ? colorRange.lch.l[1] : colorRange.oklch.l[1];
            // https://www.w3.org/TR/css-color-4/#specifying-lab-lch
            // https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch
            const epsilon = arena.colorType[color] == ColorType.LCH ? 0.0015 : 0.000004;
            if (values[0] < epsilon || Math.abs(values[0] - max) < epsilon) {
                arena.resetToken(components[0], EnumToken.NumberTokenType, values[0] < epsilon ? 0 : max);
                arena.resetToken(components[1], EnumToken.IdenTokenType, "none");
                arena.resetToken(components[2], EnumToken.IdenTokenType, "none");
                setColorFlag(arena, components[1], EnumAstNodeStatus.PowerlessColorComponent);
                setColorFlag(arena, components[2], EnumAstNodeStatus.PowerlessColorComponent);
            }
            else if (values[1] < epsilon) {
                values[1] = 0;
                arena.resetToken(components[1], EnumToken.NumberTokenType, 0);
                arena.resetToken(components[2], EnumToken.IdenTokenType, "none");
                setColorFlag(arena, components[2], EnumAstNodeStatus.PowerlessColorComponent);
            }
            break;
        case ColorType.HSL:
        case ColorType.HWB:
            values = Object.values((arena.colorType[color] == ColorType.HSL ? hslvalues(arena, color) : hwbvalues(arena, color)) ?? {});
            components = getColorComponents(arena, color);
            if (values == null || values.length < 3 || components == null) {
                break;
            }
            // https://www.w3.org/TR/css-color-4/#the-hsl-notation
            // https://www.w3.org/TR/css-color-4/#the-hwb-notation
            if ((arena.colorType[color] == ColorType.HSL && values[1] <= 0.001) ||
                (arena.colorType[color] == ColorType.HWB && values[1] + values[2] >= 99.999)) {
                arena.resetToken(components[0], EnumToken.IdenTokenType, "none");
                setColorFlag(arena, components[0], EnumAstNodeStatus.PowerlessColorComponent);
            }
            break;
    }
    // console.error({ color: arena.tokens(color) ?? color, values });
    return color;
}
function setColorFlag(arena, token, flag) {
    arena.flags[token] |= flag;
}

export { colorMix };
