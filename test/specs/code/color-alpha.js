import { ColorType, EnumToken } from "../../../dist/lib/ast/types.js";
import { isOkLabClose } from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, it, transform, parse, render) {
    describe("alpha() color", function () {
        it("hex #1", function () {
            return transform(
                `
:root {
--marker:  teal;
--palemarker:  alpha(from var(--marker) / 0.7);

}

body {

/* rgba(0, 128, 128, 0.7) */
color: var(--palemarker);
}`,
                {
                    beautify: true,
                    inlineCssVariables: true,
                },
            ).then((result) =>
                expect(result.code).equals(`body {
 color: #008080b3
}`),
            );
        });

        it("hex #2", function () {
            return transform(
                `
:root {
--marker:  #008080b3;
--palemarker:  alpha(from var(--marker) );

}

body {

/* teal */
color: var(--palemarker);
}
`,
                {
                    beautify: true,
                    inlineCssVariables: true,
                },
            ).then((result) =>
                expect(result.code).equals(`body {
 color: #008080b3
}`),
            );
        });

        it("hex #3", function () {
            return transform(
                `
:root {
--marker:  #008080b3;
--palemarker:  alpha(from var(--marker) / none);

}

body {

/* teal */
color: var(--palemarker);
}
`,
                {
                    beautify: true,
                    inlineCssVariables: true,
                },
            ).then((result) =>
                expect(result.code).equals(`body {
 color: #00808000
}`),
            );
        });

        it("oklch() #4", function () {
            return transform(
                `
:root {
--mycolor:  oklch(60% 0.25 315 / 0.3);
}

body {

/* teal */
color: alpha(from var(--mycolor) / 80%);
}
`,
                {
                    beautify: true,
                    inlineCssVariables: true,
                },
            ).then((result) =>
                expect(result.code).equals(`body {
 color: #b538e3cc
}`),
            );
        });

        it("color-mix() #4", function () {
            return transform(
                `
:root {
--mycolor:  oklch(60% 0.25 315 / 0.3);
}

body {

background-color: color-mix(in oklab,white,black);
/* teal */
color: alpha(from color-mix(in oklab,white,black) / 80%);
}
`,
                {
                    beautify: true,
                    inlineCssVariables: true,
                },
            ).then((result) =>
                expect(result.code).equals(`body {
 background-color: #636363;
 color: #636363cc
}`),
            );
        });

        it("color-mix() #5", function () {
            return transform(
                `
:root {
--mycolor:  oklch(60% 0.25 315 / 0.3);
}

body {

background-color: OkLcH(from color-mix(in oklab,white 80%,black 80%) l c h / 20%);
/* teal */
color: alpha(from OkLcH(from color-mix(in oklab,white 80%,black 80%)  l    c  h)/20%); 
}
`,
                {
                    beautify: true,
                    inlineCssVariables: true,
                },
            ).then((result) =>
                expect(result.code).equals(`body {
 background-color: #63636333;
 color: #63636333
}`),
            );
        });

        it("color-mix() #6", function () {
            return transform(
                `
:root {
--mycolor:  oklch(60% 0.25 315 / 0.3);
}

body {

background-color: OkLcH(from OkLcH(from peru  l    c  h) l c calc(h / 2) / 20%);
/* teal */
color: alpha(from OkLcH(from OkLcH(from peru  l    c  h) l c calc(h / 2) / 20%)/20%); 
}
`,
                {
                    beautify: true,
                    inlineCssVariables: true,
                },
            ).then((result) =>
                expect(result.code).equals(`body {
 background-color: #d9796833;
 color: #d9796833
}`),
            );
        });

        it("color-mix() #7", function () {
            return transform(
                `
:root {
--mycolor:  oklch(60% 0.25 315 / 0.8);
}
    .s {
    
    color:
 alpha(from var(--mycolor)  / calc(alpha * 0.5));

`,
                {
                    beautify: true,
                    inlineCssVariables: true,
                },
            ).then((result) =>
                expect(result.code).equals(`.s {
 color: #b538e366
}`),
            );
        });
    });
}
