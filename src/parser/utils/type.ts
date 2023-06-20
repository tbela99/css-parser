import {IdentToken, PropertyMapType, Token} from "../../@types";

export function matchType(val: Token, properties: PropertyMapType) {

    if (val.typ == 'Iden' && properties.keywords.includes((<IdentToken>val).val) ||
        (properties.types.includes(val.typ))) {

        return true;
    }

    if (val.typ == 'Number' && val.val == '0') {

        return properties.types.some(type => type == 'Length' || type == 'Angle')
    }

    return false;
}