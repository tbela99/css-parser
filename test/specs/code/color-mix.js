import { ColorType, EnumToken } from "../../../dist/lib/ast/types.js";
import { isOkLabClose } from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, it, transform, parse, render) {
    describe("color-mix()", function () {
        it("color-mix(in oklab, teal, olive, blue) #1", function () {
            return transform(`.hsl { color: color-mix(in oklab, teal, olive, blue); }`, {
                beautify: true,
                convertColor: ColorType.LCH,
            }).then((result) =>
                expect(
                    isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                        typ: EnumToken.ColorTokenType,
                        val: "oklab",
                        chi: [
                            { typ: EnumToken.NumberTokenType, val: 0.525267 },
                            { typ: EnumToken.NumberTokenType, val: -0.054972 },
                            { typ: EnumToken.NumberTokenType, val: -0.072015 },
                        ],
                        kin: ColorType.OKLAB,
                    }),
                ).equals(true),
            );
        });

        it("color-mix(firebrick, goldenrod) #2", function () {
            return transform(`.hsl { color: color-mix(firebrick, goldenrod); }`, {
                    beautify: true,
                    convertColor: ColorType.OKLAB
            }).then((result) =>
                expect(
                    isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                        typ: EnumToken.ColorTokenType,
                        val: "oklab",
                        chi: [
                            { typ: EnumToken.NumberTokenType, val: 0.624172 },
                            { typ: EnumToken.NumberTokenType, val: 0.087878 },
                            { typ: EnumToken.NumberTokenType, val: 0.113592 },
                        ],
                        kin: ColorType.OKLAB,
                    }),
                ).equals(true),
            );
        });

        it("color-mix(in oklch, teal 0%, olive 0%) #3", function () {
            return transform(`.hsl { color: color-mix(in oklch, teal 0%, olive 0%); }`, {
                beautify: true,
                convertColor: ColorType.OKLAB,
            }).then((result) =>
                expect(
                    isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                        typ: EnumToken.ColorTokenType,
                        val: "oklch",
                        chi: [
                            { typ: EnumToken.NumberTokenType, val: 0 },
                            { typ: EnumToken.NumberTokenType, val: 0 },
                            { typ: EnumToken.NumberTokenType, val: 0 },
                            { typ: EnumToken.PercentageTokenType, val: 0 },
                        ],
                        kin: ColorType.OKLCH,
                    }),
                ).equals(true),
            );
        });

        it("color-mix(in xyz, white, black, green) #4", function () {
            return transform(`.hsl { color: color-mix(in xyz, white, black, green); }`, {
                beautify: true,
                convertColor: ColorType.XYZ,
            }).then((result) =>
                expect(
                    isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                        typ: EnumToken.ColorTokenType,
                        val: "color",
                        chi: [
                            { typ: EnumToken.IdenTokenType, val: 'in'   },
                            { typ: EnumToken.IdenTokenType, val: 'xyz'   },
                            { typ: EnumToken.NumberTokenType, val: .342548   },
                            { typ: EnumToken.NumberTokenType, val: .384792 },
                            { typ: EnumToken.NumberTokenType, val: .371596 },
                        ],
                        kin: ColorType.COLOR,
                    }),
                ).equals(true),
            );
        });
    });
}
