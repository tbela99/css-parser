import { EnumToken } from '../../ast/types.js';

function consumeWhitespace(tokens) {
    if (tokens.length == 0) {
        return true;
    }
    if (tokens[0].typ != EnumToken.WhitespaceTokenType && tokens[0].typ != EnumToken.DescendantCombinatorTokenType) {
        return false;
    }
    while (tokens.length > 0 &&
        (tokens[0].typ == EnumToken.WhitespaceTokenType || tokens[0].typ == EnumToken.DescendantCombinatorTokenType)) {
        tokens.shift();
    }
    return true;
}

export { consumeWhitespace };
