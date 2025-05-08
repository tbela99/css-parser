import type {
    BinaryExpressionToken,
    ColorToken,
    FunctionToken,
    IdentToken,
    ParensToken,
    PercentageToken,
    Token
} from "../../../@types/index.d.ts";
import {convert, getNumber} from "./color.ts";
import {EnumToken, walkValues} from "../../ast/index.ts";
import {reduceNumber} from "../render.ts";
import {evaluate, evaluateFunc} from "../../ast/math/index.ts";
import {ColorKind, colorRange} from "./utils/index.ts";
import {mathFuncs} from "../../syntax/index.ts";

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
    const converted: ColorToken = <ColorToken>convert(original, ColorKind[relativeKeys.toUpperCase().replaceAll('-', '_') as keyof typeof ColorKind]);

    if (converted == null) {

        return null;
    }

    const children: Token[] = (<Token[]>converted.chi).filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.LiteralTokenType, EnumToken.CommentTokenType].includes(t.typ));
    [r, g, b, alpha] = converted.kin == ColorKind.COLOR ? children.slice(1) : children;

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

    return computeComponentValue(keys, converted, values);
}

function getValue(t: Token, converted: ColorToken, component: string): Token {

    if (t == null) {

        return t;
    }

    if (t.typ == EnumToken.PercentageTokenType) {

        let value: number = getNumber(<PercentageToken>t);
        let colorSpace: string = ColorKind[converted.kin].toLowerCase().replaceAll('-', '_');

        if (colorSpace in colorRange) {

            // @ts-ignore
            value *= colorRange[colorSpace as keyof typeof colorRange][component].at(-1);
        }

        return {
            typ: EnumToken.NumberTokenType,
            val: String(value)
        }
    }

    return t;
}

function computeComponentValue(expr: Record<RelativeColorTypes, Token>, converted: ColorToken, values: Record<RelativeColorTypes, number | Token | null>): Record<RelativeColorTypes, Token> | null {

    for (const object of [values, expr]) {

        if ('h' in object) {

            // normalize hue
            for (const k of walkValues([object.h as Token])) {

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

        } else if (exp.typ == EnumToken.IdenTokenType && exp.val in values) {

            if (typeof values[<RelativeColorTypes>exp.val] == 'number') {

                expr[<RelativeColorTypes>key] = {
                    typ: EnumToken.NumberTokenType,
                    val: reduceNumber(<number>values[<RelativeColorTypes>exp.val])
                };
            } else {

                expr[<RelativeColorTypes>key] = <Token>values[<RelativeColorTypes>exp.val];
            }

        } else if (exp.typ == EnumToken.FunctionTokenType && mathFuncs.includes((exp as FunctionToken).val)) {

            for (let {value, parent} of walkValues((exp as FunctionToken).chi, exp)) {

                if (parent == null) {

                    parent = exp;
                }

                if (value.typ == EnumToken.PercentageTokenType) {

                    replaceValue(parent as BinaryExpressionToken | FunctionToken | ParensToken, value, getValue(value, converted, <RelativeColorTypes>key));
                } else if (value.typ == EnumToken.IdenTokenType) {

                    // @ts-ignore
                    if (!(value.val in values || typeof Math[(value as IdentToken).val.toUpperCase()] == 'number')) {

                        return null;
                    }

                    // @ts-ignore
                    replaceValue(parent as BinaryExpressionToken | FunctionToken | ParensToken, value, values[value.val] ?? {
                        typ: EnumToken.NumberTokenType,
                        // @ts-ignore
                        val: '' + Math[(value as IdentToken).val.toUpperCase()]
                        // @ts-ignore
                    } as Token);
                }
            }

            const result: Token[] = exp.typ == EnumToken.FunctionTokenType && mathFuncs.includes((exp as FunctionToken).val) && (exp as FunctionToken).val != 'calc' ? evaluateFunc(exp as FunctionToken) : evaluate((exp as FunctionToken).chi);

            if (result.length == 1 && result[0].typ != EnumToken.BinaryExpressionTokenType) {

                expr[<RelativeColorTypes>key] = result[0];
            } else {

                return null;
            }
        }
    }

    return <Record<RelativeColorTypes, Token>>expr;
}

function replaceValue(parent: FunctionToken | ParensToken | BinaryExpressionToken, value: Token, newValue: Token) {

    for (const {value: val, parent: pr} of walkValues([parent])) {

        if (val.typ == value.typ && (val as IdentToken).val == (value as IdentToken).val) {

            if (pr!.typ == EnumToken.BinaryExpressionTokenType) {

                if ((pr as BinaryExpressionToken).l == val) {

                    (pr as BinaryExpressionToken).l = newValue
                } else {

                    (pr as BinaryExpressionToken).r = newValue;
                }
            } else {

                (pr as FunctionToken | ParensToken).chi.splice((pr as FunctionToken | ParensToken).chi.indexOf(val), 1, newValue);
            }
        }
    }
}