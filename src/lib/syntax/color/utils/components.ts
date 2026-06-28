import type { ColorToken, FunctionToken, IdentToken, NumberToken, Token } from "../../../../@types/index.d.ts";
import { ColorType, EnumToken } from "../../../ast/types.ts";
import { walkValues } from "../../../ast/walk.ts";
import { COLORS_NAMES } from "../../constants.ts";
import { expandHexValue } from "../hex.ts";
import { isColor, parseColor } from "../../syntax.ts";
import { equalsIgnoreCase } from "../../../parser/utils/text.ts";

export function getComponents(token: ColorToken | IdentToken): Token[] | null {
    if (token.typ === EnumToken.IdenTokenType) {
        if (isColor(token)) {
            parseColor(token);
        } else {
            return null;
        }
    }

    if ((token as ColorToken).kin == ColorType.HEX || (token as ColorToken).kin == ColorType.LIT) {
        const value: string = expandHexValue(
            (token as ColorToken).kin == ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val,
        );
        // @ts-ignore
        return value
            .slice(1)
            .match(/([a-fA-F0-9]{2})/g)
            .map((t: string, index: number) => {
                return <NumberToken>{ typ: EnumToken.Number, val: index < 3 ? parseInt(t, 16) : parseInt(t, 16) / 255 };
            });
    }

    const result: Token[] = [];

    for (const child of (token as ColorToken).chi as Token[]) {
        if (
            [
                EnumToken.LiteralTokenType,
                EnumToken.CommentTokenType,
                EnumToken.CommaTokenType,
                EnumToken.WhitespaceTokenType,
            ].includes(child.typ)
        ) {
            continue;
        }

        if (child.typ === EnumToken.IdenTokenType && isColor(child)) {
            parseColor(child);
        }

        if (child.typ === EnumToken.FunctionTokenType || 
            child.typ === EnumToken.WildCardFunctionTokenType ||
            child.typ === EnumToken.MathFunctionTokenType) {
            if ("var" == (child as FunctionToken).val.toLowerCase()) {
                return null;
            } else {
                for (const { value } of walkValues((child as FunctionToken).chi)) {
                    if (
                        value.typ == EnumToken.WildCardFunctionTokenDefType &&
                        "var" === (value as FunctionToken).val.toLowerCase()
                    ) {
                        return null;
                    }
                }
            }
        }

        if (child.typ == EnumToken.ColorTokenType && equalsIgnoreCase("currentcolor",(child as ColorToken).val)) {
            return null;
        }

        result.push(child);
    }

    return result;
}
