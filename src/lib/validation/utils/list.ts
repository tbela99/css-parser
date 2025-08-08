import {EnumToken} from "../../ast/index.ts";
import type {Token} from "../../../@types/index.d.ts";

export function stripCommaToken(tokenList: Token[]): Token[] | null {

    let result: Token[] = [];
    let last: Token | null = null;

    for (let i = 0; i < tokenList.length; i++) {

        if (tokenList[i].typ != EnumToken.WhitespaceTokenType) {

            last = tokenList[i];
        }

        if (tokenList[i].typ == EnumToken.CommentTokenType || tokenList[i].typ == EnumToken.CommaTokenType) {

            continue;
        }

        result.push(tokenList[i]);
    }

    return result;
}

export function splitTokenList(tokenList: Token[], split: EnumToken[] = [EnumToken.CommaTokenType]): Token[][] {

    return tokenList.reduce((acc: Token[][], curr: Token): Token[][] => {

        if (split.includes(curr.typ)) {

            acc.push([]);
        } else {

            acc[acc.length - 1].push(curr);
        }

        return acc;

    }, [[]] as Token[][]);
}