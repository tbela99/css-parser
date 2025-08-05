import {ColorType} from "../../../dist/lib/ast/types.js";

export function run(describe, expect, transform, parse, render) {

    describe('convert to hex', function () {

        it('rgb(a) to hex #1', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('hsl(a) to hex #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('device-cmyk() to hex #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81.00558659217877% 81.00558659217877% 29.803921568627455%/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('hwb() to hex #4', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('srgb to hex #5', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('srgb-linear to hex #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('display-p3 to hex #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('a98-rgb to hex #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.6015 0.1525 0.1525 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('photo-rgb to hex #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('rec2020 to hex #10', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('xyz to hex #11', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('xyz-d50 to hex #12', function () {
            return transform(`.hsl { color: color(xyz-d50 0.205 0.1127 0.0193 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('xyz-d65 to hex #13', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('oklab to hex #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('oklch to hex #15', function () {
            return transform(`.hsl { color: oklch(.49863253097209403 .1806353283694016 26.839391611662446/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('lab to hex #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });

        it('lch to hex #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`,{
                beautify: true,
                convertColor: ColorType.HEX
            }).then(result => expect(result.code).equals(`.hsl {
 color: #b3222280
}`));
        });
    });
}
