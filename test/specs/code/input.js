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
}
