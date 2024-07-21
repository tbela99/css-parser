import {EnumToken} from "../../ast";
import type {IdentToken, PropertyMapType, Token} from "../../../@types/index.d.ts";

// https://www.w3.org/TR/css-values-4/#math-function
export const funcList: string[] = ['clamp', 'calc'];

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
            return typ == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType
        })
    }

    if (val.typ == EnumToken.FunctionTokenType) {

        if (funcList.includes(val.val)) {
            return val.chi.every(((t: Token) => [EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType, EnumToken.StartParensTokenType, EnumToken.EndParensTokenType].includes(t.typ) || matchType(t, properties)));
        }

        // match type defined like function 'symbols()', 'url()', 'attr()' etc.
        // return properties.types.includes((<FunctionToken>val).val + '()')
    }

    return false;
}