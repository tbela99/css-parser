import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, it, transform, parse, render) {

    describe('convert to rgb', function () {

        it('hex to rgb #1', function () {
            return transform(`.hsl { color: #b3222280; }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('hsl(a) to rgb #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('device-cmyk() to rgb #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81.005587% 81.005587% 29.803922%/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('hwb() to rgb #4', function () {
            return transform(`.hsl { color: hwb(0 13.333333% 32%/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            }, 
        .1)).equals(true));
        });

        it('srgb to rgb #5', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            }, 0.1)).equals(true));
        });

        it('srgb-linear to rgb #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('display-p3 to rgb #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('a98-rgb to rgb #8', function () {
            return transform(`.hsl { color: color(a98-rgb .601473 .15253 .15253/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('photo-rgb to rgb #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb .458932 .207098 .123972/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('rec2020 to rgb #10', function () {
            return transform(`.hsl { color: color(prophoto-rgb .458932 .207098 .123972); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('xyz to rgb #11', function () {
            return transform(`.hsl { color: color(xyz .194507 .108449 .025826/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('xyz-d50 to rgb #12', function () {
            return transform(`.hsl { color: color(xyz-d50 .205022 .112734 .019253/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('xyz-d65 to rgb #13', function () {
            return transform(`.hsl { color: color(xyz-d65 .194507 .108449 .025826/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('oklab to rgb #14', function () {
            return transform(`.hsl { color: oklab(.498633 .161177 .081555/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('oklch to rgb #15', function () {
            return transform(`.hsl { color: oklch(.498633 .180635 26.839392/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('lab to rgb #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });

        it('lch to rgb #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`, {
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi: [
                    {typ: EnumToken.NumberTokenType, val: 179},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.NumberTokenType, val: 34},
                    {typ: EnumToken.LiteralTokenType, val: '/'},
                    {typ: EnumToken.PercentageTokenType, val: 50}
                ],
                kin: ColorType.RGB
            })).equals(true));
        });
    });
}
