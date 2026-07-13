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
 background-image: linear-gradient(red,blue)
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

        it('-o-linear-gradient() #12', function () {

            return transform(`
  
  .xl\\:origin-bottom-left2 {
 background: -o-linear-gradient(-90deg,#fff,#000);
  }
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left2 {
 background: linear-gradient(#fff,#000)
}`));
        });

        it(' -webkit-radial-gradient() #13', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: -webkit-radial-gradient(center, circle closest-side , red 0%, blue 100%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(circle closest-side,red,blue)
}`));
        });

        it(' radial-gradient() #14', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(circle at center in hsl longer hue, red 0, blue, green 100%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(circle in hsl longer hue,red,blue,green)
}`));
        });

        it(' radial-gradient() #15', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(circle at 50% 0, rgb(255 0 0 / 50%), transparent 70.71%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(circle at top,#ff000080,#0000 70.71%)
}`));
        });

        it(' radial-gradient() #16', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(ellipse at 50% 0, rgb(255 0 0 / 50%), transparent 70.71%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(at top,#ff000080,#0000 70.71%)
}`));
        });

        it(' radial-gradient() #17', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(ellipse at 50% 50%, rgb(255 0 0 / 50%), transparent 70.71%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(#ff000080,#0000 70.71%)
}`));
        });

        it(' radial-gradient() #17', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(closest-side ellipse at 50% 50%, rgb(255 0 0 / 50%), transparent 70.71%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(closest-side,#ff000080,#0000 70.71%)
}`));
        });

        it(' linear-gradient() #18', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: linear-gradient(45deg, red 0%, blue 100%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(45deg,red,blue)
}`));
        });

        it(' linear-gradient() #18', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: linear-gradient(45deg, red 0%, blue 50% 100%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(45deg,red,blue 50% 100%)
}`));
        });

        it(' linear-gradient() #19', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: linear-gradient(45deg, red 0%, blue 50%, blue 100%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(45deg,red,blue 50% 100%)
}`));
        });

        it(' linear-gradient() #20', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: linear-gradient(red 0%, orange 25%, yellow 50%, green 75%, blue 100%);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(red,orange,#ff0,green,blue)
}`));
        });

        it(' conic-gradient() #21', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: conic-gradient(from 0deg at 50% 50%, red 0deg, orange 90deg, yellow 180deg, green 270deg, blue 360deg);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(red,orange,#ff0,green,blue)
}`));
        });

        it(' -webkit-gradient(linear) #22', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: -webkit-gradient( linear, left top, right bottom, from(#ff0), color-stop(0.5, orange), to(rgb(255, 0, 0) ));
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(to bottom right,#ff0,orange,red)
}`));
        });

        it(' conic-gradient() #23', function () {

            return transform(`
  
  .xl\\:origin-bottom-left {
    background: conic-gradient(from 0deg at 50% 50%, red 0deg, red 90deg, yellow 180deg, green 270deg, blue 360deg);
}
`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(red 0 90deg,#ff0,green,blue)
}`));
        });

        it(' conic-gradient() #24', function () {

            return transform(`
  
 .xl\\:origin-bottom-left {
background: conic-gradient(in hsl longer hue, red 0deg, red 90deg, yellow 180deg, green 270deg, blue 360deg);
}

`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(in hsl longer hue,red 0 90deg,#ff0,green,blue)
}`));
        });

        it(' conic-gradient() #25', function () {

            return transform(`
  
 .xl\\:origin-bottom-left {
background: conic-gradient(red 40grad, 80grad, blue 360grad);

`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(red 36deg,72deg,blue 324deg)
}`));
        });

        it(' conic-gradient() #25', function () {

            return transform(`
  
 .xl\\:origin-bottom-left {
background: conic-gradient(red 40grad, 80grad, blue 360grad, black 400grad, black 450grad);

`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(red 36deg,72deg,blue 324deg,#000 1turn 405deg)
}`));
        });

        it(' conic-gradient() #26', function () {

            return transform(`
  
 .xl\\:origin-bottom-left {
background:  conic-gradient(white 90deg, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);

`, {
                beautify: true,
                removePrefix: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(#fff 90deg,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`));
        });
    });

}