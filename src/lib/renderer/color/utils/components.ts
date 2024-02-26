import {ColorToken, Token} from "../../../../@types";
import {EnumToken} from "../../../ast";

export function getComponents(token: ColorToken): Token[] {

    return (<Token[]>token.chi)
        .filter((t: Token) => ![EnumToken.LiteralTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(t.typ));
}