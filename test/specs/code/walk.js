import { EnumToken, WalkerEvent, WalkerOptionEnum } from "../../../dist/src/lib/ast/types.js";

export function run(describe, expect, it, transform, parse, render, dirname, readFile) {
    describe("node walker", function () {
        it("walk #1", function () {
            const css = `
.clear {
  width: 0;
  height: 0;
}

.clearfix:before {

  height: 0;
  width: 0;
}`;
            const values = [
                EnumToken.StyleSheetNodeType,
                EnumToken.RuleNodeType,
                EnumToken.DeclarationNodeType,
                EnumToken.DeclarationNodeType,
            ];

            return parse(css).then((result) => {
                for (const node of result.arena.walk(result.ast)) {
                    expect(result.arena.dataTypes[node]).equals(values.shift());
                }

                expect(values.length).equals(0);
            });
        });

        it("walk #2", async function () {
            const css = `
@media all {html { font-family: Blanco, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; font-size: clamp(12px, 0.8rem + 0.25vw, 20px); font-weight: 400; line-height: 1.7; }}
`;

            const values = [
                EnumToken.StyleSheetNodeType,
                EnumToken.AtRuleNodeType,
                EnumToken.RuleNodeType,
                EnumToken.DeclarationNodeType,
                EnumToken.DeclarationNodeType,
                EnumToken.DeclarationNodeType,
                EnumToken.DeclarationNodeType,
            ];

            return parse(css, { minify: false }).then((r) => {
                let i = 0;
                for (const node of r.arena.walk(r.ast)) {
                    expect(r.arena.dataTypes[node]).equals(values[i++]);
                }

                expect(values.length).equals(i);
            });
        });

        it("find #3", async function () {
            const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}`;

            // find declaration which contain a '30px'
            const nodeMatcher = (arena, node) =>
                arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == "aspect-ratio";

            return transform(css).then((result) => {
                const arena = result.arena;
                const node = arena.find(result.ast, nodeMatcher);

                expect(node).equals(arena.getChildAt(arena.getChildAt(result.ast, 0), 0));
            });
        });

        it("findByValue #4", async function () {
            const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
.button-small {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 20px; else: 30px);
}

`;

            return transform(css).then((result) => {
                const arena = result.arena;

                // find declaration which contain a '30px'
                const nodeMatcher = (arena, value) =>
                    arena.dataTypes[value] == EnumToken.LengthTokenType &&
                    arena.numericValue[value] == 30 &&
                    arena.getUnit(value) == "px";

                const { node, value } = arena.findByValue(result.ast, nodeMatcher) ?? {};

                expect(node).equals(arena.getChildAt(arena.getChildAt(result.ast, 0), 1));
                expect(arena.getValueOwner(value)).equals(node);
                expect(arena.findValue(node, nodeMatcher)).equals(value);
            });
        });

        it("findAll #5", async function () {
            const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
.button-small {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 20px; else: 30px);
}

`;

            // find declaration which contain a '30px'
            const nodeMatcher = (arena, node) =>
                arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == "aspect-ratio";

            return transform(css).then((result) => {
                const nodes = result.arena.findAll(result.ast, nodeMatcher);

                expect(nodes.length).equals(2);
            });
        });

        it("findLast #6", async function () {
            const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
.button-small {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 20px; else: 30px);
}

`;

            // find declaration which contain a '30px'
            const nodeMatcher = (arena, node) =>
                arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == "aspect-ratio";

            return transform(css).then((result) => {
                const arena = result.arena;
                const node = arena.findLast(result.ast, nodeMatcher);

                expect(node).equals(arena.getChildAt(arena.getChildAt(result.ast, 1), 0));
            });
        });
        it("walk filter #7", async function () {
            const result = await parse(`@media all { .a { color: red } } .b { color: blue } .c { width: 0 }`, { minify: false });
            const arena = result.arena;
            const types = (filter) => [...arena.walk(result.ast, filter)].map((node) => EnumToken[arena.getType(node)]);

            // the filter is called with the arena and the node id
            expect(
                types((a, node) => {
                    expect(a).equals(arena);
                    return a.getType(node) == EnumToken.AtRuleNodeType ? WalkerOptionEnum.IgnoreChildren : null;
                }),
            ).deep.equals(["StyleSheetNodeType", "AtRuleNodeType", "RuleNodeType", "DeclarationNodeType", "RuleNodeType", "DeclarationNodeType"]);

            expect(
                types((a, node) => (a.getType(node) == EnumToken.AtRuleNodeType ? WalkerOptionEnum.Children : null)),
            ).deep.equals(["StyleSheetNodeType", "RuleNodeType", "DeclarationNodeType", "RuleNodeType", "DeclarationNodeType", "RuleNodeType", "DeclarationNodeType"]);

            expect(
                types((a, node) => (a.getType(node) == EnumToken.RuleNodeType && a.getSelector(node) == ".b" ? WalkerOptionEnum.Stop : null)),
            ).deep.equals(["StyleSheetNodeType", "AtRuleNodeType", "RuleNodeType", "DeclarationNodeType"]);

            expect(types({ reverse: true, filter: (a, node) => (a.getType(node) == EnumToken.DeclarationNodeType ? WalkerOptionEnum.Ignore : null) })).deep.equals([
                "StyleSheetNodeType",
                "RuleNodeType",
                "RuleNodeType",
                "AtRuleNodeType",
                "RuleNodeType",
            ]);

            // value tokens are walked with attributes
            const values = [...arena.walk(arena.getLastChild(result.ast), { attributes: true })].filter((id) => !(arena.getFlags(id) & 0x30000));

            expect(values.some((token) => arena.getType(token) == EnumToken.NumberTokenType && arena.getNumericValue(token) == 0)).equals(true);
            expect(values.some((token) => arena.getType(token) == EnumToken.ClassSelectorTokenType)).equals(true);

            // the children are read after the node is returned: the node can be detached
            for (const node of arena.walk(result.ast)) {
                if (arena.getType(node) == EnumToken.RuleNodeType && arena.getSelector(node) == ".b") {
                    arena.detach(node);
                }
            }

            expect(render(arena, result.ast).code).equals("@media all{.a{color:red}}.c{width:0}");
        });

        it("walkValues #8", async function () {
            const result = await parse(`.a { width: calc(1px + max(2px, 3px)) }`, { minify: false });
            const arena = result.arena;
            const declaration = arena.getFirstChild(arena.getFirstChild(result.ast));
            const names = (iterable) => [...iterable].map((token) => EnumToken[arena.getType(token)]);

            // the value tokens of a node or an array of token ids
            expect(names(arena.walkValues(declaration))).deep.equals(names(arena.walkValues(arena.tokens(declaration))));
            // the aliases of EnumToken (Length, Comma, ...) are the names of their values
            expect(names(arena.walkValues(declaration))).deep.equals([
                "MathFunctionTokenType",
                "BinaryExpressionTokenType",
                "Length",
                "MathFunctionTokenType",
                "Length",
                "Comma",
                "Length",
            ]);

            // the parent of a value token
            for (const token of arena.walkValues(declaration)) {
                const parent = arena.getValueParent(token);

                expect(parent).to.be.above(0);
                expect(arena.getValueOwner(token)).equals(declaration);

                if (arena.getType(parent) == EnumToken.BinaryExpressionTokenType) {
                    // the field list token is skipped
                    expect(arena.getType(arena.getParent(token))).equals(EnumToken.ListTokenType);
                }
            }

            // filter: the arena, the token id and the event
            const events = [];

            for (const token of arena.walkValues(declaration, {
                event: WalkerEvent.Enter | WalkerEvent.Leave,
                type: (a, token) => a.getType(token) == EnumToken.MathFunctionTokenType && a.str(token) == "max",
                fn: (a, token, event) => {
                    expect(a).equals(arena);
                    events.push([arena.str(token), event]);
                    return event == WalkerEvent.Enter ? WalkerOptionEnum.IgnoreChildren : null;
                },
            })) {
                expect(token).to.be.above(0);
            }

            expect(events).deep.equals([
                ["max", WalkerEvent.Enter],
                ["max", WalkerEvent.Leave],
            ]);

            expect(
                names(arena.walkValues(declaration, (a, token) => (a.getType(token) == EnumToken.BinaryExpressionTokenType ? WalkerOptionEnum.Ignore : null))),
            ).deep.equals(["MathFunctionTokenType"]);

            // reverse
            expect(names(arena.walkValues(declaration, null, true))[0]).equals("MathFunctionTokenType");

            // break releases the iterator
            for (const token of arena.walkValues(declaration)) {
                expect(arena.getType(token)).equals(EnumToken.MathFunctionTokenType);
                break;
            }
        });
    });
}
