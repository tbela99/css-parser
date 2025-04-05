import { EnumToken } from '../types.js';
import { consumeWhitespace } from '../../validation/utils/whitespace.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import { renderToken } from '../../renderer/render.js';
import '../../renderer/color/utils/constants.js';
import '../../parser/utils/config.js';
import { compute, computeMatrix } from '../transform/compute.js';
import { serialize } from '../transform/matrix.js';

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
            let result = compute(children);
            if (result == null) {
                return;
            }
            // console.error(JSON.stringify({result}, null, 1));
            // console.error({result, t: result.map(t =>  minify(t) ?? t
            //     )});
            // console.error({result: decompose2(result)});
            // const decomposed =decompose(result);
            // const minified = minify(result);
            const matrix = computeMatrix(result);
            if (matrix != null) {
                const m = serialize(matrix);
                if (renderToken(m).length < result.reduce((acc, t) => acc + renderToken(t), '').length) {
                    result = [m];
                }
            }
            // console.error({result, serialized: renderToken()});
            // if (minified != null) {
            node.val = result;
            // }
        }
    }
}

export { TransformCssFeature };
