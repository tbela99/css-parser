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
    const decoder = new TextDecoder();

    describe("render result", function () {
        it("the generated css is available as bytes #1", async () => {
            const result = await transform(`.a{color:red !important;color:blue}
.a{color:Coral!important}
.a{color:blue}`);

            expect(result.write).to.be.instanceOf(Uint8Array);
            expect(decoder.decode(result.write)).equals(`.a{color:coral!important}`);
            expect(result.code).equals(`.a{color:coral!important}`);
            expect(result.stats.bytesOut).equals(result.code.length);
        });

        it("the writer contains only the generated css #2", async () => {
            const result = transformSync(`.a{color:red}`);

            // the render buffer is larger than the generated css: only the written bytes are returned
            expect(result.write.byteLength).equals(`.a{color:red}`.length);
            expect([...result.write]).deep.equals([...new TextEncoder().encode(`.a{color:red}`)]);
        });

        it("code is decoded once #3", async () => {
            const result = transformSync(`.a{color:red}`);

            expect(result.code).equals(`.a{color:red}`);

            // the decoded string is kept: the bytes are not decoded again
            result.write[1] = "b".charCodeAt(0);

            expect(result.code).equals(`.a{color:red}`);
            expect(decoder.decode(result.write)).equals(`.b{color:red}`);
        });

        it("non ascii characters are encoded as utf-8 #4", async () => {
            const css = `.a::after{content:"é ü 中文 😀"}`;
            const result = await transform(css, { beautify: true });
            const expected = `.a:after {
 content: "é ü 中文 😀"
}`;

            expect(result.code).equals(expected);
            expect([...result.write]).deep.equals([...new TextEncoder().encode(expected)]);
            // the length of the css, not the number of bytes
            expect(result.stats.bytesOut).equals(expected.length);
            expect(result.write.byteLength).equals(new TextEncoder().encode(expected).byteLength);
        });

        it("render() returns the bytes #5", async () => {
            const parseResult = await parse(`.a{color:red;.b{color:blue}}@media print{.c{color:green}}`);
            const result = render(parseResult.arena, parseResult.ast, { beautify: true });

            expect(result.write).to.be.instanceOf(Uint8Array);
            expect(result.code).equals(decoder.decode(result.write));
            expect(result.code).equals(`.a {
 color: red;
 .b {
  color: blue
 }
}
@media print {
 .c {
  color: green
 }
}`);
        });

        it("large output #6", async () => {
            let css = "";

            for (let i = 0; i < 5000; i++) {
                css += `.a${i}{color:red;content:"é${i}"}\n`;
            }

            const result = transformSync(css, { minify: false, beautify: false });
            let expected = "";

            for (let i = 0; i < 5000; i++) {
                expected += `.a${i}{color:red;content:"é${i}"}`;
            }

            // the output is larger than the chunks of the writer
            expect(result.code === expected).equals(true);
            expect(result.write.byteLength).equals(new TextEncoder().encode(expected).byteLength);
        });

        it("inline source map #7", async () => {
            const result = await transform(`.a{color:red}`, { sourcemap: "inline", src: "in.css" });

            expect(result.code.startsWith(`.a{color:red}\n/*# sourceMappingURL=data:application/json`)).equals(true);
            expect(result.code).equals(decoder.decode(result.write));
        });

        it("json serialization #8", async () => {
            const parseResult = await parse(`.a{color:red}`);
            const result = render(parseResult.arena, parseResult.ast);
            const json = JSON.parse(JSON.stringify(result));

            expect(json.code).equals(`.a{color:red}`);
            expect(json.write).equals(undefined);
            expect(json.errors).deep.equals([]);
        });

        it("the buffer is allocated from the input length #9", async () => {
            let css = "";

            for (let i = 0; i < 2000; i++) {
                css += `.a${i} {\n    color: red;\n    width: ${i}px;\n}\n`;
            }

            const result = await transform(css);

            expect(result.arena.inputLengths[result.ast]).equals(css.length);
            // the output is smaller than the input: the buffer did not grow
            expect(result.write.byteLength).to.be.below(css.length);
            expect(result.write.buffer.byteLength).to.be.at.least(css.length);
            expect(result.write.buffer.byteLength).to.be.below(css.length + (1 << 13));
        });

        it("the buffer grows when the output is larger than the input #10", async () => {
            let css = "";
            let expected = "";

            for (let i = 0; i < 1000; i++) {
                css += `.a${i}{color:red;width:${i + 1}px}`;
                expected += `${i > 0 ? "\n" : ""}.a${i} {\n color: red;\n width: ${i + 1}px\n}`;
            }

            const result = transformSync(css, { beautify: true, minify: false });

            expect(result.write.byteLength).to.be.above(css.length + (1 << 12));
            expect(result.code === expected).equals(true);
            expect(decoder.decode(result.write) === expected).equals(true);
        });

        it("identical declarations are copied #11", async () => {
            let css = "";
            let expected = "";

            for (let i = 0; i < 100; i++) {
                css += `.a${i}{color:red;content:"é ${i % 3}";margin:0 auto}`;
                expected += `.a${i}{color:red;content:"é ${i % 3}";margin:0 auto}`;
            }

            const parseResult = await parse(css, { minify: false });
            const result = render(parseResult.arena, parseResult.ast, { beautify: false, minify: true });

            expect(result.code).equals(expected);
            expect(result.write.byteLength).equals(new TextEncoder().encode(expected).byteLength);
        });

        it("input length of the nodes #12", async () => {
            const parseResult = await parse(`.a{color:red}\n@media print{.b{color:blue}}`, { minify: false });
            const arena = parseResult.arena;
            const media = arena.lastChild[parseResult.ast];
            const result = render(arena, media);

            expect(result.code).equals(`@media print{.b{color:blue}}`);

            // compact() keeps the input length of the stylesheet
            const mapping = arena.compact();

            expect(arena.inputLengths[mapping[parseResult.ast]]).equals(42);
            expect(render(arena, mapping[parseResult.ast]).code).equals(`.a{color:red}@media print{.b{color:blue}}`);
        });

        it("bytesOut is the length of the css #13", async () => {
            const inputs = [
                `.a{content:"é"}.b{content:"é"}.c{content:"é"}.d{}.e::after{content:"😀 中文"}`,
                `.é{color:red}.é2{}.é3{}@media print{.ü{}}`,
                `/*! licence é */.a{color:red}`,
            ];

            for (const input of inputs) {
                for (const options of [{}, { beautify: true }, { minify: false }, { sourcemap: true }]) {
                    const result = await transform(input, options);

                    expect(result.stats.bytesOut).equals(result.code.length);
                    expect(result.code).equals(decoder.decode(result.write));
                }
            }
        });
    });
}
