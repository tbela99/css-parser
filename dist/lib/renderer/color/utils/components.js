import { EnumToken } from '../../../ast/types.js';
import '../../../ast/minify.js';
import '../../../ast/walk.js';
import '../../../parser/parse.js';
import '../../../parser/tokenize.js';
import '../../../parser/utils/config.js';
import { ColorKind, COLORS_NAMES } from './constants.js';
import { expandHexValue } from '../hex.js';
import '../../sourcemap/lib/encode.js';

function getComponents(token) {
    if (token.kin == ColorKind.HEX || token.kin == ColorKind.LIT) {
        const value = expandHexValue(token.kin == ColorKind.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
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
        if (child.typ == EnumToken.ColorTokenType && child.val.localeCompare('currentcolor', undefined, { sensitivity: 'base' }) == 0) {
            return null;
        }
        result.push(child);
    }
    return result;
}

export { getComponents };
