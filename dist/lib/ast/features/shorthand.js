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
        if (!("chi" in ast || ast.chi?.length == 0)) {
            return null;
        }
        // @ts-ignore
        const j = ast.chi.length;
        let k = 0;
        let l;
        // let properties: PropertyList = new PropertyList(options);
        const rules = [];
        const declarations = [];
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
                    // properties.add(ast.chi![m]);
                }
            }
            else {
                for (let m = k; m <= l; m++) {
                    rules.push(ast.chi[m]);
                }
            }
            k = l;
        }
        // console.error([...new PropertyList(options).add(declarations)]);
        if (declarations.length > 0) {
            ast.chi.length = 0;
            // @ts-expect-error
            ast.chi.push(...new PropertyList(options).add(declarations), ...rules);
        }
        return ast;
    }
}

export { ComputeShorthandFeature };
