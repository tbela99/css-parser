/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.2.0
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';

/**
 * split a token list
 * @param arena
 * @param tokenList
 * @param split
 * @param includeSplitToken
 */
function splitTokenList(arena, tokenList, split = [EnumToken.CommaTokenType], includeSplitToken = false) {
    const result = [[]];
    for (let i = 0; i < tokenList.length; i++) {
        const curr = tokenList[i];
        if (split.includes(arena.dataTypes[curr])) {
            if (includeSplitToken) {
                result[result.length - 1].push(curr);
            }
            result.push([]);
        }
        else {
            result[result.length - 1].push(curr);
        }
    }
    return result;
}

export { splitTokenList };
