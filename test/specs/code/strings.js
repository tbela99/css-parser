import { AstArena } from "../../../dist/ast/arena.js";
import { EnumToken } from "../../../dist/ast/types.js";
import { parseString } from "../../../dist/parser/parse.js";
import { StringBuilder } from "../../../dist/ast/strings.js";

export function run(describe, expect, it, transform, parse, render) {
    describe("string interning", function () {
        it("a range of code units and a string with the same content have the same id #1", function () {
            const arena = new AstArena();
            const text = "color:red;color:blue";
            const codes = new Uint16Array([...text].map((c) => c.charCodeAt(0)));
            const count = arena.getStringCount();
            const source = 0;

            arena.setSourceText(source, text);

            const color = arena.internRange(codes, 0, 5, source);

            // the string is a range of the source: it is created when it is read
            expect(arena.stringTable.cache[color]).equals(undefined);
            expect(arena.getStringCount()).equals(count + 1);

            // the same content: the same id, no new string
            expect(arena.internRange(codes, 10, 15, source)).equals(color);
            expect(arena.internString("color")).equals(color);
            expect(arena.stringId("color")).equals(color);
            expect(arena.getStringCount()).equals(count + 1);
            expect(arena.stringTable.cache[color]).equals(undefined);

            expect(arena.resolveString(color)).equals("color");
            expect(arena.equalsIgnoreCase(arena.createToken(EnumToken.IdenTokenType, "COLOR"), "val", "color")).equals(
                true,
            );

            expect(arena.internRange(codes, 6, 9, source)).not.equals(color);
            expect(arena.stringId("blue")).equals(-1);

            // code units copied to the pool (StringSource.Pool)
            const blue = arena.internRange(new Uint8Array([98, 108, 117, 101]), 0, 4, -1);

            expect(arena.stringId("blue")).equals(blue);
            expect(arena.internRange(codes, 16, 20, source)).equals(blue);
            expect(arena.resolveString(blue)).equals("blue");
        });

        it("the values of the tokens are not strings #6", async function () {
            const result = await parse(`.a{width:10PX;transform:ROTATE(3deg)}.b{content:"\\41 ${"x".repeat(300)}"}`, {
                minify: false,
            });
            const arena = result.arena;
            const rule = arena.firstChild[result.ast];
            const width = arena.firstChild[rule];
            const unit = arena.unit[arena.firstToken[width]];
            const transform = arena.nextSibling[width];
            const rotate = arena.stringValue[arena.firstToken[transform]];

            // the canonical spelling of the units and function names
            expect(arena.resolveString(unit)).equals("px");
            expect(arena.resolveString(rotate)).equals("rotate");

            // escape sequences are decoded
            const content = arena.firstChild[arena.nextSibling[rule]];

            expect(arena.resolveString(arena.stringValue[arena.firstToken[content]])).equals(`"A${"x".repeat(300)}"`);
        });

        it("line numbers of the css with \\r\\n line breaks #7", async function () {
            const css = ".a{color:red}\n.b{color:blue}\n\n.c{colr:red}\n.d{width:1px}";
            const lf = await transform(css, { sourcemap: true, src: "in.css", minify: false, beautify: true });
            const crlf = await transform(css.replace(/\n/g, "\r\n"), {
                sourcemap: true,
                src: "in.css",
                minify: false,
                beautify: true,
            });

            expect(crlf.map.toJSON().mappings).equals(lf.map.toJSON().mappings);
            expect(crlf.map.find(7, 1)?.map((p) => p.slice(0, 3))).deep.equals([["in.css", 4, 1]]);
            expect(crlf.map.find(10, 1)?.map((p) => p.slice(0, 3))).deep.equals([["in.css", 5, 1]]);
        });

        it("many strings #2", function () {
            const arena = new AstArena();
            const ids = new Map();

            for (let i = 0; i < 20000; i++) {
                const str = "s" + i.toString(36);

                ids.set(str, arena.internString(str));
            }

            expect(new Set(ids.values()).size).equals(20000);

            for (const [str, id] of ids) {
                expect(arena.stringId(str)).equals(id);
                expect(arena.internString(str)).equals(id);
                expect(arena.resolveString(id)).equals(str);
            }
        });

        it("the string table is rebuilt by compact() and when the arena is transferred #3", async function () {
            const result = await parse(".a{color:red}.b{color:blue;width:10px}", { minify: false });
            const arena = result.arena;

            arena.detach(arena.lastChild[result.ast]);
            arena.compact();

            expect(arena.stringId("blue")).equals(-1);
            expect(arena.resolveString(arena.stringId("color"))).equals("color");
            expect(arena.internString("red")).equals(arena.stringValue[arena.firstToken[arena.firstChild[arena.firstChild[result.ast]]]]);

            const [properties, transferables] = AstArena.toTransferableArenaObject(arena);
            const copy = AstArena.fromTransferableArenaObjects(properties, transferables);

            expect(copy.stringId("color")).equals(arena.stringId("color"));
            expect(copy.internString("blue")).equals(copy.getStringCount() - 1);
            expect(render(copy, result.ast).code).equals(".a{color:red}");
        });

        it("numbers are read from the code units #4", function () {
            const arena = new AstArena();
            const values = [
                "1e3",
                "1.5E-2",
                "-2.5e+3",
                ".5e1",
                "1e22",
                "1e23",
                "1e-22",
                "1e-30",
                "1e400",
                "0.1",
                "0.30000000000000004",
                "12345678901234567890",
                "123456789012345",
                "-0",
            ];

            for (const value of values) {
                const [token] = parseString(arena, value);

                expect(arena.dataTypes[token]).equals(EnumToken.NumberTokenType);
                expect(Object.is(arena.numericValue[token], parseFloat(value))).equals(true, value);
            }

            const [dimension] = parseString(arena, "1.5e2px");

            expect(arena.dataTypes[dimension]).equals(EnumToken.LengthTokenType);
            expect(arena.numericValue[dimension]).equals(150);
            expect(arena.resolveString(arena.unit[dimension])).equals("px");
        });

        it("escape sequences and units #5", async function () {
            return transform(`.a{content:"\\2014 \\41 x";width:10PX;margin:6DB;transform:ROTATE(3deg) translateX(2px)}`, {
                beautify: true,
            }).then((result) =>
                expect(result.code).equals(`.a {
 content: "—Ax";
 width: 10px;
 margin: 6dB;
 transform: translate(1.99726px,.104672px)rotate(3deg)
}`),
            );
        });

        it("css modules: an undeclared custom property is not renamed #8", async function () {
            return transform(`.a{color:var(--x)} .b{--y:red;color:var(--y)}`, { module: true, beautify: true }).then(
                (result) => {
                    expect(result.code).not.contains("undefined");
                    expect(result.code).contains("var(--x)");
                    expect(result.code).contains(`var(${result.mapping["--y"]})`);
                },
            );
        });

        it("the interned strings are read without being created #9", function () {
            const arena = new AstArena();
            const text = "Color:RED;.a .b";
            const codes = new Uint16Array([...text].map((c) => c.charCodeAt(0)));

            arena.setSourceText(0, text);

            const name = arena.internRange(codes, 0, 5, 0);
            const value = arena.internRange(codes, 6, 9, 0);
            const selector = arena.internRange(codes, 10, 15, 0);
            const created = () => arena.stringTable.cache.filter((s) => s !== undefined).length;
            const before = created();

            expect(arena.stringLength(name)).equals(5);
            expect(arena.stringCodeAt(name, 0)).equals(0x43);
            expect(arena.stringEquals(name, "Color")).equals(true);
            expect(arena.stringEquals(name, "color")).equals(false);
            expect(arena.stringEqualsIgnoreCase(name, "color")).equals(true);
            expect(arena.stringStartsWith(selector, ".a ")).equals(true);
            expect(arena.stringIndexOf(selector, 0x20)).equals(2);
            expect(arena.stringIndexOf(selector, 0x26)).equals(-1);

            // the lowercase string is interned from its code units
            const lower = arena.lowerStringId(value);

            expect(arena.stringId("red")).equals(lower);
            expect(arena.lowerStringId(lower)).equals(lower);

            // a string built from interned strings
            const builder = new StringBuilder();

            arena.appendString(builder.appendCode(0x3a), name);
            expect(arena.internBuilder(builder)).equals(arena.stringId(":Color"));

            // a property computed once per string
            let calls = 0;
            const isRed = (str) => {
                calls++;
                return str.toLowerCase() === "red";
            };

            expect(arena.stringFlag(value, 0, isRed)).equals(true);
            expect(arena.stringFlag(value, 0, isRed)).equals(true);
            expect(calls).equals(1);

            // copied as bytes
            const bytes = new Uint8Array(5);

            expect(arena.copyStringAscii(selector, bytes, 0)).equals(5);
            expect(new TextDecoder().decode(bytes)).equals(".a .b");

            // no string was created by the reads, except the string read by the flag
            expect(created()).equals(before + 1);
            expect(arena.resolveString(selector)).equals(".a .b");
        });

        it("the strings of the tokens are created when they are read #10", async function () {
            let css = "";

            for (let i = 0; i < 100; i++) {
                css += `.a${i} .b:hover > .c${i}::before, .d${i} { color: red; background: url(a${i}.png) }\n`;
            }

            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const created = arena.stringTable.cache.filter((s) => s !== undefined).length;

            // the selectors, the names and the values are not created by the parser
            expect(created).to.be.below(arena.getStringCount() / 10);
            expect(render(arena, result.ast).code).equals(css.replace(/\n/g, "").replace(/ \{ /g, "{").replace(/; /g, ";").replace(/ }/g, "}").replace(/: /g, ":").replace(/, \./g, ",.").replace(/ > /g, ">").replace(/::before/g, ":before"));
        });
    });
}
