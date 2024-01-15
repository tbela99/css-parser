import {AngleToken, ColorToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types";
import {COLORS_NAMES, getAngle, getNumber, hsl2rgb, rgb2hsl} from "./color";
import {EnumToken} from "../../ast";
import {reduceNumber} from "../render";

type RGBKeyType = 'r' | 'g' | 'b' | 'a';

export type RelativeColorTypes = RGBKeyType;

export function parseRelativeColor(relativeKeys: RGBKeyType[], original: ColorToken, rExp: Token, gExp: Token, bExp: Token, aExp: Token): Record<RGBKeyType, Token> | null {

    const type = <'rgb' | 'hsl' | 'hwb'>relativeKeys.join('');
    let r: number | Token;
    let g: number | Token;
    let b: number | Token;
    let a: number | Token | null = null;

    let keys: Record<RGBKeyType, Token> = <Record<RGBKeyType, Token>>{};
    let values: Record<RGBKeyType, number | Token | null> = <Record<RGBKeyType, number | Token | null>>{};
    let children: Token[];

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

            // console.debug({
            //     r: value.slice(1, 3),
            //     g: value.slice(3, 5),
            //     b: value.slice(5, 7),
            //     a
            // })

            break;

        case 'rgb':
        case 'rgba':

             children = (<Token[]>original.chi).filter((t: Token) => t.typ == EnumToken.NumberTokenType || t.typ == EnumToken.IdenTokenType || t.typ == EnumToken.PercentageTokenType);

            if (children.every((t: Token) => (t.typ == EnumToken.IdenTokenType && t.val == 'none') || t.typ == EnumToken.NumberTokenType)) {

                r = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : +(<NumberToken[]>children)[0].val;
                g = children[1].typ == EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : +(<NumberToken[]>children)[1].val;
                b = children[2].typ == EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : +(<NumberToken[]>children)[2].val;
                a = children.length < 4 ? null : children[3].typ == EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +(<NumberToken[]>children)[3].val;

            } else if (children.every((t: Token) => t.typ == EnumToken.PercentageTokenType || (t.typ == EnumToken.IdenTokenType && t.val == 'none') || (t.typ == EnumToken.NumberTokenType && t.val == '0'))) {

                // @ts-ignore
                r = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : (<NumberToken[]>children)[0].val * 255 / 100;
                // @ts-ignore
                g = children[1].typ == EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : (<NumberToken[]>children)[1].val * 255 / 100;
                // @ts-ignore
                b = children[2].typ == EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : (<NumberToken[]>children)[2].val * 255 / 100;
                a = children.length < 4 ? null : children[3].typ == EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +(<NumberToken[]>children)[3].val / 100;

            } else {

                return null;
            }

            break;

        case 'hsl':
        case 'hsla':

             children = (<Token[]>original.chi).filter((t: Token) => t.typ == EnumToken.AngleTokenType || t.typ == EnumToken.NumberTokenType || t.typ == EnumToken.IdenTokenType || t.typ == EnumToken.PercentageTokenType);

            if (children.length == 3 || children.length == 4) {

                [r, g, b, a] = children;
            }

            else {

                return null;
            }

            break;

        default:
            return null;
    }

    const from: string = ['rgb', 'rgba', 'hex', 'lit'].includes(original.kin) ? 'rgb' : original.kin;

    if (from != type) {

        if (type == 'hsl' ) {

            if (from == 'rgb') {

                [r, g, b] = rgb2hsl(<number>r, <number>g, <number>b);

                r *= 360;
                g *= 100;
                b *= 100;

                values = <Record<RGBKeyType, number | Token | null>>(a == null ? {
                    [relativeKeys[0]]: {typ: EnumToken.AngleTokenType, val: r, unit: 'deg'},
                    [relativeKeys[1]]: {typ: EnumToken.PercentageTokenType, val: g},
                    [relativeKeys[2]]: {typ: EnumToken.PercentageTokenType, val: b}
                } : {
                    [relativeKeys[0]]: {typ: EnumToken.AngleTokenType, val: r, unit: 'deg'},
                    [relativeKeys[1]]: {typ: EnumToken.PercentageTokenType, val: g},
                    [relativeKeys[2]]: {typ: EnumToken.PercentageTokenType, val: b},
                    a
                });
            }

            else {

                return null;
            }
        }

        else if (type == 'rgb') {

            if (from == 'hsl') {

                console.debug({r, g, b});

                [r, g, b] = hsl2rgb(getAngle(<NumberToken | AngleToken | IdentToken>r), getNumber(<NumberToken | IdentToken | PercentageToken>g), getNumber(<NumberToken | IdentToken | PercentageToken>b));

                console.debug({r, g, b});


                values = <Record<RGBKeyType, number | Token | null>>(a == null ? {
                    [relativeKeys[0]]: {typ: EnumToken.NumberTokenType, val: r},
                    [relativeKeys[1]]: {typ: EnumToken.NumberTokenType, val: g},
                    [relativeKeys[2]]: {typ: EnumToken.NumberTokenType, val: b}
                } : {
                    [relativeKeys[0]]: {typ: EnumToken.NumberTokenType, val: r},
                    [relativeKeys[1]]: {typ: EnumToken.NumberTokenType, val: g},
                    [relativeKeys[2]]: {typ: EnumToken.NumberTokenType, val: b},
                    a
                });
            }

            else {

                return null;
            }
        }
    }

    else {

        values = <Record<RGBKeyType, number | Token | null>>(a == null ? {
            [relativeKeys[0]]: r,
            [relativeKeys[1]]: g,
            [relativeKeys[2]]: b
        } : {
            [relativeKeys[0]]: r,
            [relativeKeys[1]]: g,
            [relativeKeys[2]]: b,
            a
        });
    }

    keys = <Record<RGBKeyType, Token>>(a == null ? {
        [relativeKeys[0]]: rExp,
        [relativeKeys[1]]: gExp,
        [relativeKeys[2]]: bExp
    } : {
        [relativeKeys[0]]: rExp,
        [relativeKeys[1]]: gExp,
        [relativeKeys[2]]: bExp,
        a: aExp
    });

    // console.debug({keys, values});

    return computeComponentValue(keys, values);
}


function computeComponentValue(expr: Record<RGBKeyType, Token>, values: Record<RGBKeyType, number | Token | null>): Record<RGBKeyType, Token> {

    for (const [key, exp] of Object.entries(expr)) {

        if (exp == null) {

            if (key in values) {

                if (typeof values[<RGBKeyType>key] == 'number') {

                    expr[<RGBKeyType>key] = {
                        typ: EnumToken.NumberTokenType,
                        val: reduceNumber(<number>values[<RGBKeyType>key])
                    };
                }

                else {

                    expr[<RGBKeyType>key] = <Token>values[<RGBKeyType>key];
                }
            }
        }

        else if ([EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.LengthTokenType].includes(exp.typ)) {

            // expr[<RGBKeyType>key] = exp;
        } else if (exp.typ == EnumToken.IdenTokenType && exp.val in values) {

            if (typeof values[<RGBKeyType>exp.val] == 'number') {

                expr[<RGBKeyType>key] = {
                    typ: EnumToken.NumberTokenType,
                    val: reduceNumber(<number>values[<RGBKeyType>exp.val])
                };
            } else {

                expr[<RGBKeyType>key] = <Token>values[<RGBKeyType>exp.val];
            }
        }
    }

    return <Record<RGBKeyType, Token>>expr;
}
