import { EnumToken } from "../../ast/types.ts";
import type { PropertyMapType, Token } from "../../../@types/index.d.ts";
import { tokensfuncSet } from "../../syntax/constants.ts";
import { isColor } from "../../syntax/syntax.ts";
import type { AstArena } from "../../ast/arena.ts";

const mathTokenTypes: EnumToken[] = [
    EnumToken.Add,
    EnumToken.Mul,
    EnumToken.Div,
    EnumToken.Sub,
    EnumToken.LiteralTokenType,
    EnumToken.CommaTokenType,
    EnumToken.WhitespaceTokenType,
    EnumToken.DimensionTokenType,
    EnumToken.NumberTokenType,
    EnumToken.LengthTokenType,
    EnumToken.AngleTokenType,
    EnumToken.PercentageTokenType,
    EnumToken.ResolutionTokenType,
    EnumToken.TimeTokenType,
    EnumToken.BinaryExpressionTokenType,
];

/**
 * check if a token matches a shorthand property type
 * @param arena
 * @param val
 * @param properties
 */
export function matchType(arena: AstArena, val: Token, properties: PropertyMapType): boolean {
    const typ: EnumToken = arena.dataTypes[val];

    if (
        (typ === EnumToken.IdenTokenType && properties.keywords.includes(arena.strings[arena.stringValue[val]])) ||
        properties.types.some(
            // @ts-expect-error
            (t: keyof EnumToken) =>
                // @ts-expect-error
                (typ === EnumToken.IdenTokenType && EnumToken[t] === EnumToken.ColorTokenType && isColor(arena, val)) ||
                // @ts-expect-error
                EnumToken[t] === typ,
        )
    ) {
        return true;
    }

    if (typ === EnumToken.NumberTokenType && arena.numericValue[val] === 0) {
        // @ts-ignore
        return properties.types.some((type: keyof EnumToken) => {
            // @ts-ignore
            const typ = EnumToken[type] as EnumToken;
            return typ == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType;
        });
    }

    if (tokensfuncSet.has(typ) && typ === EnumToken.MathFunctionTokenType) {
        for (let t = arena.firstToken[val]; t != 0; t = arena.nextSibling[t]) {
            if (!mathTokenTypes.includes(arena.dataTypes[t]) && !matchType(arena, t, properties)) {
                return false;
            }
        }

        return true;
    }

    return false;
}
