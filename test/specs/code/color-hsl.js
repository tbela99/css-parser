import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, it, transform, parse, render) {

    describe('convert to hsl', function () {

        it('hex to hsl #1', function () {
            return transform(`.hsl { color: #b3222280; }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true)
            );
        });

        it('rgb to hsl #2', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('device-cmyk() to hsl #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81% 81% 30%/50%); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('hwb() to hsl #4', function () {
            return transform(`.hsl { color: hwb(0 13.33333333333332% 29.803921568627455%/50%); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('srgb to hsl #5', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('srgb-linear to hsl #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('display-p3 to hsl #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('a98-rgb to hsl #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.601473417821 0.152529962 0.152529962 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('photo-rgb to hsl #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.458932310317 0.207098041055 0.12397162868 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('rec2020 to hsl #10', function () {
            return transform(`.hsl { color: color(rec2020 0.529301903724 0.175823014366 0.102510002144 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('xyz to hsl #11', function () {
            return transform(`.hsl { color: color(xyz-d65 0.194506956916 0.10844949817 0.025825724074 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('xyz-d50 to hsl #12', function () {
            return transform(`.hsl { color: color(xyz-d50 0.205021959991 0.112733988253 0.019252589983 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('xyz-d65 to hsl #13', function () {
            return transform(`.hsl { color: color(xyz-d65 0.194506956916 0.10844949817 0.025825724074 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('oklab to hsl #14', function () {
            return transform(`.hsl { color: oklab(49.8632533734% 0.161176505417 0.081555225588 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('oklch to hsl #15', function () {
            return transform(`.hsl { color: oklch(49.8632533734% 0.180635325225 26.8393859717 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('lab to hsl #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });

        it('lch to hsl #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`, {
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hsl',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '68.07511737089203'},
                        {typ: EnumToken.PercentageTokenType, val: '41.764705882352935'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HSL
                })).equals(true));
        });
    });
}
