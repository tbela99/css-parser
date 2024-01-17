
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
}