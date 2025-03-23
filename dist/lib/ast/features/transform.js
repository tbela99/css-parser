import { EnumToken } from '../types.js';
import { consumeWhitespace } from '../../validation/utils/whitespace.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { compute } from '../transform/compute.js';
import { decompose } from '../transform/utils.js';
import { minify } from '../transform/minify.js';

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
            const result = compute(children);
            if (result == null) {
                // console.error({result});
                return;
            }
            decompose(result);
            const minified = minify(result);
            // console.error({result, decomposed, minify: minify(result), serialized: renderToken(serialize(result))});
            if (minified != null) {
                node.val = minified;
            }
        }
    }
}

export { TransformCssFeature };
