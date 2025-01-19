import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function splitTokenList(tokenList) {
    return tokenList.reduce((acc, curr) => {
        if (curr.typ == EnumToken.CommentTokenType) {
            return acc;
        }
        if (curr.typ == EnumToken.CommaTokenType) {
            acc.push([]);
        }
        else {
            acc[acc.length - 1].push(curr);
        }
        return acc;
    }, [[]]);
}

export { splitTokenList };
