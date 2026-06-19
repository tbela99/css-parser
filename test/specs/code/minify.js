export function run(describe, expect, it, transform, parse, render, dirname, readFile) {

    const css = `
:root {
--color: green;
}
._19_u :focus {
    color:  hsl(from var(--color) calc(h * 2) s l);
}
:root {
--preferred-width: 20px;
}
.foo-bar {
    width: calc(calc(var(--preferred-width) + 1px) / 3 + 5px);
    height: calc(100% / 4);}


.foo {
 width: 12px;
 height: 25%
}


`;

    describe('minify passes', function () {
        it('single pass #1', function () {
            return transform(css, {
                beautify: true,
                inlineCssVariables: true,
                pass: 1
            }).then((result) => expect(result.code).equals(`._19_u :focus {
 color: navy
}
.foo-bar {
 width: 12px;
 height: 25%
}
.foo {
 width: 12px;
 height: 25%
}`));
        });

        it('multiple passes #2', function () {

            return transform(css, {
                beautify: true,
                inlineCssVariables: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`._19_u :focus {
 color: navy
}
.foo-bar,.foo {
 width: 12px;
 height: 25%
}`));
        });

        it('-webkit-linear-gradient() angle #3', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( 30deg, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(60deg,red,blue)
}`));
        });

        it('-webkit-linear-gradient() left #4', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( left, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(90deg,red,blue)
}`));
        });

        it('-webkit-linear-gradient() right #5', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( right, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(270deg,red,blue)
}`));
        });

        it('-webkit-linear-gradient() top #6', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( top, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(.5turn,red,blue)
}`));
        });

        it('-webkit-linear-gradient() top right #7', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( top right, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to bottom left,red,blue)
}`));
        });

        it('-webkit-linear-gradient() top left #8', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( top left, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to bottom right,red,blue)
}`));
        });

        it('-webkit-linear-gradient() bottom #9', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( bottom, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(0,red,blue)
}`));
        });

        it('-webkit-linear-gradient() bottom right #10', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( bottom right, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to top left,red,blue)
}`));
        });

        it('-webkit-linear-gradient() bottom left #11', function () {

            return transform(`
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( bottom left, red, blue);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to top right,red,blue)
}`));
        });
    });

}