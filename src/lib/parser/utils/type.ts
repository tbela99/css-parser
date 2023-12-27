import {EnumToken} from "../../ast";
import {IdentToken, PropertyMapType, Token} from "../../../@types";

// https://www.w3.org/TR/css-values-4/#math-function
export const funcList = ['clamp', 'calc'];

export function matchType(val: Token, properties: PropertyMapType): boolean {

    if (val.typ == EnumToken.IdenTokenType && properties.keywords.includes((<IdentToken>val).val) ||
        // @ts-ignore
        (properties.types.some((t: keyof EnumToken) => EnumToken[t] == val.typ))) {

        return true;
    }

    if (val.typ == EnumToken.NumberTokenType && val.val == '0') {

        // @ts-ignore
        return properties.types.some((type: keyof EnumToken) => {

            // @ts-ignore
            const typ = EnumToken[type];
           return typ  == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType
        })
    }

    if (val.typ == EnumToken.FunctionTokenType && funcList.includes(val.val)) {

        return val.chi.every((t => [EnumToken.LiteralTokenType, EnumToken.CommaTokenType,EnumToken.WhitespaceTokenType, EnumToken.StartParensTokenType, EnumToken.EndParensTokenType].includes(t.typ) || matchType(t, properties)));
    }

    return false;
}