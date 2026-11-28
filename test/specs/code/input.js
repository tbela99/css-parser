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
    const encoder = new TextEncoder();
    const css = `.a { color: #ff0000; content: "été 😀"; width: calc(1px + 2px) }
/* comment */
.b\u2028{ background: url(a.png) }`;

    describe("ArrayBuffer input", function () {
        it("ArrayBuffer, typed array and string #1", function () {
            const expected = transformSync(css).code;
            const bytes = encoder.encode(css);

            expect(transformSync(bytes.buffer).code).equals(expected);
            expect(transformSync(bytes).code).equals(expected);
            expect(transformSync(new DataView(bytes.buffer)).code).equals(expected);
            expect(transformSync({ input: bytes.buffer }).code).equals(expected);

            // a view of a part of a buffer
            const larger = new Uint8Array(bytes.length + 10);

            larger.set(bytes, 5);
            expect(transformSync(larger.subarray(5, 5 + bytes.length)).code).equals(expected);
        });

        it("async ArrayBuffer input #2", function () {
            const bytes = encoder.encode(css);

            return Promise.all([transform(css), transform(bytes.buffer), parse({ input: bytes })]).then(
                ([string, buffer, parsed]) => {
                    expect(buffer.code).equals(string.code);
                    expect(render(parsed.arena, parsed.ast).code).equals(string.code);
                },
            );
        });

        it("locations of a non ascii ArrayBuffer #3", function () {
            const fromString = parseSync(css, { minify: false });
            const fromBuffer = parseSync(encoder.encode(css).buffer, { minify: false });
            const locations = (result) => {
                const list = [];

                for (const node of result.arena.walk(result.ast)) {
                    const location = result.arena.getLocation(node);

                    list.push([location.sta, location.end]);
                }

                return list;
            };

            expect(locations(fromBuffer)).deep.equals(locations(fromString));
            expect(fromBuffer.stats.bytesIn).equals(fromString.stats.bytesIn);
        });

        it("byte order mark #4", function () {
            const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...encoder.encode(".a{color:red}")]);

            expect(transformSync(bytes.buffer).code).equals(".a{color:red}");
        });

        it("empty ArrayBuffer #5", function () {
            expect(transformSync(new ArrayBuffer(0)).code).equals("");
        });
    });

    describe("ReadableStream input", function () {
        // the chunks are given one at a time, when the parser asks for them
        const streamOf = (chunks) => {
            let index = 0;

            return new ReadableStream(
                {
                    pull(controller) {
                        if (index < chunks.length) {
                            controller.enqueue(chunks[index++]);
                        } else {
                            controller.close();
                        }
                    },
                },
                { highWaterMark: 0 },
            );
        };

        // the bytes split every `size` bytes: tokens, characters and \r\n are split between chunks
        const split = (bytes, size) => {
            const chunks = [];

            for (let i = 0; i < bytes.length; i += size) {
                chunks.push(bytes.slice(i, i + size));
            }

            return chunks;
        };

        const source = `@charset "utf-8";\r\n.a\\31 b::before { content: "été \\f26e"; color: #ff0000 }\r\n/* comment é */
.b{width:calc(1px + 2px);background:url( "x y.png" )} @media (min-width: 40em){.c{margin:0 0 0 0}}\r\n.d{unicode-range: U+0025-00FF}
.e:hover > .f , .g{transform:rotate(-0.25turn)}${css}`;

        it("chunks of 1, 2, 3, 7 and 64 bytes #1", async function () {
            const expected = await transform(source);
            const bytes = encoder.encode(source);

            for (const size of [1, 2, 3, 7, 64]) {
                const result = await transform(streamOf(split(bytes, size)));

                expect(result.code, `chunks of ${size} bytes`).equals(expected.code);
                expect(result.errors.length).equals(expected.errors.length);
            }
        });

        it("chunks of text #2", async function () {
            const expected = await transform(source, { minify: false, beautify: true });
            const chunks = [];

            for (let i = 0; i < source.length; i += 5) {
                chunks.push(source.slice(i, i + 5));
            }

            expect((await transform(streamOf(chunks), { minify: false, beautify: true })).code).equals(expected.code);
        });

        it("locations of the tokens #3", async function () {
            const expected = await parse(source, { minify: false });
            const result = await parse(streamOf(split(encoder.encode(source), 3)), { minify: false });
            const locations = (result) => {
                const list = [];

                for (const node of result.arena.walk(result.ast)) {
                    const location = result.arena.getLocation(node);

                    list.push([location.sta, location.end]);
                }

                return list;
            };

            expect(locations(result)).deep.equals(locations(expected));
            expect(result.stats.bytesIn).equals(expected.stats.bytesIn);
        });

        it("empty stream #4", async function () {
            expect((await transform(streamOf([]))).code).equals("");
        });
    });

    // a utf-8 css without U+2028, U+2029 and U+212A is tokenized from its bytes: the offsets are byte offsets, the
    // locations, the columns and the lengths are utf-16 offsets. a stream is decoded to utf-16 code units: it is the
    // reference
    describe("UTF-8 input", function () {
        const streamOf = (bytes) =>
            new ReadableStream({
                start(controller) {
                    for (let i = 0; i < bytes.length; i += 3) {
                        controller.enqueue(bytes.slice(i, i + 3));
                    }

                    controller.close();
                },
            });

        const utf8 = `.a { content: "été 😀"; color: #ff0000 } .ü\\31 x::after { content: "\\e9 😀 →" }
.😀b { background: url(données.png) } /* commentaire é */ .c{width:calc(1px + 2px)} .d { color: }
@media (min-width: 40em) { .日本 { margin: 0 } } .e { font-family: "Noto Sans 日本語", sans-serif } .f { color: red`;

        const locations = (result) => {
            const list = [];

            for (const node of result.arena.walk(result.ast)) {
                const location = result.arena.getLocation(node);

                list.push(location && [location.sta, location.end]);
            }

            return list;
        };

        const summary = (result) => [
            result.code,
            result.errors.map((error) => [error.message, error.location]),
            JSON.stringify(result.map ?? null),
            result.stats.bytesIn,
        ];

        it("locations are utf-16 offsets #1", async function () {
            const bytes = encoder.encode(utf8);
            const expected = locations(await parse(streamOf(bytes), { minify: false }));

            expect(locations(parseSync(utf8, { minify: false }))).deep.equals(expected);
            expect(locations(parseSync(bytes, { minify: false }))).deep.equals(expected);
            expect(locations(await parse(bytes.buffer, { minify: false }))).deep.equals(expected);
        });

        it("output, errors, source map and length #2", async function () {
            const bytes = encoder.encode(utf8);

            for (const options of [{}, { minify: false, sourcemap: true, src: "a.css" }, { beautify: true }]) {
                const expected = summary(await transform(streamOf(bytes), options));

                expect(summary(transformSync(utf8, options)), JSON.stringify(options)).deep.equals(expected);
                expect(summary(transformSync(bytes, options)), JSON.stringify(options)).deep.equals(expected);
            }
        });

        it("the length of the css is in utf-16 code units #3", function () {
            expect(transformSync(encoder.encode(utf8)).stats.bytesIn).equals(utf8.length);
        });

        it("invalid utf-8 is decoded #4", function () {
            // 0xff is not utf-8: it is replaced by U+FFFD
            const bytes = new Uint8Array([...encoder.encode('.a{content:"é'), 0xff, ...encoder.encode('"}')]);

            expect(transformSync(bytes).code).equals(transformSync(new TextDecoder().decode(bytes)).code);
            expect(transformSync(bytes).code).equals('.a{content:"é�"}');
        });

        it("U+2028 and dense non ascii css #5", async function () {
            for (const source of [`.a{content:"é"} .b{color:red}`, `.日本語{content:"日本語のテキスト"}.ü{color:red}`]) {
                const bytes = encoder.encode(source);
                const expected = await transform(streamOf(bytes), { minify: false, sourcemap: true });

                expect(summary(transformSync(bytes, { minify: false, sourcemap: true }))).deep.equals(summary(expected));
            }
        });
    });
}
