import type {ColorToken, NumberToken, Token} from "../../../../@types/index.d.ts";
import {ColorType, EnumToken, walkValues} from "../../../ast/index.ts";
import {COLORS_NAMES} from "./constants.ts";
import {expandHexValue} from "../hex.ts";

export function getComponents(token: ColorToken): Token[] | null {

    if (token.kin == ColorType.HEX || token.kin == ColorType.LIT) {

        const value: string = expandHexValue(token.kin == ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
        // @ts-ignore
        return value.slice(1).match(/([a-fA-F0-9]{2})/g).map((t: string, index: number) => {

            return <NumberToken>{typ: EnumToken.Number, val: index < 3 ? parseInt(t, 16) : parseInt(t, 16) / 255}
        });
    }

    const result: Token[] = [];

    for (const child of (token.chi) as Token[]) {

        if ([
            EnumToken.LiteralTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(child.typ)) {

            continue;
        }

        if (child.typ == EnumToken.FunctionTokenType) {

            if ('var' == child.val.toLowerCase()) {

                return null;
            } else {

                for (const {value} of walkValues(child.chi)) {

                    if (value.typ == EnumToken.FunctionTokenType && 'var' === value.val.toLowerCase()) {

                        return null;
                    }
                }
            }
        }

        if (child.typ == EnumToken.ColorTokenType && 'currentcolor' === (child as ColorToken).val.toLowerCase()) {

            return null;
        }

        result.push(child);
    }

    return result;
}