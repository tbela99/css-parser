import {ColorToken, NumberToken, Token} from "../../../@types";
import {COLORS_NAMES} from "./color";
import {EnumToken} from "../../ast";
import {reduceNumber} from "../render";

type RGBKeyType = 'r' | 'g' | 'b' | 'a';

export function parseRelativeColor(original: ColorToken, rExp: Token, gExp: Token, bExp: Token, aExp: Token): Record<RGBKeyType, Token> | null {

    let r: number;
    let g: number;
    let b: number;
    let a: number | null = null;

    let keys: Record<RGBKeyType, Token> = <Record<RGBKeyType, Token>>{};
    let values: Record<RGBKeyType, number | Token | null> = <Record<RGBKeyType, number | Token | null>>{};

    console.debug(original);

    switch (original.kin) {

        case 'lit':
        case 'hex':

            let value: string = original.val.toLowerCase();

            if (original.kin == 'lit') {

                if (original.val.toLowerCase() in COLORS_NAMES) {

                    value = COLORS_NAMES[original.val.toLowerCase()];
                } else {

                    return null;
                }
            }

            if (value.length == 4) {

                value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
            } else if (value.length == 5) {

                value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3] + value[4] + value[4];
            }

            r = parseInt(value.slice(1, 3), 16);
            g = parseInt(value.slice(3, 5), 16);
            b = parseInt(value.slice(5, 7), 16);
            a = value.length == 9 ? parseInt(value.slice(7, 9), 16) : null;

            keys = <Record<RGBKeyType, Token>>(a == null ? {r: rExp, g: gExp, b: bExp} : {
                r: rExp,
                g: gExp,
                b: bExp,
                a: aExp
            });
            values = <Record<RGBKeyType, number | Token | null>>(a == null ? {r, g, b} : {r, g, b, a});

            break;

        case 'rgb':
        case 'rgba':

            const children: Token[] = <Token[]>original.chi;

            if (children.every((t: Token) => (t.typ == EnumToken.IdenTokenType && t.val == 'none') || t.typ == EnumToken.NumberTokenType)) {

                r = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : +(<NumberToken[]>children)[0].val;
                g = children[1].typ == EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : +(<NumberToken[]>children)[1].val;
                b = children[2].typ == EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : +(<NumberToken[]>children)[2].val;
                a = children.length < 4 ? null : children[3].typ == EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +(<NumberToken[]>children)[3].val;

                keys = <Record<RGBKeyType, Token>>(a == null ? {r: rExp, g: gExp, b: bExp} : {
                    r: rExp,
                    g: gExp,
                    b: bExp,
                    a: aExp
                });
                values = <Record<RGBKeyType, number | Token | null>>(a == null ? {r, g, b} : {r, g, b, a});
            } else {

                return null;
            }

            break;

        default:
            return null;
    }

    return computeComponentValue(keys, values);
}


function computeComponentValue(expr: Record<RGBKeyType, Token>, values: Record<RGBKeyType, number | Token | null>): Record<RGBKeyType, Token> {

    for (const [key, exp] of Object.entries(expr)) {

        // if (exp == null) {
        //
        //     continue;
        // }

        if ([EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.LengthTokenType].includes(exp.typ)) {

            // expr[<RGBKeyType>key] = exp;
        } else if (exp.typ == EnumToken.IdenTokenType && exp.val in values) {

            if (typeof values[<RGBKeyType>exp.val] == 'number') {

                expr[<RGBKeyType>exp.val] = {
                    typ: EnumToken.NumberTokenType,
                    val: reduceNumber(<number>values[<RGBKeyType>exp.val])
                };
            }
        }
    }

    return <Record<RGBKeyType, Token>>expr;
}
