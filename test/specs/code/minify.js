export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, transformSync, parseSync) {
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

    describe("minify passes", function () {
        it("single pass #1", function () {
            return transform(css, {
                beautify: true,
                inlineCssVariables: true,
                pass: 1,
            }).then((result) =>
                expect(result.code).equals(`._19_u :focus {
 color: navy
}
.foo-bar {
 width: 12px;
 height: 25%
}
.foo {
 width: 12px;
 height: 25%
}`),
            );
        });

        it("multiple passes #2", function () {
            return transform(css, {
                beautify: true,
                inlineCssVariables: true,
                pass: 2,
            }).then((result) =>
                expect(result.code).equals(`._19_u :focus {
 color: navy
}
.foo-bar,.foo {
 width: 12px;
 height: 25%
}`),
            );
        });

        it("-webkit-linear-gradient() angle #3", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( 30deg, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(60deg,red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() left #4", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( left, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(90deg,red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() right #5", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( right, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(270deg,red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() top #6", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( top, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() top right #7", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( top right, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to bottom left,red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() top left #8", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( top left, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to bottom right,red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() bottom #9", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( bottom, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(0,red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() bottom right #10", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( bottom right, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to top left,red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() bottom left #11", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( bottom left, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to top right,red,blue)
}`),
            );
        });

        it("-webkit-linear-gradient() bottom left #11", function () {
            return transform(
                `
  .xl\:origin-bottom-left {
    background-image:-webkit-linear-gradient( bottom left, red, blue);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl:origin-bottom-left {
 background-image: linear-gradient(to top right,red,blue)
}`),
            );
        });

        it("-o-linear-gradient() #12", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left2 {
 background: -o-linear-gradient(-90deg,#fff,#000);
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left2 {
 background: linear-gradient(#fff,#000)
}`),
            );
        });

        it(" -webkit-radial-gradient() #13", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: -webkit-radial-gradient(center, circle closest-side , red 0%, blue 100%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(circle closest-side,red,blue)
}`),
            );
        });

        it(" radial-gradient() #14", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(circle at center in hsl longer hue, red 0, blue, green 100%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(circle in hsl longer hue,red,blue,green)
}`),
            );
        });

        it(" radial-gradient() #15", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(circle at 50% 0, rgb(255 0 0 / 50%), transparent 70.71%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(circle at top,#ff000080,#0000 70.71%)
}`),
            );
        });

        it(" radial-gradient() #16", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(ellipse at 50% 0, rgb(255 0 0 / 50%), transparent 70.71%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(at top,#ff000080,#0000 70.71%)
}`),
            );
        });

        it(" radial-gradient() #17", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(ellipse at 50% 50%, rgb(255 0 0 / 50%), transparent 70.71%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(#ff000080,#0000 70.71%)
}`),
            );
        });

        it(" radial-gradient() #17", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: radial-gradient(closest-side ellipse at 50% 50%, rgb(255 0 0 / 50%), transparent 70.71%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: radial-gradient(closest-side,#ff000080,#0000 70.71%)
}`),
            );
        });

        it(" linear-gradient() #18", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: linear-gradient(45deg, red 0%, blue 100%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(45deg,red,blue)
}`),
            );
        });

        it(" linear-gradient() #18", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: linear-gradient(45deg, red 0%, blue 50% 100%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(45deg,red,blue 50% 100%)
}`),
            );
        });

        it(" linear-gradient() #19", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: linear-gradient(45deg, red 0%, blue 50%, blue 100%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(45deg,red,blue 50% 100%)
}`),
            );
        });

        it(" linear-gradient() #20", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: linear-gradient(red 0%, orange 25%, yellow 50%, green 75%, blue 100%);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(red,orange,#ff0,green,blue)
}`),
            );
        });

        it(" conic-gradient() #21", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: conic-gradient(from 0deg at 50% 50%, red 0deg, orange 90deg, yellow 180deg, green 270deg, blue 360deg);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(red,orange,#ff0,green,blue)
}`),
            );
        });

        it(" -webkit-gradient(linear) #22", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: -webkit-gradient( linear, left top, right bottom, from(#ff0), color-stop(0.5, orange), to(rgb(255, 0, 0) ));
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: linear-gradient(to bottom right,#ff0,orange,red)
}`),
            );
        });

        it(" conic-gradient() #23", function () {
            return transform(
                `
  
  .xl\\:origin-bottom-left {
    background: conic-gradient(from 0deg at 50% 50%, red 0deg, red 90deg, yellow 180deg, green 270deg, blue 360deg);
}
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(red 0 90deg,#ff0,green,blue)
}`),
            );
        });

        it(" conic-gradient() #24", function () {
            return transform(
                `
  
 .xl\\:origin-bottom-left {
background: conic-gradient(in hsl longer hue, red 0deg, red 90deg, yellow 180deg, green 270deg, blue 360deg);
}

`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(in hsl longer hue,red 0 90deg,#ff0,green,blue)
}`),
            );
        });

        it(" conic-gradient() #25", function () {
            return transform(
                `
  
 .xl\\:origin-bottom-left {
background: conic-gradient(red 40grad, 80grad, blue 360grad);

`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(red 36deg,72deg,blue 324deg)
}`),
            );
        });

        it(" conic-gradient() #25", function () {
            return transform(
                `
  
 .xl\\:origin-bottom-left {
background: conic-gradient(red 40grad, 80grad, blue 360grad, black 400grad, black 450grad);

`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(red 36deg,72deg,blue 324deg,#000 1turn 405deg)
}`),
            );
        });

        it(" conic-gradient() #26", function () {
            return transform(
                `
  
 .xl\\:origin-bottom-left {
background:  conic-gradient(white 90deg, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);

`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`.xl\\:origin-bottom-left {
 background: conic-gradient(#fff 90deg,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #27", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at left center, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at 0,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #28", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at top center, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at top,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #29", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at bottom center, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at bottom,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #30", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at right center, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at 100%,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #31", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at bottom left, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at 0 100%,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #32", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at bottom right, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at 100% 100%,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #33", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at top left, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at 0 0,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #34", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at top right, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at 100% 0,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #35", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at 50%, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #36", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at 0 50%, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at 0,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });

        it(" conic-gradient() #37", function () {
            return transform(
                `
  
  a:hover {
    background: conic-gradient(from 0.25turn at 50% 0, black 0.25turn 0.5turn, white calc(2*pi * 1rad) calc(pi * 1.5rad), black 300grad);;
  }
`,
                {
                    beautify: true,
                    removePrefix: true,
                    pass: 2,
                },
            ).then((result) =>
                expect(result.code).equals(`a:hover {
 background: conic-gradient(from 90deg at top,#000 90deg .5turn,#fff 1turn 270deg,#000 270deg)
}`),
            );
        });
    });

    describe("minify prelude tokens", function () {
        it("at-rule prelude tokens #1", function () {
            // the prelude tokens are not parsed from the at-rule name
            return parse(
                `@font-face { font-family: x; src: url(a.woff) } @media screen { .a { color: red } } @media screen { .b { color: red } }`,
            ).then((result) => {
                const arena = result.arena;
                const preludes = [];

                for (let node = arena.firstChild[result.ast]; node != 0; node = arena.nextSibling[node]) {
                    preludes.push([
                        arena.resolveString(arena.name[node]),
                        arena.tokens(node).map((token) => arena.resolveString(arena.stringValue[token])),
                    ]);
                }

                expect(preludes).deep.equals([
                    ["font-face", []],
                    ["media", ["screen"]],
                ]);
            });
        });
    });

    describe("minify rule merge size", function () {
        it("a merge that repeats the selector of a rule is not kept #1", function () {
            // the declarations of html are shared with the next rule: the merge would repeat the selector of the next
            // rule (html,body,...{margin:0;padding:0;border:0}body,...{font:inherit;vertical-align:baseline})
            const css = `html{margin:0;padding:0;border:0}body,div,span,object,iframe,h1,h2,h3,h4,h5,h6,p{margin:0;padding:0;border:0;font-size:100%;font:inherit;vertical-align:baseline}`;

            expect(transformSync(css).code).equals(
                "html{margin:0;padding:0;border:0}body,div,span,object,iframe,h1,h2,h3,h4,h5,h6,p{margin:0;padding:0;border:0;font:inherit;vertical-align:baseline}",
            );
        });

        it("the minified css is not larger than the fast mode output #2", function () {
            return readFile(
                (import.meta.dirname ?? dirname(new URL(import.meta.url).pathname)) + "/../../files/css/blueprint.css",
                "utf-8",
            ).then((css) => {
                // the fast mode of the readme: minify: false
                const fast = transformSync({
                    input: css,
                    minify: false,
                    beautify: false,
                    removeEmpty: true,
                    removeComments: true,
                    convertColor: true,
                    minifyValues: true,
                });
                const minified = transformSync(css);

                expect(minified.code.length).to.be.at.most(fast.code.length);
            });
        });
    });

    describe("minify shorthand without keywords", function () {
        it("text-emphasis #1", function () {
            // text-emphasis-color has no keyword: the minifier threw `Cannot read properties of undefined`
            expect(transformSync(".a{text-emphasis:none}").code).equals(".a{text-emphasis:none}");
            expect(transformSync(".a{text-emphasis-style:dot;text-emphasis-color:red}").code).equals(
                ".a{text-emphasis:dot red}",
            );
            expect(transformSync(".a{text-emphasis-color:red;text-emphasis-style:none}").code).equals(
                ".a{text-emphasis:red}",
            );
        });
    });
}
