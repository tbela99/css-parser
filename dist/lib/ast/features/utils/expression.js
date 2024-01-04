import { EnumToken } from '../../types.js';
import '../../../renderer/utils/color.js';
import '../../minify.js';
import '../../../parser/parse.js';
import '../../../renderer/sourcemap/lib/encode.js';

function mapnode(node) {
    const mapped = {};
    for (const key of Object.keys(node)) {
        if (key == 'typ' || key == 'op') {
            mapped.typ = EnumToken[node[key]];
        }
        else if (Array.isArray(node[key])) {
            mapped[key] = node[key].map(mapnode);
        }
        else if (typeof node[key] == 'object') {
            mapped[key] = mapnode(node[key]);
        }
        else {
            mapped[key] = node[key];
        }
    }
    return Array.isArray(node) ? Object.values(mapped) : mapped;
}

export { mapnode };
