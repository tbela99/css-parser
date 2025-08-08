import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, it, transform, parse, render) {

    describe('convert to oklch', function () {

        it('hex to oklch #1', function () {
            return transform(`.hsl { color: #b3222280; }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('hsl(a) to oklch #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('device-cmyk() to oklch #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81.00558659217877% 81.00558659217877% 29.803921568627455%/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('rgb to oklch #4', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('srgb to oklch #5', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('srgb-linear to oklch #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('display-p3 to oklch #7', function () {
            return transform(`.hsl { color: color(display-p3 .6449802764484531 .19119980094061145 .16577088540310694/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('a98-rgb to oklch #8', function () {
            return transform(`.hsl { color: color(a98-rgb .6014734178208441 .15252996199964947 .15252996199964927/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('photo-rgb to oklch #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb .458932310317104 .20709804105465876 .12397162868002198/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('rec2020 to oklch #10', function () {
            return transform(`.hsl { color: color(rec2020 .5293019037237446 .1758230143656851 .10251000214438549/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('xyz to oklch #11', function () {
            return transform(`.hsl { color: color(xyz .1945069569161969 .108449498170369 .025825724073578846/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('xyz-d50 to oklch #12', function () {
            return transform(`.hsl { color: color(xyz-d50 .2050219599912612 .11273398825257439 .019252589983419124/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('xyz-d65 to oklch #13', function () {
            return transform(`.hsl { color: color(xyz .1945069569161969 .108449498170369 .025825724073578846/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('oklab to oklch #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('lch to oklch #15', function () {
            return transform(`.hsl { color: lch(40.03718101914915 69.23357317984528 34.752/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('lab to lch #16', function () {
            return transform(`.hsl { color: lab(40.03718101914915 56.88418218837618 39.46488910422299/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });

        it('hwb to oklch #17', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`,{
                beautify: true,
                convertColor: ColorType.OKLCH
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'oklch',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: '.49863253097209403'},
                    {typ: EnumToken.NumberTokenType, val: '.1806353283694016'},
                    {typ: EnumToken.NumberTokenType, val: '26.8394'},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: '50'}
                ],
                kin: ColorType.OKLCH
            })).equals(true));
        });
    });
}
