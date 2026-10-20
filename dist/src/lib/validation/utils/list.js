/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
<<<<<<< HEAD
	Version: 2.0.0-alpha.1
=======
	Version: 1.6.8
>>>>>>> v.next
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';

function stripCommaToken(tokenList, options) {
    let result = [];
    let typ;
    const arena = options.arena;
    for (let i = 0; i < tokenList.length; i++) {
        typ = arena.getType(tokenList[i]);
        if (typ == EnumToken.CommentTokenType || typ == EnumToken.CommaTokenType) {
            continue;
        }
        result.push(tokenList[i]);
    }
    return result;
}
function splitTokenList(tokenList, options, split = [EnumToken.CommaTokenType], includeSplitToken = false) {
    const arena = options.arena;
    return tokenList.reduce((acc, curr) => {
        if (split.includes(arena.getType(curr))) {
            if (includeSplitToken && Array.isArray(acc[acc.length - 1])) {
                acc[acc.length - 1].push(curr);
            }
            acc.push([]);
        }
        else {
            acc[acc.length - 1].push(curr);
        }
        return acc;
    }, [[]]);
}

export { splitTokenList, stripCommaToken };
