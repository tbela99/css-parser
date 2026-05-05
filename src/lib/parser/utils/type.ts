import { EnumToken } from "../../ast/types.ts";
import type { FunctionToken, IdentToken, NumberToken, PropertyMapType, Token } from "../../../@types/index.d.ts";
import { mathFuncs, tokensfuncSet } from "../../syntax/constants.ts";
import { isColor } from "../../syntax/syntax.ts";

export function matchType(val: Token, properties: PropertyMapType): boolean {
    if (
        (val.typ === EnumToken.IdenTokenType && properties.keywords.includes((<IdentToken>val).val)) ||
        // @ts-ignore
        properties.types.some(
            (t: keyof EnumToken) =>
                (val.typ === EnumToken.IdenTokenType && EnumToken[t] === EnumToken.ColorTokenType && isColor(val)) ||
                EnumToken[t] === val.typ,
        )
    ) {
        return true;
    }

    if (val.typ === EnumToken.NumberTokenType && (val as NumberToken).val === 0) {
        // @ts-ignore
        return properties.types.some((type: keyof EnumToken) => {
            // @ts-ignore
            const typ = EnumToken[type] as EnumToken;
            return typ == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType;
        });
    }

    if (tokensfuncSet.has(val.typ) && val.typ === EnumToken.MathFunctionTokenType) {
        return (val as FunctionToken).chi.every(
            (t: Token): boolean =>
                [
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
                ].includes(t.typ) || matchType(t, properties),
        );
    }

    return false;
}
