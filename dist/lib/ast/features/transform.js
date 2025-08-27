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
import { eqMatrix } from '../transform/minify.js';
import { FeatureWalkMode } from './type.js';

class TransformCssFeature {
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
            return;
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
            const children = node.val.reduce((acc, curr) => {
                if (curr.typ == EnumToken.FunctionTokenType && 'skew' == curr.val.toLowerCase()) {
                    if (curr.chi.length == 3) {
                        if (curr.chi[2].val == 0) {
                            curr.chi.length = 1;
                            curr.val = 'skew';
                        }
                        else if (curr.chi[0].val == 0) {
                            curr.chi = [curr.chi[2]];
                            curr.val = 'skewY';
                        }
                    }
                }
                acc.push(curr);
                return acc;
            }, []);
            consumeWhitespace(children);
            let { matrix, cumulative, minified } = compute(children) ?? {};
            if (matrix == null || cumulative == null || minified == null) {
                continue;
            }
            let r = [filterValues(node.val.slice())];
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
    }
}

export { TransformCssFeature };
