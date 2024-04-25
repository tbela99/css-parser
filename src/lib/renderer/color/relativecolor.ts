import {ColorToken, PercentageToken, Token} from "../../../@types";
import {convert, getNumber} from "./color";
import {EnumToken, walkValues} from "../../ast";
import {reduceNumber} from "../render";
import {evaluate} from "../../ast/math";
import {eq} from "../../parser/utils/eq";
import {colorRange} from "./utils";

type RGBKeyType = 'r' | 'g' | 'b' | 'alpha';
type HSLKeyType = 'h' | 's' | 'l' | 'alpha';
type HWBKeyType = 'h' | 'w' | 'b' | 'alpha';
type LABKeyType = 'l' | 'a' | 'b' | 'alpha';
type OKLABKeyType = 'l' | 'a' | 'b' | 'alpha';
type XYZKeyType = 'x' | 'y' | 'z' | 'alpha';
type LCHKeyType = 'l' | 'c' | 'h' | 'alpha';
type OKLCHKeyType = 'l' | 'c' | 'h' | 'alpha';

export type RelativeColorTypes =
    RGBKeyType
    | HSLKeyType
    | HWBKeyType
    | LABKeyType
    | OKLABKeyType
    | LCHKeyType
    | OKLCHKeyType
    | XYZKeyType;

export function parseRelativeColor(relativeKeys: string, original: ColorToken, rExp: Token, gExp: Token, bExp: Token, aExp: Token | null): Record<RelativeColorTypes, Token> | null {

    let r: number | Token;
    let g: number | Token;
    let b: number | Token;
    let alpha: number | Token | null = null;

    let keys: Record<RelativeColorTypes, Token> = <Record<RelativeColorTypes, Token>>{};
    let values: Record<RelativeColorTypes, number | Token | null> = <Record<RelativeColorTypes, number | Token | null>>{};

    // colorFuncColorSpace x,y,z or r,g,b
    const names: string = relativeKeys.startsWith('xyz') ? 'xyz' : relativeKeys.slice(-3);
    // @ts-ignore
    const converted: ColorToken = <ColorToken>convert(original, relativeKeys);

    if (converted == null) {

        return null;
    }

    const children: Token[] = (<Token[]>converted.chi).filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.LiteralTokenType, EnumToken.CommentTokenType].includes(t.typ));
    [r, g, b, alpha] = converted.kin == 'color' ? children.slice(1) : children;

    values = <Record<RelativeColorTypes, number | Token | null>>{
        [names[0]]: getValue(r, converted, names[0]),
        [names[1]]: getValue(g, converted, names[1]), // string,
        [names[2]]: getValue(b, converted, names[2]),
        // @ts-ignore
        alpha: alpha == null || (alpha.typ == EnumToken.IdenTokenType && alpha.val == 'none') ? {
            typ: EnumToken.NumberTokenType,
            val: '1'
        } : (alpha.typ == EnumToken.PercentageTokenType ? {
            typ: EnumToken.NumberTokenType,
            val: String(getNumber(<PercentageToken>alpha))
        } : alpha)
    };

    keys = <Record<RelativeColorTypes, Token>>{
        [names[0]]: getValue(rExp, converted, names[0]),
        [names[1]]: getValue(gExp, converted, names[1]),
        [names[2]]: getValue(bExp, converted, names[2]),
        // @ts-ignore
        alpha: getValue(aExp == null || (aExp.typ == EnumToken.IdenTokenType && aExp.val == 'none') ? {
            typ: EnumToken.NumberTokenType,
            val: '1'
        } : aExp)
    };

    return computeComponentValue(keys, values);
}

function getValue(t: Token, converted: ColorToken, component: string): Token {

    if (t == null) {

        return t;
    }

    if (t.typ == EnumToken.PercentageTokenType) {

        let value: number = getNumber(<PercentageToken>t);

        if (converted.kin in colorRange) {

            // @ts-ignore
            value *= colorRange[<string>converted.kin][component].at(-1);
        }

        return {
            typ: EnumToken.NumberTokenType,
            val: String(value)
        }
    }

    return t;
}

function computeComponentValue(expr: Record<RelativeColorTypes, Token>, values: Record<RelativeColorTypes, number | Token | null>): Record<RelativeColorTypes, Token> | null {

    for (const object of [values, expr]) {

        if ('h' in object) {

            // normalize hue
            // @ts-ignore
            for (const k of walkValues([object.h])) {

                if (k.value.typ == EnumToken.AngleTokenType && k.value.unit == 'deg') {

                    // @ts-ignore
                    k.value.typ = EnumToken.NumberTokenType;
                    // @ts-ignore
                    delete k.value.unit;
                }
            }
        }
    }

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
                        } else {

                            parent.r = <Token>values[<RelativeColorTypes>value.val];
                        }
                    } else {

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
            } else {

                return null;
            }
        }
    }

    return <Record<RelativeColorTypes, Token>>expr;
}
