import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

function stripCommaToken(tokenList) {
    let result = [];
    for (let i = 0; i < tokenList.length; i++) {
        // if (tokenList[i].typ == EnumToken.CommaTokenType && last != null && last.typ == EnumToken.CommaTokenType) {
        //
        //     return null;
        // }
        if (tokenList[i].typ != EnumToken.WhitespaceTokenType) {
            tokenList[i];
        }
        if (tokenList[i].typ == EnumToken.CommentTokenType || tokenList[i].typ == EnumToken.CommaTokenType) {
            continue;
        }
        result.push(tokenList[i]);
    }
    return result;
}
function splitTokenList(tokenList, split = [EnumToken.CommaTokenType]) {
    return tokenList.reduce((acc, curr) => {
        // if (curr.typ == EnumToken.CommentTokenType) {
        //
        //     return acc;
        // }
        if (split.includes(curr.typ)) {
            acc.push([]);
        }
        else {
            acc[acc.length - 1].push(curr);
        }
        return acc;
    }, [[]]);
}

export { splitTokenList, stripCommaToken };
