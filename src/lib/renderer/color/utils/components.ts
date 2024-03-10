import {ColorToken, NumberToken, Token} from "../../../../@types";
import {EnumToken} from "../../../ast";
import {getLABComponents} from "../lab";
import {COLORS_NAMES} from "./constants";
import {expandHexValue} from "../hex";

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