import { PropertyList } from '../../parser/declaration/list.js';
import '../../renderer/utils/color.js';
import '../types.js';
import '../minify.js';
import '../../parser/parse.js';
import '../../renderer/sourcemap/lib/encode.js';
import { MinifyFeature } from '../utiles/minifyfeature.js';

class ComputeShorthand extends MinifyFeature {
    static get ordering() {
        return 2;
    }
    static register(options) {
        if (options.computeShorthand) {
            for (const feature of options.features) {
                if (feature instanceof ComputeShorthand) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new ComputeShorthand());
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
            if (node.typ == 0 /* NodeType.CommentNodeType */ || node.typ == 5 /* NodeType.DeclarationNodeType */) {
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

export { ComputeShorthand };
