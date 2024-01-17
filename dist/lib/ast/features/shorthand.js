import { PropertyList } from '../../parser/declaration/list.js';
import '../../renderer/utils/color.js';
import { EnumToken } from '../types.js';
import '../minify.js';
import '../../parser/parse.js';
import '../../renderer/sourcemap/lib/encode.js';
import { MinifyFeature } from '../utils/minifyfeature.js';

class ComputeShorthandFeature extends MinifyFeature {
    static get ordering() {
        return 2;
    }
    static register(options) {
        if (options.computeShorthand) {
            for (const feature of options.features) {
                if (feature instanceof ComputeShorthandFeature) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new ComputeShorthandFeature());
        }
    }
    run(ast, options = {}, parent, context) {
        // @ts-ignore
        const j = ast.chi.length;
        let k = 0;
        let properties = new PropertyList(options);
        // @ts-ignore
        for (; k < j; k++) {
            // @ts-ignore
            const node = ast.chi[k];
            if (node.typ == EnumToken.CommentNodeType || node.typ == EnumToken.DeclarationNodeType) {
                properties.add(node);
                continue;
            }
            break;
        }
        // @ts-ignore
        ast.chi = [...properties].concat(ast.chi.slice(k));
        return ast;
    }
}

export { ComputeShorthandFeature };
