import { EnumToken } from "../../../dist/lib/ast/types.js";
import { walk } from "../../../dist/lib//ast/walk.js";
import { find, findByValue, findAll, findLast } from "../../../dist/lib/ast/find.js";

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
                for (const s of walk(result.ast)) {
                    expect(s.node.typ).equals(values.shift());
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
                for (const s of walk(r.ast)) {
                    expect(s.node.typ).equals(values.shift());
                }

                expect(values.length).equals(0);
            });
        });

        it("find #3", async function () {
            const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}`;

            // find declaration which contain a '30px'
            const nodeMatcher = (node) => node.typ == EnumToken.DeclarationNodeType && node.nam == "aspect-ratio";

            return transform(css).then((result) => {
                const node = find(result.ast, nodeMatcher);

                expect(node).equals(result.ast.chi[0].chi[0]);
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

            // find declaration which contain a '30px'
            const nodeMatcher = (value) =>
                value.typ == EnumToken.LengthTokenType && value.val == 30 && value.unit == "px";

            return transform(css).then((result) => {
                const { node } = findByValue(result.ast, nodeMatcher) ?? {};

                expect(node).equals(result.ast.chi[0].chi[1]);
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
            const nodeMatcher = (node) => node.typ == EnumToken.DeclarationNodeType && node.nam == "aspect-ratio";

            return transform(css).then((result) => {
                const nodes = findAll(result.ast, nodeMatcher) ?? {};

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
            const nodeMatcher = (node) => node.typ == EnumToken.DeclarationNodeType && node.nam == "aspect-ratio";

            return transform(css).then((result) => {
                const node = findLast(result.ast, nodeMatcher);

                expect(node).equals(result.ast.chi[1].chi[0]);
            });
        });
    });
}
