import { EnumToken } from '../../ast/types.js';

function stripCommaToken(tokenList) {
    let result = [];
    for (let i = 0; i < tokenList.length; i++) {
        if (tokenList[i].typ == EnumToken.CommentTokenType || tokenList[i].typ == EnumToken.CommaTokenType) {
            continue;
        }
        result.push(tokenList[i]);
    }
    return result;
}
function splitTokenList(tokenList, split = [EnumToken.CommaTokenType], includeSplitToken = false) {
    return tokenList.reduce((acc, curr) => {
        if (split.includes(curr.typ)) {
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
