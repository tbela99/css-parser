import { doRender, RenderMemo } from "../../../dist/src/lib/printer/render.js";

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
    });
}
