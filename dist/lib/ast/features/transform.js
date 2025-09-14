import { EnumToken } from '../types.js';
import { consumeWhitespace } from '../../validation/utils/whitespace.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../syntax/color/utils/constants.js';
import { filterValues, renderToken } from '../../renderer/render.js';
import '../../renderer/sourcemap/lib/encode.js';
import { compute } from '../transform/compute.js';
import { minifyTransformFunctions, eqMatrix } from '../transform/minify.js';
import { FeatureWalkMode } from './type.js';

class TransformCssFeature {
    accept = new Set([EnumToken.RuleNodeType, EnumToken.AtRuleNodeType]);
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
        if (!('chi' in ast)) {
            return null;
        }
        let i = 0;
        let node;
        // @ts-ignore
        for (; i < ast.chi.length; i++) {
            // @ts-ignore
            node = ast.chi[i];
            if (node.typ != EnumToken.DeclarationNodeType || !node.nam.match(/^(-[a-z]+-)?transform$/)) {
                continue;
            }
            const children = [];
            for (const child of node.val) {
                children.push(child.typ == EnumToken.FunctionTokenType ? minifyTransformFunctions(child) : child);
            }
            consumeWhitespace(children);
            let { matrix, cumulative, minified } = compute(children) ?? {
                matrix: null,
                cumulative: null,
                minified: null
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
            const l = renderToken(matrix).length;
            node.val = r.reduce((acc, curr) => {
                if (curr.reduce((acc, t) => acc + renderToken(t), '').length < l) {
                    return curr;
                }
                return acc;
            }, [matrix]);
        }
        return null;
    }
}

export { TransformCssFeature };
