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
        if (options.minify || options.computeCalcExpression || options.computeShorthand) {
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
            let { matrix, cumulative } = compute(children) ?? {};
            // console.error({result, matrix});
            // console.error(
            //     {
            //         // result: result == null ? null :result.reduce((acc, curr) => acc + renderToken(curr), ''),
            //         matrix: matrix == null ? null : renderToken(matrix),
            //         cumulative: cumulative == null ? null : cumulative.reduce((acc, curr) => acc + renderToken(curr), '')
            //     });
            if (matrix == null) {
                return;
            }
            if (renderToken(matrix).length < cumulative.reduce((acc, t) => acc + renderToken(t), '').length) {
                cumulative = [matrix];
            }
            node.val = cumulative;
        }
    }
}

export { TransformCssFeature };
