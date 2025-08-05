import {ColorType} from "../../../dist/lib/ast/types.js";

export function run(describe, expect, transform, parse, render) {

    describe('convert to rgb', function () {

        it('hex to rgb #1', function () {
            return transform(`.hsl { color: #b3222280; }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('hsl(a) to rgb #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('device-cmyk() to rgb #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81% 81% 30%/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('hwb() to rgb #4', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('srgb to rgb #5', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('srgb-linear to rgb #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('display-p3 to rgb #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('a98-rgb to rgb #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.6015 0.1525 0.1525 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('photo-rgb to rgb #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('rec2020 to rgb #10', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('xyz to rgb #11', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('xyz-d50 to rgb #12', function () {
            return transform(`.hsl { color: color(xyz-d50 0.205 0.1127 0.0193 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('xyz-d65 to rgb #13', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('oklab to rgb #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('oklch to rgb #15', function () {
            return transform(`.hsl { color: oklch(.49863253097209403 .1806353283694016 26.839391611662446/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('lab to rgb #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });

        it('lch to rgb #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`,{
                beautify: true,
                convertColor: ColorType.RGB
            }).then(result => expect(result.code).equals(`.hsl {
 color: rgb(179 34 34/50%)
}`));
        });
    });
}
