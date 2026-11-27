export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, transformSync, parseSync) {
    const css = ".foo { color: red } .bar { composes: foo; color: blue }";

    describe("css module patterns", function () {
        const module = {
            filePath: "src/styles/main.module.css",
            pattern: "[name:4]_[ext:3]_[path:6]_[folder:3]_[local:2]",
        };
        const mapping = { foo: "main_mod_src_st_sty_fo", bar: "main_mod_src_st_sty_ba main_mod_src_st_sty_fo" };

        it("placeholders with a length #1", function () {
            const result = transformSync(css, { module });

            expect(result.code).equals(".main_mod_src_st_sty_fo{color:red}.main_mod_src_st_sty_ba{color:blue}");
            expect(result.mapping).deep.equals(mapping);
        });

        it("placeholders with a length, async #2", async function () {
            const result = await transform(css, { module });

            expect(result.code).equals(".main_mod_src_st_sty_fo{color:red}.main_mod_src_st_sty_ba{color:blue}");
            expect(result.mapping).deep.equals(mapping);
        });

        it("a scoped name does not start with a digit #3", function () {
            expect(transformSync(css, { module: { filePath: "1x.css", pattern: "[name]-[local]" } }).code).equals(
                "._1x-foo{color:red}._1x-bar{color:blue}",
            );
        });

        it("invalid patterns #4", function () {
            expect(() => transformSync(css, { module: { pattern: "[[local]]" } })).to.throw("Unexpected character");
            expect(() => transformSync(css, { module: { pattern: "local]" } })).to.throw("Unexpected character");
            expect(() => transformSync(css, { module: { pattern: "[bogus]" } })).to.throw("Unsupported key: 'bogus'");
            expect(() => transformSync(css, { module: { pattern: "[hash:abc]" } })).to.throw("Unsupported hash length");
        });

        it("invalid patterns, async #5", async function () {
            await expect(transform(css, { module: { pattern: "[[local]]" } })).to.be.rejectedWith("Unexpected character");
            await expect(transform(css, { module: { pattern: "local]" } })).to.be.rejectedWith("Unexpected character");
            await expect(transform(css, { module: { pattern: "[bogus]" } })).to.be.rejectedWith("Unsupported key: 'bogus'");
            await expect(transform(css, { module: { pattern: "[hash:abc]" } })).to.be.rejectedWith("Unsupported hash length");
        });

        it("scoped: boolean #6", function () {
            expect(transformSync(css, { module: { scoped: false } }).mapping).deep.equals({ foo: "foo", bar: "bar foo" });

            const scoped = transformSync(css, { module: { scoped: true } }).mapping;

            expect(scoped.foo).matches(/^foo_/);
            expect(scoped.bar).matches(/^bar_\S+ foo_/);
        });

        it("module: ModuleScopeEnumOptions #7", function () {
            expect(transformSync(css, { module: ModuleScopeEnumOptions.Global }).mapping).deep.equals({ foo: "foo", bar: "bar foo" });
        });

        it("generateScopedName #8", async function () {
            expect(transformSync(css, { module: { generateScopedName: (local) => "y-" + local } }).mapping).deep.equals({
                foo: "y-foo",
                bar: "y-bar y-foo",
            });
            expect((await transform(css, { module: { generateScopedName: async (local) => "x-" + local } })).mapping).deep.equals({
                foo: "x-foo",
                bar: "x-bar x-foo",
            });
        });
    });

    describe("abort signal", function () {
        it("an aborted signal stops the parsing #1", async function () {
            await expect(transform(css, { signal: AbortSignal.abort() })).to.be.rejected;
            await expect(parse(css, { signal: AbortSignal.abort() })).to.be.rejected;
            expect(() => transformSync(css, { signal: AbortSignal.abort() })).to.throw();
            expect(() => parseSync(css, { signal: AbortSignal.abort() })).to.throw();
        });

        it("a signal that is not aborted #2", async function () {
            expect((await transform(".a { color: red }", { signal: new AbortController().signal })).code).equals(".a{color:red}");
        });
    });

    describe("visitor results", function () {
        const source = ".a { color: red; width: 10px }";

        it("a node replaced by several nodes #1", async function () {
            const visitor = { Declaration: (arena, node) => (arena.getName(node) === "color" ? [node, arena.clone(node, true)] : null) };
            const expected = ".a {\n color: red;\n color: red;\n width: 10px\n}";

            expect(transformSync(source, { minify: false, beautify: true, visitor }).code).equals(expected);
            expect((await transform(source, { minify: false, beautify: true, visitor })).code).equals(expected);
        });

        it("a token replaced by a token list #2", async function () {
            const visitor = { LengthTokenType: (arena) => [arena.createToken(EnumToken.LengthTokenType, 20, "px")] };

            expect(transformSync(source, { visitor }).code).equals(".a{color:red;width:20px}");
            expect((await transform(source, { visitor: { LengthTokenType: async (arena, node) => visitor.LengthTokenType(arena, node) } })).code).equals(
                ".a{color:red;width:20px}",
            );
        });

        it("a handler that returns the node does not change it #3", async function () {
            expect(transformSync(source, { visitor: { Declaration: (arena, node) => node, LengthTokenType: (arena, node) => node } }).code).equals(
                ".a{color:red;width:10px}",
            );
            expect((await transform(source, { visitor: { Declaration: (arena, node) => node, LengthTokenType: (arena, node) => node } })).code).equals(
                ".a{color:red;width:10px}",
            );
        });

        it("a list of visitors #4", async function () {
            const calls = [];
            const visitor = [{ Declaration: (arena, node) => void calls.push(1) }, { Declaration: (arena, node) => void calls.push(2) }];

            expect(transformSync(source, { visitor }).code).equals(".a{color:red;width:10px}");
            expect(calls).deep.equals([1, 2, 1, 2]);

            calls.length = 0;
            expect((await transform(source, { visitor })).code).equals(".a{color:red;width:10px}");
            expect(calls).deep.equals([1, 2, 1, 2]);
        });
    });
}
