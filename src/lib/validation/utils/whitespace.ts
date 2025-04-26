import {EnumToken} from "../../ast/index.ts";
import type {Token} from "../../../@types/token.d.ts";

export function consumeWhitespace(tokens: Token[]): boolean {

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