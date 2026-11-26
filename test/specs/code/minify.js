import { MergeRulesEnum } from "../../../dist/ast/types.js";

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
    describe("universal selector", function () {
        it("universal selector followed by a combinator #1", function () {
            // the universal selector was removed before a combinator: `.foo *+.x` became `.foo +.x`
            expect(transformSync(".foo{color:blue}.foo *{color:red}.foo *+.x{color:blue}").code).equals(
                ".foo{color:blue;*{color:red;+.x{color:blue}}}",
            );
        });

        it("universal selector followed by a descendant combinator #2", function () {
            expect(
                transformSync(
                    ".a * .b{color:red}.c *>.d{color:blue}* span{color:green}* .dark{color:#000}*.x{top:0}.y *:hover{top:1px}",
                ).code,
            ).equals(".a * .b{color:red}.c *>.d{color:blue}span{color:green}* .dark{color:#000}.x{top:0}.y :hover{top:1px}");
        });

        it("universal selector with a namespace #3", function () {
            expect(transformSync("*|*{color:red}ns|*.x{color:blue}").code).equals("*|*{color:red}ns|*.x{color:blue}");
        });
    });

    describe("factor selectors", function () {
        it("descendant selectors are not compound selectors #1", function () {
            // `.foo .b,.foo .c` was factored into `.foo:is(.b,.c)`
            expect(
                transformSync(".foo{color:blue}.foo .b{color:blue}.foo .c{color:blue}", { nestingRules: false }).code,
            ).equals(".foo,.foo .b,.foo .c{color:blue}");
        });

        it("descendant selectors are not compound selectors #2", function () {
            expect(
                transformSync(
                    ".foo .very-long-a,.foo .very-long-b,.foo .very-long-c{color:blue}.bar.very-long-a,.bar.very-long-b{color:red}",
                    { nestingRules: false },
                ).code,
            ).equals(
                ".foo :is(.very-long-a,.very-long-b,.very-long-c){color:blue}.bar.very-long-a,.bar.very-long-b{color:red}",
            );
        });
    });

    describe("@property rule", function () {
        it("the unit of the initial value is kept #1", function () {
            // `0` is not a valid <angle> or <percentage>: the @property rule was invalid
            expect(
                transformSync(
                    '@property --a{syntax:"<angle>";inherits:false;initial-value:0deg}@property --b{syntax:"<percentage>";inherits:false;initial-value:0%}',
                ).code,
            ).equals(
                '@property --a{syntax:"<angle>";inherits:false;initial-value:0deg}@property --b{syntax:"<percentage>";inherits:false;initial-value:0%}',
            );
        });
    });

    describe("@apply rule", function () {
        it("the declarations are not moved across @apply #1", function () {
            expect(
                transformSync(
                    ".c{margin-top:0;@apply --m(red,blue);width:1px;margin-right:0;margin-bottom:0;margin-left:0}.d{@apply --m;width:1px}",
                ).code,
            ).equals(
                ".c{margin-top:0;@apply --m(red,blue);width:1px;margin-right:0;margin-bottom:0;margin-left:0}.d{@apply --m;width:1px}",
            );
        });

        it("the declarations are not moved across @apply with a contents block #2", function () {
            expect(transformSync(".q{top:0;@apply --y{color:blue}left:0}.r{@apply --z{}}").code).equals(
                ".q{top:0;@apply --y{color:blue}left:0}.r{@apply --z{}}",
            );
        });
    });

    describe("mergeRules and optimizeSelectors", function () {
        const options = { nestingRules: false, computeShorthand: false, computeTransform: false, computeCalcExpression: false };

        it("mergeRules: MergeRulesEnum.Identical merges the rules that have the same declarations #1", function () {
            expect(
                transformSync(".a{color:red;width:1px}.b{width:1px;color:red}", { ...options, mergeRules: MergeRulesEnum.Identical }).code,
            ).equals(".a,.b{color:red;width:1px}");
        });

        it("mergeRules: MergeRulesEnum.Identical merges the rules that have the same declarations #2", function () {
            expect(
                transformSync(".a{color:red}.b{color:red}.c{color:red}", { ...options, mergeRules: MergeRulesEnum.Identical }).code,
            ).equals(".a,.b,.c{color:red}");
        });

        it("mergeRules: MergeRulesEnum.Identical does not merge the rules that share some declarations", function () {
            expect(
                transformSync(".a{color:red;width:1px}.b{color:red}", { ...options, mergeRules: MergeRulesEnum.Identical }).code,
            ).equals(".a{color:red;width:1px}.b{color:red}");
        });

        it("mergeRules: true merges the rules that share some declarations", function () {
            expect(transformSync(".a{color:red;width:1px}.b{color:red}", options).code).equals(
                ".b,.a{color:red}.a{width:1px}",
            );
        });

        it("mergeRules: true is the default", function () {
            const css = ".a{color:red;width:1px}.b{color:red}";

            expect(transformSync(css, { ...options, mergeRules: true }).code).equals(transformSync(css, options).code);
        });

        it("mergeRules: false does not merge the rules", function () {
            expect(transformSync(".a{color:red}.b{color:red}", { ...options, mergeRules: false }).code).equals(
                ".a{color:red}.b{color:red}",
            );
        });

        it("mergeRules: MergeRulesEnum.Identical does not merge the selectors that have different vendor prefixes", function () {
            expect(
                transformSync("::-webkit-input-placeholder{color:red}::-moz-placeholder{color:red}", {
                    ...options,
                    mergeRules: MergeRulesEnum.Identical,
                }).code,
            ).equals("::-webkit-input-placeholder{color:red}::-moz-placeholder{color:red}");
        });

        it("optimizeSelectors: false does not factor the selectors", function () {
            const css = ".foo .very-long-a,.foo .very-long-b,.foo .very-long-c{color:blue}";

            expect(transformSync(css, { nestingRules: false }).code).equals(
                ".foo :is(.very-long-a,.very-long-b,.very-long-c){color:blue}",
            );
            expect(transformSync(css, { nestingRules: false, optimizeSelectors: false }).code).equals(css);
        });

        it("optimizeSelectors: false only applies without nesting", function () {
            const css = ".foo .very-long-a,.foo .very-long-b,.foo .very-long-c{color:blue}.foo .x{color:red}";

            expect(transformSync(css, { optimizeSelectors: false }).code).equals(transformSync(css).code);
        });
    });

    describe("fastMode", function () {
        const css =
            ".a{color:red;width:1px}.b{width:1px;color:red}.c{margin:0px 0px 0px 0px;color:blue}.c .d{color:green}.e{color:red;width:1px;height:2px}";

        it("fastMode does not minify the ast and does not merge the rules", function () {
            expect(transformSync(css, { fastMode: true }).code).equals(
                transformSync(css, { minify: false, beautify: false, mergeRules: MergeRulesEnum.None }).code,
            );
            expect(transformSync(css, { fastMode: true }).code).equals(
                ".a{color:red;width:1px}.b{width:1px;color:red}.c{margin:0 0 0 0;color:blue}.c .d{color:green}.e{color:red;width:1px;height:2px}",
            );
        });

        it("an option given explicitly takes precedence over fastMode", function () {
            // the ast is minified, the rules are not merged (mergeRules of fastMode)
            expect(transformSync(css, { fastMode: true, minify: true }).code).equals(
                ".a{color:red;width:1px}.b{width:1px;color:red}.c{margin:0 0 0 0;color:blue;.d{color:green}}.e{color:red;width:1px;height:2px}",
            );
            expect(transformSync(css, { fastMode: true, minify: true, mergeRules: MergeRulesEnum.All }).code).equals(
                ".a,.b{color:red;width:1px}.c{margin:0 0 0 0;color:blue;.d{color:green}}.e{color:red;width:1px;height:2px}",
            );
        });

        it("fastMode: false does not change the default settings", function () {
            expect(transformSync(css, { fastMode: false }).code).equals(transformSync(css).code);
        });
    });

    describe("mergeRules without minify", function () {
        const options = { minify: false, beautify: false };

        it("the rules are not merged without mergeRules", function () {
            expect(transformSync(".a{color:red;width:1px}.b{color:red}.a{margin:0}", options).code).equals(
                ".a{color:red;width:1px}.b{color:red}.a{margin:0}",
            );
        });

        it("MergeRulesEnum.All merges the rules that share declarations", function () {
            expect(
                transformSync(".a{color:red;width:1px}.b{color:red}.a{margin:0}", {
                    ...options,
                    mergeRules: MergeRulesEnum.All,
                }).code,
            ).equals(".b,.a{color:red}.a{width:1px;margin:0}");
        });

        it("the at-rules are merged, the last @keyframes is kept, @font-face is not merged", function () {
            expect(
                transformSync(
                    "@keyframes spin{from{color:red}to{color:blue}}@keyframes spin{from{opacity:0}to{opacity:1}}@font-face{font-family:a;src:url(a.woff)}@font-face{font-family:a;src:url(b.woff)}@media print{.x{color:red}}@media print{.y{color:red}}@keyframes k{50%{color:red}50%{opacity:1}}",
                    { ...options, mergeRules: MergeRulesEnum.Identical },
                ).code,
            ).equals(
                "@keyframes spin{from{opacity:0}to{opacity:1}}@font-face{font-family:a;src:url(a.woff)}@font-face{font-family:a;src:url(b.woff)}@media print{.x,.y{color:red}}@keyframes k{50%{color:red;opacity:1}}",
            );
        });
    });
}
