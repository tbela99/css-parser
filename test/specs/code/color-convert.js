import { AstArena } from "../../../dist/ast/arena.js";
import { parseString } from "../../../dist/parser/parse.js";
import { convertColor } from "../../../dist/syntax/color/color.js";
import { renderValue } from "../../../dist/printer/render.js";

// the color spaces a color can be converted to
const targets = [
    "HEX",
    "RGBA",
    "HSLA",
    "HWB",
    "CMYK",
    "OKLAB",
    "OKLCH",
    "LAB",
    "LCH",
    "SRGB",
    "PROPHOTO_RGB",
    "A98_RGB",
    "REC2020",
    "DISPLAY_P3",
    "SRGB_LINEAR",
    "XYZ",
    "XYZ_D50",
    "XYZ_D65",
];

// colors whose components cannot be computed
const uncomputable = [
    "rgb(var(--r) 0 0)",
    "hsl(var(--h) 50% 50%)",
    "hwb(var(--h) 10% 10%)",
    "lab(var(--l) 0 0)",
    "lch(var(--l) 30 120)",
    "oklab(var(--l) 0 0)",
    "oklch(var(--l) .1 120)",
    "color(srgb var(--r) 0 0)",
    "device-cmyk(var(--c) 0 0 0)",
];

// colors with edge case values: percentages, achromatic colors, none, alpha
const computable = [
    "rgb(100% 0% 0%)",
    "rgb(255 0 0 / 50%)",
    "hsl(120deg 0% 50%)",
    "hsl(0 0% 100%)",
    "hsl(none 50% 50%)",
    "hwb(0 60% 60%)",
    "hwb(120 10% 20% / .5)",
    "lab(50% 40 60)",
    "lch(50% 0 0)",
    "lch(50% 30% 120 / .5)",
    "oklab(50% .1 .1)",
    "oklch(60% 0 0)",
    "color(display-p3 1 0 0)",
    "color(xyz .2 .3 .4)",
    "color(xyz-d50 .2 .3 .4)",
    "device-cmyk(10% 20% 30% 40%)",
    "#f00a",
    "rebeccapurple",
    "transparent",
];

export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, transformSync) {
    describe("color conversion", function () {
        it("colors whose components cannot be computed are not converted #1", function () {
            for (const color of uncomputable) {
                for (const target of targets) {
                    if (ColorType[target] == null) {
                        continue;
                    }

                    const arena = new AstArena();
                    const token = parseString(arena, color)[0];
                    const result = convertColor(arena, token, ColorType[target]);

                    // either not converted, or returned as is
                    if (result != null) {
                        expect(renderValue(arena, result), `${color} -> ${target}`).contains("var(");
                    }
                }
            }
        });

        it("every color can be converted to every color space #2", function () {
            for (const color of computable) {
                for (const target of targets) {
                    if (ColorType[target] == null) {
                        continue;
                    }

                    const arena = new AstArena();
                    const token = parseString(arena, color)[0];
                    const result = convertColor(arena, token, ColorType[target]);

                    expect(result, `${color} -> ${target}`).not.equals(null);
                    expect(renderValue(arena, result), `${color} -> ${target}`).to.be.a("string").and.not.equals("");
                }
            }
        });

        it("rgb() percentages are converted to hsl() and hwb() #3", function () {
            expect(transformSync("a{color:rgb(100% 50% 0%)}", { convertColor: ColorType.HSLA }).code).equals("a{color:hsl(30 100% 50%)}");
            expect(transformSync("a{color:rgb(100% 50% 0%)}", { convertColor: ColorType.HWB }).code).equals("a{color:hwb(30 0 0)}");
            expect(transformSync("a{color:rgb(100% 50% 0%)}", { convertColor: ColorType.HEX }).code).equals("a{color:#ff8000}");
        });

        it("var() components are kept #4", function () {
            expect(transformSync("a{color:rgb(var(--r) 0 0)}", { convertColor: ColorType.HWB }).code).equals("a{color:rgb(var(--r) 0 0)}");
            expect(transformSync("a{color:rgb(var(--r) 0 0)}", { convertColor: ColorType.HSLA }).code).equals("a{color:rgb(var(--r) 0 0)}");
        });

        it("achromatic colors #5", function () {
            expect(transformSync("a{color:hwb(0 60% 60%)}").code).equals("a{color:grey}");
            expect(transformSync("a{color:hsl(120deg 0% 50%)}").code).equals("a{color:grey}");
            expect(transformSync("a{color:oklch(60% 0 0)}", { convertColor: ColorType.HEX }).code).equals("a{color:grey}");
        });
    });
}
