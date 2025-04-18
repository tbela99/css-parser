import { EnumToken } from '../types.js';
import { consumeWhitespace } from '../../validation/utils/whitespace.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import { renderToken } from '../../renderer/render.js';
import '../../renderer/color/utils/constants.js';
import '../../parser/utils/config.js';
import { compute } from '../transform/compute.js';

class TransformCssFeature {
    static get ordering() {
        return 4;
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
            if (node.typ != EnumToken.DeclarationNodeType ||
                (!node.nam.startsWith('--') && !node.nam.match(/^(-[a-z]+-)?transform$/))) {
                continue;
            }
            const children = node.val.slice();
            consumeWhitespace(children);
            let { matrix, cumulative, minified } = compute(children) ?? {};
            if (matrix == null || cumulative == null || minified == null) {
                return;
            }
            let result = cumulative;
            if (renderToken(matrix).length < result.reduce((acc, t) => acc + renderToken(t), '').length) {
                result = [matrix];
            }
            if (matrix != minified[0] && minified.reduce((acc, t) => acc + renderToken(t), '').length < result.reduce((acc, t) => acc + renderToken(t), '').length) {
                result = minified;
            }
            node.val = result;
        }
    }
}

export { TransformCssFeature };
