import { matchingAlternatives, mayStartWith } from "../../../dist/validation/first.js";
import { getParsedSyntax } from "../../../dist/validation/config.js";
import { ValidationTokenEnum } from "../../../dist/validation/parser/typedef.js";

export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, transformSync, parseSync) {
    /**
     * the first token of the value of the first declaration
     */
    function firstToken(css) {
        const result = parseSync(css, { minify: false, validation: false });
        const arena = result.arena;

        for (const node of arena.walk(result.ast)) {
            if (arena.getType(node) === EnumToken.DeclarationNodeType) {
                let token = arena.getFirstToken(node);

                while (token !== 0 && arena.getType(token) === EnumToken.WhitespaceTokenType) {
                    token = arena.getNextSibling(token);
                }

                return { arena, token };
            }
        }
    }

    /**
     * the alternatives of a declaration syntax: `a | b | c`
     */
    function alternatives(name) {
        const syntax = getParsedSyntax("declarations", name).filter((token) => token.typ !== ValidationTokenEnum.Whitespace);

        expect(syntax.length).equals(1);
        expect(syntax[0].typ).equals(ValidationTokenEnum.PipeToken);

        return syntax[0].chi;
    }

    describe("first token index", function () {
        it("the alternatives that cannot match the first token are skipped #1", function () {
            // text-align: start | end | left | right | center | <string> | justify | match-parent | justify-all | <-non-standard-text-align>
            const chi = alternatives("text-align");
            let { arena, token } = firstToken(".a{text-align:center}");
            let candidates = matchingAlternatives(arena, chi, token);

            // `center` and the last alternative, which starts with an empty alternative (`| -moz-center | ...`): it
            // may match no token
            expect(candidates).deep.equals([4, chi.length - 1]);

            ({ arena, token } = firstToken(`.a{text-align:"x"}`));
            expect(matchingAlternatives(arena, chi, token)).deep.equals([5, chi.length - 1]);
        });

        it("the references are resolved #2", function () {
            // outline-width: <line-width>, <line-width> = <length [0,∞]> | hairline | thin | medium | thick
            const syntax = getParsedSyntax("declarations", "outline-width");

            for (const [css, expected] of [
                [".a{outline-width:thin}", true],
                [".a{outline-width:2px}", true],
                [".a{outline-width:auto}", false],
                [".a{outline-width:50%}", false],
            ]) {
                const { arena, token } = firstToken(css);

                expect(mayStartWith(arena, syntax, token)).equals(expected);
            }
        });

        it("var(), the math functions and the css wide keywords may match any syntax #3", function () {
            const chi = alternatives("text-align");

            for (const css of [".a{text-align:var(--a)}", ".a{text-align:calc(1px + 2px)}", ".a{text-align:INHERIT}"]) {
                const { arena, token } = firstToken(css);

                expect(matchingAlternatives(arena, chi, token)).equals(null);
            }
        });

        it("the literal numbers and dimensions of a syntax are matched #4", function () {
            // -moz-force-broken-image-icon: 0 | 1, glyph-orientation-vertical: auto | 0deg | 90deg | 0 | 90
            const result = transformSync(
                ".a{-moz-force-broken-image-icon:1;glyph-orientation-vertical:90DEG}\n.b{-moz-force-broken-image-icon:2;glyph-orientation-vertical:45deg}",
                { validation: true, src: "n.css" },
            );

            // the validation threw `Unexpected syntax Number`
            expect(result.code).equals(
                ".a{-moz-force-broken-image-icon:1;glyph-orientation-vertical:90deg}.b{-moz-force-broken-image-icon:2;glyph-orientation-vertical:45deg}",
            );
            expect(result.errors.map((error) => error.message)).deep.equals([
                "could not match syntax",
                "could not match syntax",
            ]);
        });
    });
}
