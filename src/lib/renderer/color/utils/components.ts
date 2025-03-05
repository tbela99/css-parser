import type {ColorToken, NumberToken, Token} from "../../../../@types/index.d.ts";
import {EnumToken} from "../../../ast/index.ts";
import {COLORS_NAMES} from "./constants.ts";
import {expandHexValue} from "../hex.ts";

export function getComponents(token: ColorToken): Token[] {

    if (token.kin == 'hex' || token.kin == 'lit') {

        const value: string = expandHexValue(token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
        // @ts-ignore
        return value.slice(1).match(/([a-fA-F0-9]{2})/g).map((t: string) => {

            return <NumberToken>{typ: EnumToken.Number, val: parseInt(t, 16).toString()}
        });
    }

    return  (<Token[]>token.chi)
        .filter((t: Token) => ![EnumToken.LiteralTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(t.typ));
}