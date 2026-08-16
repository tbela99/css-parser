import { ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from "../../../dist/lib/ast/types.js";

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
    describe("sourcemap", function () {
        const url = new URL(dirname(import.meta.url) + "/../../files/css/nested.css"); // const file = `@import '${dir}/files/css/line-awesome.css`;

        const options = {
            input: `
@import '${url.pathname}';
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
            expandIfSyntax: true,
            resolveImport: true,
            output: "test/sourcemap.html",
        };

        it("sourcemap unminified #1", async () => {
            return transform(options).then(async (result) => {
                result.map.computePositions();
                let positions = result.map.find(39, 3);
                expect(positions?.length == 1 && positions[0].slice(0, 3)).deep.equals([null, 7, 3]);
            });
        });

        it("sourcemap minified #2", async () => {
            return transform(options).then(async (result) => {
                const result2 = transformSync({
                    input: result.code,
                    sourcemap: "inline",
                    output: "test/sourcemap.html",
                });

                result2.map.computePositions();
                const positions = result2.map.find(1, 255);
                expect(positions?.length == 1 && positions[0].slice(0, 3)).deep.equals([null, 23, 2]);
            });
        });
    });
}
