import { EnumToken } from '../types.js';
import { consumeWhitespace } from '../../validation/utils/whitespace.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { filterValues, renderToken } from '../../renderer/render.js';
import '../../syntax/color/utils/constants.js';
import { compute } from '../transform/compute.js';
import { eqMatrix } from '../transform/minify.js';

class TransformCssFeature {
    get ordering() {
        return 4;
    }
    get preProcess() {
        return false;
    }
    get postProcess() {
        return true;
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
            const children = node.val.slice();
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
