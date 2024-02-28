import { EnumToken } from '../../../ast/types.js';
import '../../../ast/minify.js';
import '../../../parser/parse.js';
import './constants.js';
import '../../sourcemap/lib/encode.js';

function getComponents(token) {
    return token.chi
        .filter((t) => ![EnumToken.LiteralTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(t.typ));
}

export { getComponents };
