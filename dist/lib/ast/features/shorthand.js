import { PropertyList } from '../../parser/declaration/list.js';
import { EnumToken } from '../types.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { FeatureWalkMode } from './type.js';

class ComputeShorthandFeature {
    get ordering() {
        return 3;
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
    run(ast, options = {}, parent, context) {
        if (!('chi' in ast)) {
            return ast;
        }
        // @ts-ignore
        const j = ast.chi.length;
        let k = 0;
        let l;
        let properties = new PropertyList(options);
        const rules = [];
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
                properties.add(...ast.chi.slice(k, l + 1));
            }
            else {
                rules.push(...ast.chi.slice(k, l + 1));
            }
            k = l;
        }
        // @ts-ignore
        ast.chi = [...properties, ...rules];
        return ast;
    }
}

export { ComputeShorthandFeature };
