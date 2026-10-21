/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.6.10
	License: MIT
 */
import { PropertyList } from '../../parser/declaration/list.js';
import { EnumToken } from '../types.js';
import { FeatureWalkMode } from './type.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';

class ComputeShorthandFeature {
    accept = new Set([
        EnumToken.RuleNodeType,
        EnumToken.AtRuleNodeType,
        EnumToken.KeyframesRuleNodeType,
    ]);
    get ordering() {
        return 5;
    }
    get processMode() {
        return FeatureWalkMode.Post;
    }
    static register(options) {
        if (options.computeShorthand) {
            // @ts-ignore
            options.features.push(new ComputeShorthandFeature(options));
        }
    }
    run(ast, options) {
        if (!("chi" in ast || ast.chi?.length == 0)) {
            return null;
        }
        // @ts-ignore
        const j = ast.chi.length;
        let k = 0;
        let l;
        const rules = [];
        const declarations = [];
        const doNotSort = ast.typ == EnumToken.AtRuleNodeType && equalsIgnoreCase(ast.nam, "function");
        // https://drafts.csswg.org/css-mixins/#:~:text=The%20value%20of%20the%20result%20descriptor%20is%20always%2016px%20in%20the%20above%20example
        if (doNotSort) {
            for (const node of ast.chi) {
                declarations.push(node);
            }
        }
        else {
            // @ts-ignore
            for (; k < j; k++) {
                l = k;
                // capture comments with the next token
                while (l + 1 < j) {
                    // @ts-ignore
                    const node = ast.chi[l];
                    if (node.typ == EnumToken.CommentNodeType) {
                        l++;
                        continue;
                    }
                    break;
                }
                // @ts-ignore
                const node = ast.chi[l];
                if (node.typ == EnumToken.DeclarationNodeType) {
                    for (let m = k; m <= l; m++) {
                        declarations.push(ast.chi[m]);
                    }
                }
                else {
                    for (let m = k; m <= l; m++) {
                        rules.push(ast.chi[m]);
                    }
                }
                k = l;
            }
        }
        if (declarations.length > 0) {
            ast.chi.length = 0;
            // @ts-expect-error
            ast.chi.push(...new PropertyList(options).add(declarations), ...rules);
        }
        return ast;
    }
}

export { ComputeShorthandFeature };
