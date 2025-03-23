import { EnumToken } from '../types.js';
import { consumeWhitespace } from '../../validation/utils/whitespace.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

class TranslateCssFeature {
    static get ordering() {
        return 4;
    }
    static register(options) {
        // @ts-ignore
        if (options.minify || options.computeCalcExpression || options.computeShorthand) {
            // for (const feature of options.features) {
            //
            //     if (feature instanceof ComputeCalcExpressionFeature) {
            //
            //         return
            //     }
            // }
            // @ts-ignore
            options.features.push(new TranslateCssFeature());
        }
    }
    run(ast) {
        if (!('chi' in ast)) {
            return;
        }
        let i = 0;
        // @ts-ignore
        for (; i < ast.chi.length; i++) {
            const node = ast.chi[i];
            if (node.typ != EnumToken.DeclarationNodeType ||
                (!node.nam.startsWith('--') && !node.nam.match(/^(-[a-z]+-)?transform$/))) {
                continue;
            }
            const translationMap = {
                x: null,
                y: null,
                z: null
            };
            const children = node.val.slice();
            consumeWhitespace(children);
            for (const value of children) {
                if (value.typ == EnumToken.FunctionTokenType && value.val == 'translate3d') {
                    translationMap.x = value.chi[0];
                    translationMap.y = value.chi[1];
                    translationMap.z = value.chi[2];
                }
            }
            console.error({ node, translationMap });
        }
    }
}

export { TranslateCssFeature };
