import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function splitTokenList(tokenList, split = [EnumToken.CommaTokenType]) {
    return tokenList.reduce((acc, curr) => {
        if (curr.typ == EnumToken.CommentTokenType) {
            return acc;
        }
        if (split.includes(curr.typ)) {
            acc.push([]);
        }
        else {
            acc[acc.length - 1].push(curr);
        }
        return acc;
    }, [[]]);
}

export { splitTokenList };
