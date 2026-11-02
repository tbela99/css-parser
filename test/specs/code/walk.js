import { EnumToken } from "../../../dist/src/lib/ast/types.js";
import { walk } from "../../../dist/src/lib//ast/walk.js";
import { find, findByValue, findAll, findLast } from "../../../dist/src/lib/ast/find.js";

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
                for (const s of walk(result.arena, result.ast)) {
                    expect(result.arena.dataTypes[s.node]).equals(values.shift());
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
                for (const s of walk(r.arena, r.ast)) {
                    expect(r.arena.dataTypes[s.node]).equals(values[i++]);
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
            const nodeMatcher = (node, arena) =>
                arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == "aspect-ratio";

            return transform(css).then((result) => {
                const arena = result.arena;
                const node = find(arena, result.ast, nodeMatcher);

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
                const nodeMatcher = (value) =>
                    arena.dataTypes[value] == EnumToken.LengthTokenType &&
                    arena.numericValue[value] == 30 &&
                    arena.getUnit(value) == "px";

                const { node } = findByValue(arena, result.ast, nodeMatcher) ?? {};

                expect(node).equals(arena.getChildAt(arena.getChildAt(result.ast, 0), 1));
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
            const nodeMatcher = (node, arena) =>
                arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == "aspect-ratio";

            return transform(css).then((result) => {
                const nodes = findAll(result.arena, result.ast, nodeMatcher) ?? {};

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
            const nodeMatcher = (node, arena) =>
                arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == "aspect-ratio";

            return transform(css).then((result) => {
                const arena = result.arena;
                const node = findLast(arena, result.ast, nodeMatcher);

                expect(node).equals(arena.getChildAt(arena.getChildAt(result.ast, 1), 0));
            });
        });
    });
}
