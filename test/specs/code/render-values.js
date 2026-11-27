export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, transformSync) {
    describe("media query modifiers", function () {
        it("not and only #1", function () {
            expect(transformSync("@media not print{.a{color:red}}").code).equals("@media not print{.a{color:red}}");
            expect(transformSync("@media not screen and (color){.a{color:red}}").code).equals("@media not screen and (color){.a{color:red}}");
            expect(transformSync("@media only screen and (min-resolution: 2dppx){.a{color:red}}").code).equals(
                "@media only screen and (resolution>=2x){.a{color:red}}",
            );
            expect(transformSync("@media not (color){.a{color:red}}").code).equals("@media not (color){.a{color:red}}");
            expect(transformSync("@media screen, not print{.a{color:red}}").code).equals("@media screen,not print{.a{color:red}}");
        });

        it("invalid modifiers #2", function () {
            for (const css of ["@media only (color){.a{color:red}}", "@media only{.a{color:red}}", "@media foo{.a{color:red}}"]) {
                const result = transformSync(css);

                expect(result.code, css).equals("");
                expect(result.errors.map((error) => error.message), css).deep.equals(["expecting '<media-type>'"]);
            }
        });
    });

    describe("gradient positions", function () {
        const gradient = (position) => transformSync(`.a{background:radial-gradient(circle at ${position}, red, blue)}`).code;

        it("a position keeps its meaning #1", function () {
            expect(gradient("left top")).equals(".a{background:radial-gradient(circle at 0 0,red,blue)}");
            expect(gradient("0% 0%")).equals(".a{background:radial-gradient(circle at 0 0,red,blue)}");
            expect(gradient("left bottom")).equals(".a{background:radial-gradient(circle at 0 100%,red,blue)}");
            expect(gradient("right bottom")).equals(".a{background:radial-gradient(circle at 100% 100%,red,blue)}");
            expect(gradient("top right")).equals(".a{background:radial-gradient(circle at 100% 0,red,blue)}");
            expect(gradient("20% 20%")).equals(".a{background:radial-gradient(circle at 20% 20%,red,blue)}");
        });

        it("positions with a shorter form #2", function () {
            expect(gradient("center")).equals(".a{background:radial-gradient(circle,red,blue)}");
            expect(gradient("50% 0%")).equals(".a{background:radial-gradient(circle at top,red,blue)}");
            expect(gradient("left center")).equals(".a{background:radial-gradient(circle at left,red,blue)}");
            expect(gradient("right center")).equals(".a{background:radial-gradient(circle at right,red,blue)}");
            expect(gradient("center bottom")).equals(".a{background:radial-gradient(circle at bottom,red,blue)}");
        });

        it("linear gradient directions #3", function () {
            expect(transformSync(".a{background:linear-gradient(to top, red, blue)}").code).equals(".a{background:linear-gradient(0,red,blue)}");
            expect(transformSync(".a{background:linear-gradient(to bottom, red, blue)}").code).equals(".a{background:linear-gradient(red,blue)}");
        });
    });

    describe("rendered values", function () {
        it("comments #1", function () {
            const css = "/*! license */ /* drop */ .a{color:red}";

            expect(transformSync(css).code).equals(".a{color:red}");
            expect(transformSync(css, { removeComments: true, preserveLicense: true }).code).equals("/*! license */.a{color:red}");
            expect(transformSync(css, { removeComments: false }).code).equals("/*! license *//* drop */.a{color:red}");
            expect(transformSync(css, { minify: false, beautify: true, removeComments: true, preserveLicense: true }).code).equals(
                "/*! license */\n.a {\n color: red\n}",
            );
        });

        it("infinity #2", function () {
            expect(transformSync(".a{width:calc(-infinity * 1px)}").code).equals(".a{width:calc(-1/0*1px)}");
            expect(transformSync(".a{width:calc(-infinity * 1px)}", { minify: false, beautify: true }).code).equals(".a {\n width: calc(-infinity*1px)\n}");
        });

        it("frequency and resolution #3", function () {
            expect(transformSync(".a{voice-pitch:200Hz}").code).equals(".a{voice-pitch:200Hz}");
            expect(transformSync("@media (resolution: 96dpi){.a{color:red}}").code).equals("@media (resolution:96dpi){.a{color:red}}");
        });
    });
}
