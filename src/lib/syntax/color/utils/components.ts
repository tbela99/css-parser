import type {ColorToken, NumberToken, Token} from "../../../../@types";
import {EnumToken} from "../../../ast";
import {ColorKind, COLORS_NAMES} from "./constants.ts";
import {expandHexValue} from "../hex.ts";

export function getComponents(token: ColorToken): Token[] | null {

    if (token.kin == ColorKind.HEX || token.kin == ColorKind.LIT) {

        const value: string = expandHexValue(token.kin == ColorKind.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
        // @ts-ignore
        return value.slice(1).match(/([a-fA-F0-9]{2})/g).map((t: string) => {

            return <NumberToken>{typ: EnumToken.Number, val: parseInt(t, 16).toString()}
        });
    }

    const result: Token[] = [];

    for (const child of (token.chi) as Token[]) {

        if ([
            EnumToken.LiteralTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(child.typ)) {

            continue;
        }

        if (child.typ == EnumToken.ColorTokenType && (child as ColorToken).val.localeCompare('currentcolor', undefined, {sensitivity: 'base'}) == 0) {

            return null;
        }

        result.push(child);
    }

    return  result;
}