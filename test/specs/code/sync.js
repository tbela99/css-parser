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
                    expect(render(result1.arena, result1.ast).code).equals(render(result2.arena, result2.ast).code),
                ),
            );
        });
        it("parse sync #3", function () {
            const url = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/css/bootstrap-grid.css";

            return transform({ file: url, resolveImport: true }).then((result) =>
                expect(render(result.arena, result.ast).code.startsWith(".container,.container-fluid")).equals(true),
            );
        });
    });

    describe("options are not modified", function () {
        it("parseSync and transformSync do not modify the options #1", function () {
            const options = { minify: true, validation: true, src: "a.css" };
            const copy = JSON.stringify(options);

            const first = transformSync(".a{color:10px}", options);
            const second = transformSync("\n\n.b{color:10px}", options);

            // the options of the caller are not modified: the source of the first call is not reused by the second
            expect(JSON.stringify(options)).equals(copy);
            expect(first.errors.map((error) => error.location)).deep.equals([["a.css", 1, 10]]);
            expect(second.errors.map((error) => error.location)).deep.equals([["a.css", 3, 10]]);

            parseSync(".c{color:red}", options);
            expect(JSON.stringify(options)).equals(copy);
        });

        it("parse and transform do not modify the options #2", function () {
            const options = { minify: true, src: "b.css" };
            const copy = JSON.stringify(options);

            return Promise.all([parse(".a{color:red}", options), transform(".b{color:blue}", options)]).then(
                ([parsed, transformed]) => {
                    expect(JSON.stringify(options)).equals(copy);
                    expect(render(parsed.arena, parsed.ast).code).equals(".a{color:red}");
                    expect(transformed.code).equals(".b{color:blue}");
                },
            );
        });

        it("render does not modify the options #3", function () {
            const result = parseSync(".a{color:red}");
            const options = { beautify: true };

            expect(render(result.arena, result.ast, options).code).equals(".a {\n color: red\n}");
            expect(Object.keys(options)).deep.equals(["beautify"]);
        });
    });
}
