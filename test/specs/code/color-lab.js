import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, transform, parse, render) {

    describe('convert to lab', function () {

        it('hex to lab #1', function () {
            return transform(`.hsl { color: #b3222280; }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true)
            );
        });

        it('hsl(a) to lab #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('device-cmyk() to lab #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81.00558659217877% 81.00558659217877% 29.803921568627455%/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('rgb to lab #4', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('srgb to lab #5', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('srgb-linear to lab #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('display-p3 to lab #7', function () {
            return transform(`.hsl { color: color(display-p3 .6449802764484531 .19119980094061145 .16577088540310694/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('a98-rgb to lab #8', function () {
            return transform(`.hsl { color: color(a98-rgb .6014734178208441 .15252996199964947 .15252996199964927/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('photo-rgb to lab #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb .458932310317104 .20709804105465876 .12397162868002198/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('rec2020 to lab #10', function () {
            return transform(`.hsl { color: color(rec2020 .5293019037237446 .1758230143656851 .10251000214438549/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('xyz to lab #11', function () {
            return transform(`.hsl { color: color(xyz .1945069569161969 .108449498170369 .025825724073578846/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('xyz-d50 to lab #12', function () {
            return transform(`.hsl { color: color(xyz-d50 .2050219599912612 .11273398825257439 .019252589983419124/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('xyz-d65 to lab #13', function () {
            return transform(`.hsl { color: color(xyz .1945069569161969 .108449498170369 .025825724073578846/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('oklab to lab #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('oklch to lab #15', function () {
            return transform(`.hsl { color: oklch(.49863253097209403 .1806353283694016 26.8394/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('lch to lab #16', function () {
            return transform(`.hsl { color: lch(40.0371810192% 69.2335731799 34.7519908063 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });

        it('hwb to lab #17', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`, {
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result =>
                expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: 'lab',
                    chi: [
                        {typ: EnumToken.NumberTokenType, val: '40.03718101914915'},
                        {typ: EnumToken.NumberTokenType, val: '56.88418218837618'},
                        {typ: EnumToken.NumberTokenType, val: '39.46488910422299'},
                        {typ: EnumToken.LiteralTokenType, val: '/'},
                        {typ: EnumToken.PercentageTokenType, val: '50'}
                    ],
                    kin: ColorType.LAB
                })).equals(true));
        });
    });
}
