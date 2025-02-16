import {EnumToken} from "../../ast";
import type {Token} from "../../../@types";

export function splitTokenList(tokenList: Token[], split: EnumToken[] = [EnumToken.CommaTokenType]): Token[][] {

    return tokenList.reduce((acc: Token[][], curr: Token): Token[][] => {

        if (curr.typ == EnumToken.CommentTokenType) {

            return acc;
        }

        if (split.includes(curr.typ)) {

            acc.push([]);
        } else {

            acc[acc.length - 1].push(curr);
        }

        return acc;

    }, [[]] as Token[][]);
}