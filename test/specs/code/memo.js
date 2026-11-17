import { doRender, RenderMemo } from "../../../dist/lib/printer/render.js";
import { getParsedSyntax } from "../../../dist/lib/validation/config.js";
import { toPrecision6 } from "../../../dist/lib/ast/transform/utils.js";

export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, transformSync, parseSync) {
    describe("render memo", function () {
        it("identical declarations are rendered once #1", function () {
            const css = `.s {


width: 10px;
}


.b { height: 20px }
.g { width: 10px; }`;
            // minify: false, the rules are not merged
            const result = parseSync(css, { minify: false });
            const memo = new RenderMemo();
            const rendered = doRender(result.arena, result.ast, {}, null, memo);

            expect(rendered.code).equals(".s{width:10px}.b{height:20px}.g{width:10px}");
            // width:10px and height:20px, the second width:10px is found in the memo
            expect(memo.declarations.size).equals(2);
            expect(memo.declarations.hits).equals(1);
        });

        it("identical constructs are rendered once #2", function () {
            const css = `.a { background: linear-gradient(to right, rgb(255 0 0), blue) }
.b { background-image: linear-gradient(to right, rgb(255 0 0), blue) }
.c { border: 1px solid rgb(255 0 0) }`;
            const result = parseSync(css, { minify: false });
            const memo = new RenderMemo();
            const rendered = doRender(result.arena, result.ast, {}, null, memo);

            expect(rendered.code).equals(
                ".a{background:linear-gradient(90deg,red,blue)}.b{background-image:linear-gradient(90deg,red,blue)}.c{border:1px solid red}",
            );
            // the gradient of .b and the color of .c are found in the memo
            expect(memo.constructs.hits).equals(2);
        });

        it("the memo is not shared with other options #3", function () {
            const css = `.a { color: rgb(255 0 0) } .b { color: rgb(255 0 0) }`;
            const result = parseSync(css, { minify: false });

            expect(render(result.arena, result.ast, { convertColor: false }).code).equals(
                ".a{color:rgb(255 0 0)}.b{color:rgb(255 0 0)}",
            );
            expect(render(result.arena, result.ast).code).equals(".a{color:red}.b{color:red}");
        });
    });

    describe("validation cache", function () {
        it("identical invalid declarations report their own location #1", function () {
            const result = transformSync({
                input: `.a {\n  color: 10px;\n}\n.b {\n  color: 10px;\n}\n`,
                src: "v.css",
                validation: true,
            });

            // the second validation is found in the cache, its error is rebuilt with the tokens of the declaration
            expect(result.errors.map((error) => [error.action, error.message, error.location])).deep.equals([
                ["drop", "could not match syntax", ["v.css", 2, 10]],
                ["drop", "could not match syntax", ["v.css", 5, 10]],
            ]);
        });

        it("the content of the strings is not part of the key #2", function () {
            const result = transformSync({
                input: `.a {\n  content: "a" 10px;\n}\n.b {\n  content: "b c" 10px;\n}\n.c {\n  content: "x";\n}\n.d {\n  content: "y";\n}\n`,
                src: "v.css",
                validation: true,
            });

            // the declarations of .b and .d are found in the cache: the errors are rebuilt with their own tokens
            expect(result.code).equals('.a{content:"a" 10px}.b{content:"b c" 10px}.c{content:"x"}.d{content:"y"}');
            expect(result.errors.map((error) => [error.action, error.message, error.location])).deep.equals([
                ["drop", "unexpected token", ["v.css", 2, 16]],
                ["drop", "unexpected token", ["v.css", 5, 18]],
            ]);
        });

        it("prefixed properties share the syntax of the standard property #3", function () {
            // the validations are cached by syntax: -webkit-transform reuses the validations of transform
            expect(getParsedSyntax("declarations", "-webkit-transform")).equals(
                getParsedSyntax("declarations", "transform"),
            );
            expect(getParsedSyntax("declarations", "-webkit-unknown-property")).equals(null);
        });
    });

    describe("transform memo", function () {
        it("identical transform values are computed once #1", function () {
            const css = `.a { transform: translate3d(0, -100%, 0) rotate(10deg); color: red }
.b { transform: translate3d(0, -100%, 0) rotate(10deg); color: blue }
.c { transform: scale(1.5) translateX(10px); color: red }
.d { transform: scale(1.5) translateX(10px); color: blue }
.e { transform: rotate(var(--a)) scale(1); color: red }
.f { transform: rotate(var(--a)) scale(1); color: blue }
.g { -webkit-transform: skewX(10deg); transform: skewX(10deg) }`;

            // the minified functions (.a, .b), the matrix (.c, .d), the values that cannot be computed (.e, .f)
            expect(transformSync(css).code).equals(
                ".a,.b{transform:translateY(-100%)rotate(10deg)}.b{color:blue}.a,.c{color:red}.c,.d{transform:matrix(1.5,0,0,1,15,0)}.d{color:blue}.e,.f{transform:rotate(var(--a))scale(1)}.f{color:blue}.e{color:red}.g{-webkit-transform:skew(10deg);transform:skew(10deg)}",
            );
        });

        it("the memoized tokens are copied #2", function () {
            const result = parseSync(
                `@keyframes a { to { transform: scale(1.5) translateX(10px) } } @keyframes b { to { transform: scale(1.5) translateX(10px) } }`,
                { minify: true },
            );
            const arena = result.arena;
            const values = [];

            for (const node of arena.walk(result.ast)) {
                if (arena.getType(node) === EnumToken.DeclarationNodeType) {
                    values.push(arena.getFirstToken(node));
                }
            }

            expect(values.length).equals(2);
            // each declaration has its own tokens
            expect(values[0]).not.equals(values[1]);
            expect(render(arena, result.ast).code).equals(
                "@keyframes a{to{transform:matrix(1.5,0,0,1,15,0)}}@keyframes b{to{transform:matrix(1.5,0,0,1,15,0)}}",
            );
        });

        it("the numbers are rounded without strings #3", function () {
            const values = [0.1, 1 / 3, -2 / 3, 123456.5, 1234565, 0.1234565, 9.999995, 9.9999949, 1e-7, 1e20, 1e21, 1e-16];

            for (let i = 0; i < 2000; i++) {
                values.push(Math.cos(i), Math.atan(i) * 180 / Math.PI, (i - 1000) * 1.0000001, Number((100000 + i * 397) + ".5e" + ((i % 30) - 20)));
            }

            for (const value of values) {
                expect(toPrecision6(value)).equals(+value.toPrecision(6));
                expect(toPrecision6(-value)).equals(+(-value).toPrecision(6));
            }
        });
    });
}
