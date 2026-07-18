import { EnumToken, EnumAstNodeStatus } from '../types.js';
import { compute } from '../transform/compute.js';
import { filterValues, renderValue } from '../../renderer/render.js';
import { minifyTransformFunctions, eqMatrix } from '../transform/minify.js';
import { FeatureWalkMode } from './type.js';
import { STATE } from '../../syntax/constants.js';

class TransformCssFeature {
    accept = new Set([EnumToken.RuleNodeType, EnumToken.KeyFramesRuleNodeType]);
    get ordering() {
        return 4;
    }
    get processMode() {
        return FeatureWalkMode.Post;
    }
    static register(options) {
        // @ts-ignore
        if (options.computeTransform) {
            // @ts-ignore
            options.features.push(new TransformCssFeature());
        }
    }
    run(ast) {
        if (!("chi" in ast)) {
            return null;
        }
        let i = 0;
        let node;
        // @ts-ignore
        for (; i < ast.chi.length; i++) {
            // @ts-ignore
            node = ast.chi[i];
            if (node[STATE] == EnumAstNodeStatus.Invalid || node[STATE] == EnumAstNodeStatus.ValidationFailed) {
                continue;
            }
            if (node.typ != EnumToken.DeclarationNodeType ||
                !node.nam.match(/^(-[a-z]+-)?transform$/)) {
                continue;
            }
            const children = [];
            for (const child of node.val) {
                children.push(child.typ == EnumToken.TransformFunctionTokenType
                    ? minifyTransformFunctions(child)
                    : child);
            }
            // consumeWhitespace(children);
            let { matrix, cumulative, minified } = compute(children) ?? {
                matrix: null,
                cumulative: null,
                minified: null,
            };
            if (matrix == null || cumulative == null || minified == null) {
                node.val = children;
                continue;
            }
            let r = [filterValues(children)];
            if (eqMatrix(matrix, cumulative)) {
                r.push(cumulative);
            }
            if (eqMatrix(matrix, minified)) {
                r.push(minified);
            }
            const l = renderValue(matrix).length;
            node.val = r.reduce((acc, curr) => {
                if (curr.reduce((acc, t) => acc + renderValue(t), "").length < l) {
                    return curr;
                }
                return acc;
            }, [matrix]);
        }
        return null;
    }
}

export { TransformCssFeature };
