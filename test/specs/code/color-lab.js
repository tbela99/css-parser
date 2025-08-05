import {ColorType} from "../../../dist/lib/ast/types.js";

export function run(describe, expect, transform, parse, render) {

    describe('convert to lab', function () {

        it('hex to lab #1', function () {
            return transform(`.hsl { color: #b3222280; }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718101914915 56.88418218837618 39.46488910422299/50%)
}`));
        });

        it('hsl(a) to lab #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718101914916 56.88418218837621 39.46488910422302/50%)
}`));
        });

        it('device-cmyk() to lab #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81.00558659217877% 81.00558659217877% 29.803921568627455%/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718101914915 56.88418218837618 39.464889104223/50%)
}`));
        });

        it('rgb to lab #4', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718101914915 56.88418218837618 39.46488910422299/50%)
}`));
        });

        it('srgb to lab #5', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718101914915 56.88418218837618 39.46488910422299/50%)
}`));
        });

        it('srgb-linear to lab #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718101914915 56.88418218837618 39.46488910422299/50%)
}`));
        });

        it('display-p3 to lab #7', function () {
            return transform(`.hsl { color: color(display-p3 .6449802764484531 .19119980094061145 .16577088540310694/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.037181019149145 56.88418218837621 39.464889104222976/50%)
}`));
        });

        it('a98-rgb to lab #8', function () {
            return transform(`.hsl { color: color(a98-rgb .6014734178208441 .15252996199964947 .15252996199964927/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718101914915 56.88418218837618 39.46488910422303/50%)
}`));
        });

        it('photo-rgb to lab #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb .458932310317104 .20709804105465876 .12397162868002198/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718208850436 56.88417703992932 39.46489665229738/50%)
}`));
        });

        it('rec2020 to lab #10', function () {
            return transform(`.hsl { color: color(rec2020 .5293019037237446 .1758230143656851 .10251000214438549/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718101914915 56.88418218837618 39.46488910422301/50%)
}`));
        });

        it('xyz to lab #11', function () {
            return transform(`.hsl { color: color(xyz .1945069569161969 .108449498170369 .025825724073578846/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.037181019149145 56.88418218837621 39.464889104222976/50%)
}`));
        });

        it('xyz-d50 to lab #12', function () {
            return transform(`.hsl { color: color(xyz-d50 .2050219599912612 .11273398825257439 .019252589983419124/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718208850436 56.88417703992932 39.46489665229738/50%)
}`));
        });

        it('xyz-d65 to lab #13', function () {
            return transform(`.hsl { color: color(xyz .1945069569161969 .108449498170369 .025825724073578846/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.037181019149145 56.88418218837621 39.464889104222976/50%)
}`));
        });

        it('oklab to lab #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.03718076892181 56.88418206211679 39.4649004160266/50%)
}`));
        });

        it('oklch to lab #15', function () {
            return transform(`.hsl { color: oklch(.49863253097209403 .1806353283694016 26.8394/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.037181177031805 56.884180466518025 39.46490425796163/50%)
}`));
        });

        it('lch to lab #16', function () {
            return transform(`.hsl { color: lch(40.0371810192% 69.2335731799 34.7519908063 / 0.501960784314); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(40.0371810192 56.8841821884395 39.464889104227716/50%)
}`));
        });

        it('hwb to lab #17', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`,{
                beautify: true,
                convertColor: ColorType.LAB
            }).then(result => expect(result.code).equals(`.hsl {
 color: lab(39.93386497177585 56.73647948664537 39.3253251437074/50%)
}`));
        });
    });
}
