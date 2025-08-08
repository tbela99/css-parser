import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, it, transform, parse, render) {

    describe('convert to cmyk', function () {

        it('hex to cmyk #1', function () {
            return transform(`.hsl { color: #b3222280; }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('hsl(a) to cmyk #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('rgb to cmyk #3', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('hwb() to cmyk #4', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('srgb to cmyk #5', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('srgb-linear to cmyk #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('display-p3 to cmyk #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('a98-rgb to cmyk #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.6015 0.1525 0.1525 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('photo-rgb to cmyk #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('rec2020 to cmyk #10', function () {
            return transform(`.hsl { color: color(rec2020 .5293019037237446 .1758230143656851 .10251000214438549/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('xyz to cmyk #11', function () {
            return transform(`.hsl { color: color(xyz .1945069569161968 .10844949817036895 .025825724073578825/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('xyz-d50 to cmyk #12', function () {
            return transform(`.hsl { color: color(xyz-d50 .20502195999126108 .11273398825257433 .019252589983419107/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('xyz-d65 to cmyk #13', function () {
            return transform(`.hsl { color: color(xyz .1945069569161968 .10844949817036895 .025825724073578825/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('oklab to cmyk #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('oklch to cmyk #15', function () {
            return transform(`.hsl { color: oklch(.49863253097209403 .1806353283694016 26.839391611662446/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('lab to cmyk #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });

        it('lch to cmyk #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`, {
                beautify: true,
                convertColor: ColorType.DEVICE_CMYK
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'device-cmyk',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '0'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '81.00558659217877'},
                    {typ: EnumToken.PercentageTokenType, val: '29.803921568627455'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.DEVICE_CMYK
            })).equals(true));
        });
    });
}
