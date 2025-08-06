import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, transform, parse, render) {

    describe('convert to hwb', function () {

        it('hex to hwb #1', function () {
            return transform(`.hsl { color: #b3222280; }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'hwb',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '0'},
                        {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                        {typ: EnumToken.PercentageTokenType, val: '30'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.HWB
                })).equals(true)
            );
        });

        it('hsl(a) to hwb #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('device-cmyk() to hwb #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81% 81% 30%/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('rgb to hwb #4', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('srgb to hwb #5', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('srgb-linear to hwb #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('display-p3 to hwb #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('a98-rgb to hwb #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.6015 0.1525 0.1525 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('photo-rgb to hwb #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.458932310318 0.207098041055 0.12397162868 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('rec2020 to hwb #10', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.458932310318 0.207098041055 0.12397162868 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('xyz to hwb #11', function () {
            return transform(`.hsl { color: color(xyz .1945069569161969 .108449498170369 .025825724073578846/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('xyz-d50 to hwb #12', function () {
            return transform(`.hsl { color: color(xyz-d50 .2050219599912612 .11273398825257439 .019252589983419124/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('xyz-d65 to hwb #13', function () {
            return transform(`.hsl { color: color(xyz-d65 .1945069569161969 .108449498170369 .025825724073578846/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('oklab to hwb #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('oklch to hwb #15', function () {
            return transform(`.hsl { color:  oklch(.49863253097209403 .1806353283694016 26.8394/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('lab to hwb #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });

        it('lch to hwb #17', function () {
            return transform(`.hsl { color: lch(40.03718101914915 69.23357317984528 34.752/50%); }`, {
                beautify: true,
                convertColor: ColorType.HWB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'hwb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '13.333333333333334'},
                    {typ: EnumToken.PercentageTokenType, val: '30'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.HWB
            })).equals(true));
        });
    });
}
