import {EnumToken} from "../../ast/index.ts";
import type {FunctionToken, IdentToken, NumberToken, PropertyMapType, Token} from "../../../@types/index.d.ts";

import {mathFuncs} from "../../syntax/index.ts";

export function matchType(val: Token, properties: PropertyMapType): boolean {

    if (val.typ == EnumToken.IdenTokenType && properties.keywords.includes((<IdentToken>val).val) ||
        // @ts-ignore
        (properties.types.some((t: keyof EnumToken) => EnumToken[t] == val.typ))) {

        return true;
    }

    if (val.typ == EnumToken.NumberTokenType && (val as NumberToken).val == '0') {

        // @ts-ignore
        return properties.types.some((type: keyof EnumToken) => {

            // @ts-ignore
            const typ = EnumToken[type] as EnumToken;
            return typ == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType
        })
    }

    if (val.typ == EnumToken.FunctionTokenType) {

        if (mathFuncs.includes((val as FunctionToken).val)) {

            return (val as FunctionToken).chi.every(((t: Token):   boolean => [EnumToken.Add,EnumToken.Mul,EnumToken.Div,EnumToken.Sub,EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType, EnumToken.DimensionTokenType, EnumToken.NumberTokenType, EnumToken.LengthTokenType, EnumToken.AngleTokenType, EnumToken.PercentageTokenType, EnumToken.ResolutionTokenType, EnumToken.TimeTokenType, EnumToken.BinaryExpressionTokenType].includes(t.typ) || matchType(t, properties)));
        }

        // match type defined like function 'symbols()', 'url()', 'attr()' etc.
        // return properties.types.includes((<FunctionToken>val).val + '()')
    }

    return false;
}