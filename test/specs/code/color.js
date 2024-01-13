
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

        it('rgb none #11', function () {
            return parse(`
a {
color: hsl(none 100% 50% / none);
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 color: red
}`));
        });

    });
    //
}