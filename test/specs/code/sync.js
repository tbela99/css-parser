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
    describe("transform sync", function () {
        it("transform sync #1", function () {
            return readFile(import.meta.dirname + "/../../files/css/tailwind.css", "utf-8").then((css) =>
                Promise.all([transform(css), transformSync(css)]).then(([result1, result2]) =>
                    expect(result1.code).equals(result2.code),
                ),
            );
        });
        it("parse sync #2", function () {
            return readFile(import.meta.dirname + "/../../files/css/tailwind.css", "utf-8").then((css) =>
                Promise.all([parse({ input: css }), parseSync({ input: css })]).then(([result1, result2]) =>
                    expect(render(result1.ast).code).equals(render(result2.ast).code),
                ),
            );
        });
        it("parse sync #3", function () {
            const url = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/css/bootstrap-grid.css";

            return transform({ file: url, resolveImport: true }).then((result) =>
                expect(render(result.ast).code.startsWith(".container,.container-fluid")).equals(true),
            );
        });
    });
}
