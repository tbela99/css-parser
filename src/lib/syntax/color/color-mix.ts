import type { ColorToken, IdentToken, NumberToken, PercentageToken, Token } from "../../../@types/index.d.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { getNumber, minmax } from "./color.ts";
import { srgb2lsrgbvalues, srgbvalues } from "./srgb.ts";
import { srgb2lch, xyz2lchvalues } from "./lch.ts";
import { srgb2rgb } from "./rgb.ts";
import { srgb2hslvalues } from "./hsl.ts";
import { srgb2hwb } from "./hwb.ts";
import { srgb2labvalues } from "./lab.ts";
import { srgb2lp3values, srgb2p3values } from "./p3.ts";
import { getColorComponents } from "./utils/components.ts";
import { srgb2oklch } from "./oklch.ts";
import { srgb2oklab } from "./oklab.ts";
import { srgb2prophotorgbvalues } from "./prophotorgb.ts";
import { srgb2xyz_d65 } from "./xyz.ts";
import { XYZ_D65_to_D50, xyzd502lch } from "./xyzd50.ts";
import { srgb2rec2020values } from "./rec2020.ts";
import { isPolarColorspace, isRectangularOrthogonalColorspace } from "../syntax.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";
import { srgb2a98values } from "./a98rgb.ts";

function interpolateHue(interpolationMethod: string, h1: number, h2: number): number[] {
    switch (interpolationMethod) {
        case "longer":
            if (h2 - h1 < 180 && h2 - h1 > 0) {
                h1 += 360;
            } else if (h2 - h1 <= 0 && h2 - h1 > -180) {
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
            } else if (h2 - h1 < -180) {
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
export function colorMix(...args: Token[]): ColorToken | null {
    // invalid color or custom color profile
    if (args.length == 0 || args[0].typ === EnumToken.DashedIdenTokenType) {
        return null;
    }

    let i: number = 0;
    let missingPercentageCount: number = 0;
    let totalPercentage: number = 0;
    let leftOverPercentage: number = 0;
    let colorSpace: string = "oklab";
    let hueInterpolationMethod: string = "shorter";
    let values: number[] | null = null;
    const colors: ColorToken[] = [];
    const percentages: Array<number | null> = [];
    const srgbComponentValues: number[][] = [];
    const colorComponents: Token[][] = [];

    if (args[i]?.typ === EnumToken.IdenTokenType) {
        if (!equalsIgnoreCase((args[i++] as IdentToken).val, "in")) {
            return null;
        }

        if (args[i]?.typ !== EnumToken.IdenTokenType) {
            return null;
        }

        if (isRectangularOrthogonalColorspace(args[i] as IdentToken)) {
            colorSpace = (args[i++] as IdentToken).val;
        } else if (isPolarColorspace(args[i] as IdentToken)) {
            colorSpace = (args[i++] as IdentToken).val;

            if (args[i]?.typ !== EnumToken.IdenTokenType && args[i]?.typ !== EnumToken.ColorTokenType) {
                return null;
            }

            if (args[i].typ === EnumToken.IdenTokenType && !equalsIgnoreCase((args[i] as IdentToken).val, "hue")) {
                if (args[i]?.typ !== EnumToken.IdenTokenType) {
                    return null;
                }

                hueInterpolationMethod = (args[i++] as IdentToken).val;

                switch (hueInterpolationMethod) {
                    case "increasing":
                    case "decreasing":
                    case "longer":
                    case "shorter":
                        break;
                    default:
                        return null;
                }

                if (!equalsIgnoreCase((args[i++] as IdentToken).val, "hue")) {
                    return null;
                }
            }
        }
    }

    while (i < args.length) {
        if (
            args[i].typ !== EnumToken.ColorTokenType ||
            ColorType.SYS == (args[i] as ColorToken).kin ||
            ColorType.DPSYS == (args[i] as ColorToken).kin ||
            ColorType.NON_STD == (args[i] as ColorToken).kin ||
            ColorType.CUSTOM_COLOR == (args[i] as ColorToken).kin ||
            equalsIgnoreCase((args[i] as ColorToken).val, "currentcolor")
        ) {
            return null;
        }

        colorComponents.push(getColorComponents(args[i] as ColorToken) as Token[]);

        values = srgbvalues(args[i] as ColorToken);

        if (values == null) {
            return null;
        }

        switch (colorSpace) {
            case "srgb":
                break;

            case "display-p3":
                (values[0], values[1], values[2], values[3]);
                values = srgb2p3values(values[0], values[1], values[2], values[3]);
                break;

            case "display-p3-linear":
                (values[0], values[1], values[2], values[3]);
                values = srgb2lp3values(values[0], values[1], values[2], values[3]);
                break;

            case "a98-rgb":
                values = srgb2a98values(values[0], values[1], values[2], values[3]);
                break;

            case "prophoto-rgb":
                (values[0], values[1], values[2], values[3]);
                values = srgb2prophotorgbvalues(values[0], values[1], values[2], values[3]);
                break;

            case "srgb-linear":
                (values[0], values[1], values[2], values[3]);
                values = srgb2lsrgbvalues(values[0], values[1], values[2], values[3]);
                break;

            case "rec2020":
                (values[0], values[1], values[2], values[3]);
                values = srgb2rec2020values(values[0], values[1], values[2], values[3]);
                break;

            case "xyz":
            case "xyz-d65":
                (values[0], values[1], values[2], values[3]);
                values = srgb2xyz_d65(values[0], values[1], values[2], values[3]);
                break;
            case "xyz-d50":
                values = srgb2xyz_d65(values[0], values[1], values[2], values[3]);
                values = XYZ_D65_to_D50(values[0], values[1], values[2], values[3]);
                break;

            case "rgb":
                for (let j = 0; j < values.length; j++) {
                    values[j] = j == 3 ? values[j] : srgb2rgb(values[j]);
                }
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

        srgbComponentValues.push(values as number[]);
        colors.push(args[i++] as ColorToken);

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

        if (
            args[i]?.typ === EnumToken.PercentageTokenType ||
            (args[i]?.typ === EnumToken.NumberTokenType && 0 == (args[i] as NumberToken).val)
        ) {
            if (((args[i] as PercentageToken | NumberToken).val as number) < 0) {
                return null;
            }

            percentages.push(minmax(getNumber(args[i++] as PercentageToken | NumberToken), 0, 1));
            totalPercentage += percentages.at(-1) as number;
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
            totalPercentage += percentages[i] as number;
        }
    }

    if (totalPercentage != 1) {
        if (totalPercentage < 1) {
            leftOverPercentage = 1 - totalPercentage;
        }

        const perc: number = totalPercentage == 0 ? 1 : totalPercentage;

        // scale down percentages
        for (i = 0; i < percentages.length; i++) {
            percentages[i] = (percentages[i] as number) / perc;
        }

        totalPercentage = 1;
    }

    i = colors.length;
    let currentIndex: number = 0;
    let r1: { color: number[]; alpha: number };
    let r2: { color: number[]; alpha: number };
    let r: { color: number[]; alpha: number };
    let combinedPercentage: number;
    let progress: number;
    let mult1: number;
    let mult2: number;
    let mult: number;
    let premult1: number[];
    let premult2: number[];
    let mixedPremult: number[];
    let colorSpace1: string;
    const stack: Array<{ color: number[]; alpha: number }> = [];

    const lchSpaces: string[] = ["lch", "oklch"];

    i = srgbComponentValues.length;

    while (i--) {
        stack.push({
            color: srgbComponentValues[i],
            alpha: percentages[i] as number,
        });
    }

    // @ts-expect-error
    colorSpace1 = ColorType[colorComponents.at(-1).kin as keyof typeof ColorType]?.toLowerCase?.() as string;

    if (
        colorComponents[0][3] != null &&
        colorComponents[0][3].typ == EnumToken.IdenTokenType &&
        (colorComponents[0][3] as IdentToken).val == "none" &&
        colorComponents[1].length == 4
    ) {
        // fix powerless alpha for last color if previous color has alpha
        stack[stack.length - 1].color[3] = stack[stack.length - 2].color[3];
    }

    // powerless hue for lch spaces
    if (lchSpaces.includes(colorSpace1) || lchSpaces.includes(colorSpace)) {
        if (
            (stack.length > 1 &&
                colorComponents[0][2].typ == EnumToken.IdenTokenType &&
                (colorComponents[0][2] as IdentToken).val == "none") ||
            stack[stack.length - 1].color[2] == 0
        ) {
            stack[stack.length - 1].color[2] = stack[stack.length - 2].color[2]!;
        }
    }

    while (stack.length > 1) {
        r1 = stack.pop()!;
        r2 = stack.pop()!;

        // r2 powerless alpha
        if (
            colorComponents[++currentIndex][3] != null &&
            colorComponents[currentIndex][3].typ == EnumToken.IdenTokenType &&
            (colorComponents[currentIndex][3] as IdentToken).val == "none"
        ) {
            // fix powerless alpha for last color if previous color has alpha
            r2.color[3] = r1.color[3];
        }

        // @ts-expect-error
        colorSpace1 = ColorType[colorComponents[currentIndex].kin as keyof typeof ColorType]?.toLowerCase?.() as string;

        // powerless hue for lch spaces
        if (lchSpaces.includes(colorSpace1) || lchSpaces.includes(colorSpace)) {
            if (
                (colorComponents[currentIndex][2].typ == EnumToken.IdenTokenType &&
                    (colorComponents[currentIndex][2] as IdentToken).val == "none") ||
                r2.color[2] == 0
            ) {
                r2.color[2] = r1.color[2];
            }
        }

        if (hueInterpolationMethod != null) {
            let hueIndex: number = 2;
            let multiplier: number = 1;

            if (colorSpace == "hwb" || colorSpace == "hsl") {
                hueIndex = 0;
                multiplier = 360;
            }

            const [h1, h2] = interpolateHue(
                hueInterpolationMethod,
                r1.color[hueIndex] * multiplier,
                r2.color[hueIndex] * multiplier,
            );

            r1.color[hueIndex] = h1 / multiplier;
            r2.color[hueIndex] = h2 / multiplier;
        }

        combinedPercentage = r1.alpha + r2.alpha;

        progress = r2.alpha / combinedPercentage;

        if (progress == 0) {
            progress = 0.5;
        }

        mult1 = r1.color[3] ?? 1;
        mult2 = r2.color[3] ?? 1;
        mult = mult1 * r1.alpha + mult2 * r2.alpha;

        premult1 = [r1.color[0] * mult1 * r1.alpha, r1.color[1] * mult1 * r1.alpha, r1.color[2] * mult1 * r1.alpha];
        premult2 = [r2.color[0] * mult2 * r2.alpha, r2.color[1] * mult2 * r2.alpha, r2.color[2] * mult2 * r2.alpha];

        mixedPremult = [premult1[0] + premult2[0], premult1[1] + premult2[1], premult1[2] + premult2[2]];

        if (mult == 0) {
            r = { color: [0, 0, 0, 0], alpha: 0 };
        } else {
            r = {
                color: [mixedPremult[0] / mult, mixedPremult[1] / mult, mixedPremult[2] / mult],
                alpha: mult,
            };
        }

        stack.push(r);
    }

    const result = stack.pop() as { color: number[]; alpha: number };
    values = result.color as number[];
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
                values = xyzd502lch(values[0], values[1], values[2], values[3]) as number[];
            } else {
                (values[0], values[1], values[2], values[3]);
                values = xyz2lchvalues(values[0], values[1], values[2], values[3]) as number[];
            }

            // @ts-ignore
            return <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val: "lch",
                chi: values.map((v) => {
                    return {
                        typ: EnumToken.NumberTokenType,
                        val: v,
                    };
                }),
                kin: ColorType.LCH,
            };

        case "srgb":
        case "srgb-linear":
        case "a98-rgb":
        case "rec2020":
        case "display-p3":
        case "display-p3-linear":
        case "prophoto-rgb":
            // @ts-ignore
            return {
                typ: EnumToken.ColorTokenType,
                val: "color",
                chi: [{ typ: EnumToken.IdenTokenType, val: colorSpace }].concat(
                    // @ts-expect-error
                    values.map((v: number) => {
                        return {
                            typ: EnumToken.NumberTokenType,
                            val: v,
                        };
                    }) as Token[],
                ) as Token[],
                kin: ColorType.COLOR,
                cal: "col",
            } as ColorToken;

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
            } else if (colorSpace == "lch" || colorSpace == "oklch") {
                // @ts-ignore
                if (values[2] < 0) {
                    // @ts-ignore
                    values[2] += 360;
                } else if (values[2] > 360) {
                    // @ts-ignore
                    values[2] %= 360;
                }
            }

            // @ts-ignore
            const result: ColorToken = <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val: colorSpace,
                chi: values.map((v) => {
                    return {
                        typ: EnumToken.NumberTokenType,
                        val: v,
                    };
                }),
                kin: ColorType[colorSpace.toUpperCase().replaceAll("-", "_") as keyof typeof ColorType],
            };

            if (colorSpace == "hsl" || colorSpace == "hwb") {
                // @ts-ignore
                result.chi[0] = { typ: EnumToken.AngleTokenType, val: result.chi[0].val * 360 };
                // @ts-ignore
                result.chi[1] = { typ: EnumToken.PercentageTokenType, val: result.chi[1].val * 100 };
                // @ts-ignore
                result.chi[2] = { typ: EnumToken.PercentageTokenType, val: result.chi[2].val * 100 };
            }

            return result;
    }

    return null;
}
