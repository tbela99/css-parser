import { PropertyList } from '../../parser/declaration/list.js';
import { EnumToken } from '../types.js';
import { FeatureWalkMode } from './type.js';

class ComputeShorthandFeature {
    accept = new Set([
        EnumToken.RuleNodeType,
        EnumToken.AtRuleNodeType,
        EnumToken.KeyframesRuleNodeType,
    ]);
    get ordering() {
        return 10;
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
        if (!("chi" in ast)) {
            return null;
        }
        // @ts-ignore
        const j = ast.chi.length;
        let k = 0;
        let l;
        let properties = new PropertyList(options);
        const rules = [];
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
                    properties.add(ast.chi[m]);
                }
            }
            else {
                for (let m = k; m <= l; m++) {
                    rules.push(ast.chi[m]);
                }
            }
            k = l;
        }
        ast.chi.length = 0;
        // @ts-expect-error
        ast.chi.push(...properties, ...rules);
        return ast;
    }
}

export { ComputeShorthandFeature };
