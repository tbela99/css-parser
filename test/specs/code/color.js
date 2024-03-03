
export function run(describe, expect, transform, parse, render) {
    
    describe('Parse color', function () {

        it('hsl #1', function () {
            return parse(`.hsl { color: hsl(195, 100%, 50%); }`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.hsl {
 color: #00bfff
}`));
        });

        it('hsl #2', function () {
            return parse(`.hsl { color: hsla(195, 100%, 50%, 50%); }`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.hsl {
 color: #00bfff80
}`));
        });
        it('hwb #3', function () {
            return parse(`.hwb { color: hwb(195, 0%, 0%); }`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.hwb {
 color: #00bfff
}`));
        });

        it('hwb #4', function () {
            return parse(`.hwb { color: hwb(195, 0%, 0%, 50%); }`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.hwb {
 color: #00bfff80
}`));
        });

        it('hsl #5', function () {
            return parse(`a {
color: hsl(300deg 100% 50% / 1);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #f0f
}`));
        });

        it('device-cmyk #6', function () {
            return parse(`a {
color: device-cmyk(0 81% 81% 30%);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #b32222
}`));
        });

        it('hwb #7', function () {
            return parse(`
a {
color: hwb(3.1416rad 0% 0% / 100%)
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: cyan
}`));
        });

        it('rgb none #8', function () {
            return parse(`
a {
color: rgb(255 255 0 / none);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #ff0
}`));
        });

        it('rgb none #9', function () {
            return parse(`
a {
color: rgb(255 255 none / none);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #ff0
}`));
        });

        it('hsl none #10', function () {
            return parse(`
a {
color: hsl(300deg 100% 50% / none);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #f0f
}`));
        });

        it('hsl none #11', function () {
            return parse(`
a {
color: hsl(none 100% 50% / none);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: red
}`));
        });

        it('relative color hex -> rgb #12', function () {
            return parse(`
a {
color: rgb(from white r g 0 / none);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #ff0
}`));
        });

        it('relative color rgb ->rgb #12', function () {
            return parse(`
a {
color: rgb(from rgb(255 255 none) r g 0 / none);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #ff0
}`));
        });

        it('relative color hex -> rgb #13', function () {
            return parse(`
a {
color: rgb(from #ff0 r g r);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #fff
}`));
        });

        it('relative color hex -> rgb #14', function () {
            return parse(`
a {
color: rgb(from #ff0 r b g);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #f0f
}`));
        });

        it('relative color rgb -> hsl #15', function () {
            return parse(`
a {
color: hsl(from rgb(0 128 0) h s l) ; 
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color rgb -> hsl #16', function () {
            return parse(`
a {
color: hsl(from rgb(0 128 0 / 1) h s l) ; 
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color hsl -> hsl #17', function () {
            return parse(`
a {
color: hsl(from hsl(120deg 100% 25%) h s l) ; 
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color hsl ->rgb #19', function () {
            return parse(`
a {
color: rgb(from hsl(120, 100%, 25%) r g b) ; 
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color hwb ->rgb #20', function () {
            return parse(`
a {
color: rgb(from hwb(120 0% 50%) r g b) 
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color rgb ->hwb #21', function () {
            return parse(`
a {
color: hwb(from rgb(0 128 0) h w b) ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color hwb -> hsl #21', function () {
            return parse(`
a {
color: hwb(from hsl(120, 100%, 25%) h w b) 
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color hsl -> hwb #22', function () {
            return parse(`
a {
color: hsl(from hwb(120 0% 50%) h s l) 
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color hwb -> hwb #22', function () {
            return parse(`
a {
color: hwb(from hwb(120 0% 50%) h w b) 
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: green
}`));
        });

        it('relative color calc() #23', function () {
            return parse(`
a {
color: hsl(from green calc(h * 2) s l)
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: navy
}`));
        });

        it('relative color calc() #24', function () {
            return parse(`
a {
color: hsl(from green calc(h * 2) s l / calc(alpha / 2))
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #00008080
}`));
        });

        it('relative color calc( and var() #25', function () {
            return parse(`
:root {
--color: green;
}
._19_u :focus {
    color:  hsl(from var(--color) calc(h * 2) s l);

}

`, {
                inlineCssVariables: true
            }).then(result => expect(render(result.ast, {minify: false}).code).equals(`._19_u :focus {
 color: navy
}`));
        });

        it('relative color calc( and var() #26', function () {
            return parse(`
:root {
  --color: 255 0 0;
}

.selector {
  background-color: rgb(var(--color) / 0.5);
}

`, {
                inlineCssVariables: true
            }).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 background-color: red
}`));
        });
    });
    //

    it('relative color hex -> rgb #27', function () {
        return parse(`
a {
color: rgb(from rebeccapurple r calc(g * 2) b);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: #669
}`));
    });
    //

    it('color(srgb 0.41587 0.503670 0.36664 / .5) #28', function () {
        return parse(`
.selector {
color: color(sRGB 0.41587 0.503670 0.36664 / calc(1 - 1/2));
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #6a805d80
}`));
    });

    it('color(srgb .5 .5 .5) #29', function () {
        return parse(`
.selector {
color: color(srgb .5 .5 .5);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: grey
}`));
    });

    it('color-mix(in srgb , white , black ) #30', function () {
        return parse(`
.selector {
color: color-mix(in srgb , white , black );
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: grey
}`));
    });

    it('color( srgb-linear  0.21404 0.21404 0.21404 ) #31', function () {
        return parse(`
.selector {
color: color( srgb-linear  0.21404 0.21404 0.21404 )
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #7f7f7f
}`));
    });

    it('color(display-p3 0.5 .5 .5) #32', function () {
        return parse(`
.selector {
color: color(display-p3 0.5 .5 .5);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: grey
}`));
    });

    it('color(prophoto-rgb 0.42467 0.42467 0.42467) #33', function () {
        return parse(`
.selector {
color: color(prophoto-rgb 0.42467 0.42467 0.42467);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #7f7f7f
}`));
    });


    it('color(a98-rgb 0.4961 0.4961 0.4961) #34', function () {
        return parse(`
.selector {
color: color(a98-rgb 0.4961 0.4961 0.4961);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #7f7f7f
}`));
    });

    it('color(rec2020 0.45004 0.45004 0.45004) #35', function () {
        return parse(`
.selector {
color: color(rec2020 0.45004 0.45004 0.45004);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #7f7f7f
}`));
    });

    it('color(xyz-d50 0.43607, 0.22249, 0.01392) #36', function () {
        return parse(`
.selector {
color: color(xyz-d50 0.43607 0.22249 0.01392);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`));
    });

    it('color(xyz-d50 0.58098 0.49223 0.05045) #37', function () {
        return parse(`
.selector {
color: color(xyz-d50 0.58098 0.49223 0.05045);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: orange
}`));
    });

    it('color(xyz 0.20344 0.21404 0.2331) #38', function () {
        return parse(`
.selector {
color: color(xyz 0.20344 0.21404 0.2331);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #807f7f
}`));
    });

    it('color(xyz 0.41239 0.21264 0.01933) #39', function () {
        return parse(`
.selector {
color: color(xyz 0.41239 0.21264 0.01933);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`));
    });

    it('color(xyz 0.54694 0.48173 0.06418) #40', function () {
        return parse(`
.selector {
color: color(xyz 0.54694 0.48173 0.06418);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: orange
}`));
    });

    it('oklab(0.59988 -0 0) #41', function () {
        return parse(`
.selector {
color: oklab(0.59988 -0 0);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: grey
}`));
    });

    it('oklab(0.59988 -0 0) #42', function () {
        return parse(`
.selector {
color: oklab(0.9960 -0.0057 0.0188);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: ivory
}`));
    });

    it('oklch(0.59988 0.00001 145.16718) #43', function () {
        return parse(`
.selector {
color: oklch(0.59988 0.00001 145.16718);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: grey
}`));
    });

    it('oklch(0.62796 0.25768 29.234) #44', function () {
        return parse(`
.selector {
color: oklch(0.62796 0.25768 29.234);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`));
    });

    it('oklch(0.79269 0.17103 70.67) #45', function () {
        return parse(`
.selector {
color: oklch(0.79269 0.17103 70.67);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: orange
}`));
    });

    it('oklch(0.51975 0.17686 142.5) #46', function () {
        return parse(`
.selector {
color: oklch(0.51975 0.17686 142.5);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: green
}`));
    });

    it('lab(54.291, 80.805, 69.891) #47', function () {
        return parse(`
.selector {
color: lab(54.291, 80.805, 69.891);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`));
    });

    it('lab(97.83 -12.04 62.08) #48', function () {
        return parse(`
.selector {
color: lab(97.83 -12.04 62.08);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #fffe7a
}`)); // should be #fffe7a
    });

    it('rgb(from oklch(100% 0.4 30) r g b) #49', function () {
        return parse(`
.selector {
color: rgb(from oklch(100% 0.4 30) r g b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`)); // should be #fffe7a
    });

    it('rgb(from oklab(100% 0.4 0.4) r g b) #50', function () {
        return parse(`
.selector {
color: rgb(from oklab(100% 0.4 0.4) r g b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`)); // should be #fffe7a
    });

    it('rgb(from lab(100 125 125) r g b) #51', function () {
        return parse(`
.selector {
color: rgb(from lab(100 125 125) r g b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff4d00
}`)); // should be #fffe7a
    });

    it('rgb(from lch(50% 130 20) r g b) #52', function () {
        return parse(`
.selector {
color: rgb(from lch(50% 130 20) r g b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`)); // should be #fffe7a
    });

    it('hsl(from oklch(100% 0.4 30) h s l) #53', function () {
        return parse(`
.selector {
color: hsl(from oklch(100% 0.4 30) h s l)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`)); // should be #fffe7a
    });

    it('hsl(from oklab(100% 0.4 0.4) h s l) #54', function () {
        return parse(`
.selector {
color: hsl(from oklab(100% 0.4 0.4) h s l)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`)); // should be #fffe7a
    });

    it('hsl(from lab(100 125 125) h s l) #55', function () {
        return parse(`
.selector {
color: hsl(from lab(100 125 125) h s l)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff4d00
}`));
    });

    it('hsl(from lch(50% 130 20) h s l) #56', function () {
        return parse(`
.selector {
color: hsl(from lch(50% 130 20) h s l)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('hwb(from oklch(100% 0.4 30) h w b) #57', function () {
        return parse(`
.selector {
color: hwb(from oklch(100% 0.4 30) h w b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`)); // should be #fffe7a
    });

    it('hwb(from oklab(100% 0.4 0.4) h w b) #58', function () {
        return parse(`
.selector {
color: hwb(from oklab(100% 0.4 0.4) h w b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`)); // should be #fffe7a
    });

    it('hwb(from lab(100 125 125) h w b) #59', function () {
        return parse(`
.selector {
color: hwb(from lab(100 125 125) h w b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff4d00
}`));
    });

    it('hwb(from lch(50% 130 20) h w b) #60', function () {
        return parse(`
.selector {
color: hwb(from lch(50% 130 20) h w b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lab(from #ff003b l a b) #61', function () {
        return parse(`
.selector {
color: lab(from #ff003b l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lab(from rgb(255 0 59) l a b) #62', function () {
        return parse(`
.selector {
color: lab(from rgb(255 0 59) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lab(from hsl(346.1 100% 50%) l a b) #63', function () {
        return parse(`
.selector {
color: lab(from hsl(346.1 100% 50%) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lab(from lch(50% 130 20) l a b) #64', function () {
        return parse(`
.selector {
color: lab(from lch(50% 130 20) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lab(from hwb(346 0 0) l a b) #65', function () {
        return parse(`
.selector {
color: lab(from hwb(346 0 0) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lab(from oklab(100% 0.4 0.4) l a b) #66', function () {
        return parse(`
.selector {
color: lab(from oklab(100% 0.4 0.4)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`));
    });

    it('lab(from hwb(346 0 0) l a b) #67', function () {
        return parse(`
.selector {
color: lab(from hwb(346 0 0) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lab(from oklch(100% 0.4 30) l a b) #68', function () {
        return parse(`
.selector {
color: lab(from oklch(100% 0.4 30) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`));
    });

    it('lch(from #ff3306 l c h) #69', function () {
        return parse(`
.selector {
color: lch(from #ff3306 l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`));
    });

    it('lch(from rgb(255 0 59) l c h) #70', function () {
        return parse(`
.selector {
color: lch(from rgb(255 0 59) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lch(from hsl(346.1 100% 50%) l c h) #71', function () {
        return parse(`
.selector {
color: lch(from hsl(346.1 100% 50%) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lch(from hwb(346 0 0) l c h) #72', function () {
        return parse(`
.selector {
color: lch(from hwb(346 0 0) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('lch(from lab(100 125 125) l c h) #72', function () {
        return parse(`
.selector {
color: lch(from lab(100 125 125) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff4d00
}`));
    });

    it('lch(from oklab(100% 0.4 0.4) l c h) #73', function () {
        return parse(`
.selector {
color: lch(from oklab(100% 0.4 0.4) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`));
    });

    it('lch(from oklch(100% 0.4 30) l c h) #74', function () {
        return parse(`
.selector {
color: lch(from oklch(100% 0.4 30) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`));
    });


    it('oklab(from #ff3306 l a b) #75', function () {
        return parse(`
.selector {
color: oklab(from #ff3306 l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`));
    });

    it('oklab(from rgb(255 0 59) l a b) #76', function () {
        return parse(`
.selector {
color: oklab(from rgb(255 0 59) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('oklab(from hsl(346.1 100% 50%) l a b) #77', function () {
        return parse(`
.selector {
color: oklab(from hsl(346.1 100% 50%) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('oklab(from hwb(346 0 0) l a b) #78', function () {
        return parse(`
.selector {
color: oklab(from hwb(346 0 0) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('oklab(from lab(100 125 125) l a b) #79', function () {
        return parse(`
.selector {
color: oklab(from lab(100 125 125) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff4d00
}`));
    });

    it('oklab(from lch(50% 130 20) l a b) #80', function () {
        return parse(`
.selector {
color: oklab(from lch(50% 130 20) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('oklab(from oklch(100% 0.4 30) l a b) #81', function () {
        return parse(`
.selector {
color: oklab(from oklch(100% 0.4 30) l a b)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`));
    });


    it('oklch(from #ff3306 l c h) #82', function () {
        return parse(`
.selector {
color: oklch(from #ff3306 l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff3306
}`));
    });

    it('oklch(from rgb(255 0 59) l c h) #83', function () {
        return parse(`
.selector {
color: oklch(from rgb(255 0 59) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('oklch(from hsl(346.1 100% 50%) l c h) #84', function () {
        return parse(`
.selector {
color: oklch(from hsl(346.1 100% 50%) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('oklch(from hwb(346 0 0) l c h) #85', function () {
        return parse(`
.selector {
color: oklch(from hwb(346 0 0) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('oklch(from lab(100 125 125) l c h) #79', function () {
        return parse(`
.selector {
color: oklch(from lab(100 125 125) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff4d00
}`));
    });

    it('oklch(from lch(50% 130 20) l c h) #80', function () {
        return parse(`
.selector {
color: oklch(from lch(50% 130 20) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: #ff003b
}`));
    });

    it('oklch(from oklab(100% 0.4 0.4) l c h) #81', function () {
        return parse(`
.selector {
color: oklch(from oklab(100% 0.4 0.4) l c h)  ;
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.selector {
 color: red
}`));
    });

    //
}