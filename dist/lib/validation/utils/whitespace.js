import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

function consumeWhitespace(tokens) {
    if (tokens.length == 0) {
        return true;
    }
    if (tokens[0].typ != EnumToken.WhitespaceTokenType && tokens[0].typ != EnumToken.DescendantCombinatorTokenType) {
        return false;
    }
    while (tokens.length > 0 && (tokens[0].typ == EnumToken.WhitespaceTokenType || tokens[0].typ == EnumToken.DescendantCombinatorTokenType)) {
        tokens.shift();
    }
    return true;
}

export { consumeWhitespace };
