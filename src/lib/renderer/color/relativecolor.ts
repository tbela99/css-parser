import {AngleToken, ColorToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types";
import {COLORS_NAMES, getAngle, getNumber} from "./color";
import {EnumToken, walkValues} from "../../ast";
import {reduceNumber} from "../render";
import {hsl2hwb, rgb2hwb} from "./hwb";
import {hwb2hsl, rgb2hsl} from "./hsl";
import {hsl2rgb, hwb2rgb} from "./rgb";
import {evaluate} from "../../ast/math";

type RGBKeyType = 'r' | 'g' | 'b' | 'alpha';
type HSLKeyType = 'h' | 's' | 'l' | 'alpha';
type HWBKeyType = 'h' | 'w' | 'b' | 'alpha';

export type RelativeColorTypes = RGBKeyType | HSLKeyType | HWBKeyType;
export function parseRelativeColor(relativeKeys: RelativeColorTypes[], original: ColorToken, rExp: Token, gExp: Token, bExp: Token, aExp: Token | null): Record<RelativeColorTypes, Token> | null {

    const type: 'rgb' | 'hsl' | 'hwb' = <'rgb' | 'hsl' | 'hwb'>relativeKeys.join('');
    let r: number | Token;
    let g: number | Token;
    let b: number | Token;
    let alpha: number | Token | null = null;

    let keys: Record<RelativeColorTypes, Token> = <Record<RelativeColorTypes, Token>>{};
    let values: Record<RelativeColorTypes, number | Token | null> = <Record<RelativeColorTypes, number | Token | null>>{};
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
            alpha = value.length == 9 ? parseInt(value.slice(7, 9), 16) : null;
            break;

        case 'rgb':
        case 'rgba':

            children = (<Token[]>original.chi).filter((t: Token) => t.typ == EnumToken.NumberTokenType || t.typ == EnumToken.IdenTokenType || t.typ == EnumToken.PercentageTokenType);

            if (children.every((t: Token) => (t.typ == EnumToken.IdenTokenType && t.val == 'none') || t.typ == EnumToken.NumberTokenType)) {

                r = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : +(<NumberToken[]>children)[0].val;
                g = children[1].typ == EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : +(<NumberToken[]>children)[1].val;
                b = children[2].typ == EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : +(<NumberToken[]>children)[2].val;
                alpha = children.length < 4 ? null : children[3].typ == EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +(<NumberToken[]>children)[3].val;

            } else if (children.every((t: Token) => t.typ == EnumToken.PercentageTokenType || (t.typ == EnumToken.IdenTokenType && t.val == 'none') || (t.typ == EnumToken.NumberTokenType && t.val == '0'))) {

                // @ts-ignore
                r = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : (<NumberToken[]>children)[0].val * 255 / 100;
                // @ts-ignore
                g = children[1].typ == EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : (<NumberToken[]>children)[1].val * 255 / 100;
                // @ts-ignore
                b = children[2].typ == EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : (<NumberToken[]>children)[2].val * 255 / 100;
                alpha = children.length < 4 ? null : children[3].typ == EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +(<NumberToken[]>children)[3].val / 100;

            } else {

                return null;
            }

            break;

        case 'hsl':
        case 'hsla':
        case 'hwb':

            children = (<Token[]>original.chi).filter((t: Token) => t.typ == EnumToken.AngleTokenType || t.typ == EnumToken.NumberTokenType || t.typ == EnumToken.IdenTokenType || t.typ == EnumToken.PercentageTokenType);

            if (children.length == 3 || children.length == 4) {

                [r, g, b, alpha] = children;
            } else {

                return null;
            }

            break;

        default:
            return null;
    }

    const from: string = ['rgb', 'rgba', 'hex', 'lit'].includes(original.kin) ? 'rgb' : original.kin;

    if (from != type) {

        if (type == 'hsl' || type == 'hwb') {

            if (from == 'rgb') {

                [r, g, b] = (type == 'hwb' ? rgb2hwb : rgb2hsl)(<number>r, <number>g, <number>b);

                // @ts-ignore
                r *= 360;
                // @ts-ignore
                g *= 100;
                // @ts-ignore
                b *= 100;

                values = <Record<RelativeColorTypes, number | Token | null>>{
                    [relativeKeys[0]]: {typ: EnumToken.AngleTokenType, val: r, unit: 'deg'},
                    [relativeKeys[1]]: {typ: EnumToken.PercentageTokenType, val: g},
                    [relativeKeys[2]]: {typ: EnumToken.PercentageTokenType, val: b}
                } ;
            } else if (from == 'hwb' || from == 'hsl') {

                if (type == 'hsl') {

                    if (from == 'hwb') {

                        [r, g, b] = hwb2hsl(getAngle(<NumberToken | AngleToken | IdentToken>r), getNumber(<NumberToken | IdentToken | PercentageToken>g), getNumber(<NumberToken | IdentToken | PercentageToken>b));

                        // @ts-ignore
                        r *= 360;
                        // @ts-ignore
                        g *= 100;
                        // @ts-ignore
                        b *= 100;

                        // @ts-ignore
                        values = <Record<RelativeColorTypes, number | Token | null>>{
                            [relativeKeys[0]]: {typ: EnumToken.AngleTokenType, val: r, unit: 'deg'},
                            [relativeKeys[1]]: {typ: EnumToken.PercentageTokenType, val: g},
                            [relativeKeys[2]]: {typ: EnumToken.PercentageTokenType, val: b}
                        };
                    }
                } else if (type == 'hwb') {

                    if (from == 'hsl') {

                        [r, g, b] = hsl2hwb(getAngle(<NumberToken | AngleToken | IdentToken>r), getNumber(<NumberToken | IdentToken | PercentageToken>g), getNumber(<NumberToken | IdentToken | PercentageToken>b));

                        // @ts-ignore
                        r *= 360;
                        // @ts-ignore
                        g *= 100;
                        // @ts-ignore
                        b *= 100;

                        // @ts-ignore
                        values = <Record<RelativeColorTypes, number | Token | null>>{
                            [relativeKeys[0]]: {typ: EnumToken.AngleTokenType, val: r, unit: 'deg'},
                            [relativeKeys[1]]: {typ: EnumToken.PercentageTokenType, val: g},
                            [relativeKeys[2]]: {typ: EnumToken.PercentageTokenType, val: b}
                        };
                    }
                }
            } else {

                return null;
            }

        } else if (type == 'rgb') {

            if (from == 'hsl' || from == 'hwb') {

                [r, g, b] = (from == 'hwb' ? hwb2rgb : hsl2rgb)(original);

                // @ts-ignore
                values = <Record<RelativeColorTypes, number | Token>>{
                        [relativeKeys[0]]: {typ: EnumToken.NumberTokenType, val: r},
                        [relativeKeys[1]]: {typ: EnumToken.NumberTokenType, val: g},
                        [relativeKeys[2]]: {typ: EnumToken.NumberTokenType, val: b}
                    };

            } else {

                return null;
            }
        }
    } else {

        values = <Record<RelativeColorTypes, number | Token | null>>{
            [relativeKeys[0]]: r,
            [relativeKeys[1]]: g,
            [relativeKeys[2]]: b
        };
    }


    if (aExp != null && aExp.typ == EnumToken.IdenTokenType && aExp.val == 'none') {

        aExp = null;
    }

    keys = <Record<RelativeColorTypes, Token>>{
        [relativeKeys[0]]: rExp,
        [relativeKeys[1]]: gExp,
        [relativeKeys[2]]: bExp,
        alpha: aExp ?? {typ: EnumToken.IdenTokenType, val: 'alpha'}
    };

    for (const [key, value] of Object.entries(values)) {

        if (typeof value == 'number') {

            values[<RelativeColorTypes>key] = {typ: EnumToken.NumberTokenType, val: reduceNumber(value)};
        }
    }

    // @ts-ignore
    values.alpha = alpha != null && typeof alpha == 'object' ? alpha : <Token> (<Token>b).typ == EnumToken.PercentageTokenType ? {typ: EnumToken.PercentageTokenType, val: String(alpha ?? 100)} : {typ: EnumToken.NumberTokenType, val: String(alpha ?? 1)};
    return computeComponentValue(keys, values);
}

function computeComponentValue(expr: Record<RelativeColorTypes, Token>, values: Record<RelativeColorTypes, number | Token | null>): Record<RelativeColorTypes, Token> | null {

    for (const [key, exp] of Object.entries(expr)) {

        if (exp == null) {

            if (key in values) {

                if (typeof values[<RelativeColorTypes>key] == 'number') {

                    expr[<RelativeColorTypes>key] = {
                        typ: EnumToken.NumberTokenType,
                        val: reduceNumber(<number>values[<RelativeColorTypes>key])
                    };
                } else {

                    expr[<RelativeColorTypes>key] = <Token>values[<RelativeColorTypes>key];
                }
            }
        } else if ([EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.LengthTokenType].includes(exp.typ)) {

            // expr[<RelativeColorTypes>key] = exp;
        } else if (exp.typ == EnumToken.IdenTokenType && exp.val in values) {

            if (typeof values[<RelativeColorTypes>exp.val] == 'number') {

                expr[<RelativeColorTypes>key] = {
                    typ: EnumToken.NumberTokenType,
                    val: reduceNumber(<number>values[<RelativeColorTypes>exp.val])
                };
            } else {

                expr[<RelativeColorTypes>key] = <Token>values[<RelativeColorTypes>exp.val];
            }
        } else if (exp.typ == EnumToken.FunctionTokenType && exp.val == 'calc') {

            for (let {value, parent} of walkValues(exp.chi)) {

                if (value.typ == EnumToken.IdenTokenType) {

                    if (!(value.val in values)) {

                        return null;
                    }

                    if (parent == null) {

                        parent = exp;
                    }

                    if (parent.typ == EnumToken.BinaryExpressionTokenType) {

                        if (parent.l == value) {

                            parent.l = <Token>values[<RelativeColorTypes>value.val];
                        }

                        else {

                            parent.r = <Token>values[<RelativeColorTypes>value.val];
                        }
                    }

                    else {

                        for (let i = 0; i < parent.chi.length; i++) {

                            if (parent.chi[i] == value) {

                                parent.chi.splice(i, 1, <Token>values[<RelativeColorTypes>value.val]);
                                break;
                            }
                        }
                    }
                }
            }

            const result: Token[] = evaluate(exp.chi);

            if (result.length == 1 && result[0].typ != EnumToken.BinaryExpressionTokenType) {

                expr[<RelativeColorTypes>key] = result[0];
            }

            else {

                return null;
            }
        }
    }

    return <Record<RelativeColorTypes, Token>>expr;
}
