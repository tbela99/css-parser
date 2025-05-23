import { EnumToken } from '../../../ast/types.js';
import '../../../ast/minify.js';
import '../../../ast/walk.js';
import '../../../parser/parse.js';
import { COLORS_NAMES } from './constants.js';
import { expandHexValue } from '../hex.js';
import '../../sourcemap/lib/encode.js';
import '../../../parser/utils/config.js';

function getComponents(token) {
    if (token.kin == 'hex' || token.kin == 'lit') {
        const value = expandHexValue(token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
        // @ts-ignore
        return value.slice(1).match(/([a-fA-F0-9]{2})/g).map((t) => {
            return { typ: EnumToken.Number, val: parseInt(t, 16).toString() };
        });
    }
    const result = [];
    for (const child of (token.chi)) {
        if ([
            EnumToken.LiteralTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType
        ].includes(child.typ)) {
            continue;
        }
        if (child.typ == EnumToken.ColorTokenType && child.val == 'currentcolor') {
            return null;
        }
        result.push(child);
    }
    return result;
}

export { getComponents };
