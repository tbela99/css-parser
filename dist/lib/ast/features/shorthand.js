import { PropertyList } from '../../parser/declaration/list.js';
import { EnumToken } from '../types.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

class ComputeShorthandFeature {
    static get ordering() {
        return 3;
    }
    static register(options) {
        if (options.computeShorthand) {
            // @ts-ignore
            options.features.push(new ComputeShorthandFeature(options));
        }
    }
    run(ast, options = {}, parent, context) {
        // @ts-ignore
        const j = ast.chi.length;
        let k = 0;
        let properties = new PropertyList(options);
        const rules = [];
        // @ts-ignore
        for (; k < j; k++) {
            // @ts-ignore
            const node = ast.chi[k];
            if (node.typ == EnumToken.CommentNodeType || node.typ == EnumToken.DeclarationNodeType) {
                properties.add(node);
            }
            else {
                rules.push(node);
            }
        }
        // @ts-ignore
        ast.chi = [...properties, ...rules];
        return ast;
    }
}

export { ComputeShorthandFeature };
