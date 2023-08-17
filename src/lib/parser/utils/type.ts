import {FunctionToken, IdentToken, PropertyMapType, Token} from "../../../@types";

export const funcList = ['clamp', 'calc'];

export function matchType(val: Token, properties: PropertyMapType): boolean {

    if (val.typ == 'Iden' && properties.keywords.includes((<IdentToken>val).val) ||
        (properties.types.includes(val.typ))) {

        return true;
    }

    if (val.typ == 'Number' && val.val == '0') {

        return properties.types.some(type => type == 'Length' || type == 'Angle')
    }

    if (val.typ == 'Func' && funcList.includes((<FunctionToken>val).val)) {

        return val.chi.every((t => ['Literal', 'Comma', 'Whitespace', 'Start-parens', 'End-parens'].includes(t.typ) || matchType(t, properties)));
    }

    return false;
}