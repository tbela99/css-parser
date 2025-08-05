import {ColorType} from "../../../dist/lib/ast/types.js";

export function run(describe, expect, transform, parse, render) {

    describe('convert to hsl', function () {

        it('hex to hsl #1', function () {
            return transform(`.hsl { color: #b3222280; }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089203% 41.764705882352935%/50%)
}`));
        });

        it('rgb to hsl #2', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089203% 41.764705882352935%/50%)
}`));
        });

        it('device-cmyk() to hsl #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81% 81% 30%/50%); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089203% 41.764705882352935%/50%)
}`));
        });

        it('hwb() to hsl #4', function () {
            return transform(`.hsl { color: hwb(0 13.33333333333332% 29.803921568627455%/50%); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089203% 41.764705882352935%/50%)
}`));
        });

        it('srgb to hsl #5', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089203% 41.764705882352935%/50%)
}`));
        });

        it('srgb-linear to hsl #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089203% 41.764705882352935%/50%)
}`));
        });

        it('display-p3 to hsl #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.50); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089953% 41.7647058823204%/50%)
}`));
        });

        it('a98-rgb to hsl #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.601473417821 0.152529962 0.152529962 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737081836% 41.76470588238075%/50%)
}`));
        });

        it('photo-rgb to hsl #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.458932310317 0.207098041055 0.12397162868 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07512660936695% 41.76470312492236%/50%)
}`));
        });

        it('rec2020 to hsl #10', function () {
            return transform(`.hsl { color: color(rec2020 0.529301903724 0.175823014366 0.102510002144 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737102666% 41.764705882334944%/50%)
}`));
        });

        it('xyz to hsl #11', function () {
            return transform(`.hsl { color: color(xyz-d65 0.194506956916 0.10844949817 0.025825724074 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737136221% 41.76470588222442%/50%)
}`));
        });

        it('xyz-d50 to hsl #12', function () {
            return transform(`.hsl { color: color(xyz-d50 0.205021959991 0.112733988253 0.019252589983 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07512661000305% 41.76470312472381%/50%)
}`));
        });

        it('xyz-d65 to hsl #13', function () {
            return transform(`.hsl { color: color(xyz-d65 0.194506956916 0.10844949817 0.025825724074 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737136221% 41.76470588222442%/50%)
}`));
        });

        it('oklab to hsl #14', function () {
            return transform(`.hsl { color: oklab(49.8632533734% 0.161176505417 0.081555225588 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511650877738% 41.76470607649652%/50%)
}`));
        });

        it('oklch to hsl #15', function () {
            return transform(`.hsl { color: oklch(49.8632533734% 0.180635325225 26.8393859717 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511650871648% 41.76470607651008%/50%)
}`));
        });

        it('lab to hsl #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089203% 41.764705882352935%/50%)
}`));
        });

        it('lch to hsl #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`,{
                beautify: true,
                convertColor: ColorType.HSL
            }).then(result => expect(result.code).equals(`.hsl {
 color: hsl(0 68.07511737089203% 41.764705882352935%/50%)
}`));
        });
    });
}
