/* generate from test/specs/block.spec.ts */
import { parse, walk,  EnumToken} from '../../dist/node/index.js';
import {expect} from "@esm-bundle/chai";

describe('node walker', function () {

    it('walk #1', function () {
        const css = `
.clear {
  width: 0;
  height: 0;
}

.clearfix:before {

  height: 0;
  width: 0;
}`;
        const values = [EnumToken.StyleSheetNodeType, EnumToken.RuleNodeType, EnumToken.DeclarationNodeType, EnumToken.DeclarationNodeType];

        return parse(css).then(result => {

            for(const  s of walk(result.ast)) {

                expect(s.node.typ).equals(values.shift());
            }

            expect(values.length).equals(0);
        });
    });

    it('walk #2', async function () {
        const css = `
@media all {html { font-family: Blanco, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; font-size: clamp(12px, 0.8rem + 0.25vw, 20px); font-weight: 400; line-height: 1.7; }}
`;

        const values = [EnumToken.StyleSheetNodeType, EnumToken.AtRuleNodeType, EnumToken.RuleNodeType, EnumToken.DeclarationNodeType, EnumToken.DeclarationNodeType, EnumToken.DeclarationNodeType, EnumToken.DeclarationNodeType];

        return parse(css, {minify: false}).then(r => {

            for (const s of walk(r.ast)) {

                expect(s.node.typ).equals(values.shift());
            }

            expect(values.length).equals(0);
        })
    });
});
