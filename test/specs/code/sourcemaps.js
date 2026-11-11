import { ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from "../../../dist/src/lib/ast/types.js";

export function run(
    describe,
    expect,
    it,
    transform,
    parse,
    render,
    dirname,
    readFile,
    resolve,
    ColorType,
    EnumToken,
    ModuleCaseTransformEnum,
    ModuleScopeEnumOptions,
    transformSync,
    parseSync,
) {
    const root = new URL(dirname(import.meta.url) + "/../../../");

    describe("sourcemap", function () {
        const url = new URL(dirname(import.meta.url) + "/../../files/css/nested.css"); // const file = `@import '${dir}/files/css/line-awesome.css`;

        const options = {
            input: `
@import '${url.pathname.replace(root.pathname, "")}';
h1 {
  text-transform: uppercase;
}
button {
	background: linear-gradient(
		if(media(min-width: 768px): to right; else: to bottom),
		if(style(--dark-mode): #333; else: #fff),
		if(style(--dark-mode): #000; else: #ccc)
	);
}
    `,
            beautify: true,
            sourcemap: "inline",
            expandNestingRules: true,
            expandIfSyntax: true,
            resolveImport: true,
            output: "test/sourcemap.html",
        };

        it("sourcemap unminified #1", async () => {
            return transform(options).then(async (result) => {
                // result.map.computePositions();
                let positions = result.map.find(40, 2);
                expect(positions?.length == 1 && positions[0].slice(0, 3)).deep.equals([null, 6, 1]);
            });
        });

        it("sourcemap minified #2", async () => {
            return transform(options).then(async (result) => {
                const result2 = transformSync({
                    input: result.code,
                    nestingRules: false,
                    sourcemap: "inline",
                    output: "test/sourcemap.html",
                });

                // result2.map.computePositions();
                let positions = result2.map.find(1, 254);
                expect(positions?.[0]?.slice?.(0, 3)).deep.equals(["files/css/nested.css", 1, 207]);

                positions = result2.map.find(100, 255);
                expect(positions).equals(null);
            });
        });
    });

    describe("sourcemap with identical values", function () {
        // identical declaration values are rendered once: each declaration must still be mapped to its own location
        const input = `@page :first {
  margin: 1cm;
  color: rgb(255 0 0);
}
.s {

width: 10px;
}
@page :left {
  margin: 1cm;
  color: rgb(255 0 0);
}
`;

        it("identical values are mapped to their own location #1", function () {
            const result = transformSync({ input, sourcemap: true, beautify: true, src: "in.css" });

            expect(result.code).equals(
                "@page :first {\n margin: 1cm;\n color: red\n}\n.s {\n width: 10px\n}\n@page :left {\n margin: 1cm;\n color: red\n}",
            );

            // first occurrences
            expect(result.map.find(2, 2)?.map((p) => p.slice(0, 3))).deep.equals([["in.css", 2, 3]]);
            expect(result.map.find(3, 2)?.map((p) => p.slice(0, 3))).deep.equals([["in.css", 3, 3]]);
            // second occurrences
            expect(result.map.find(9, 2)?.map((p) => p.slice(0, 3))).deep.equals([["in.css", 10, 3]]);
            expect(result.map.find(10, 2)?.map((p) => p.slice(0, 3))).deep.equals([["in.css", 11, 3]]);
        });
    });
}
