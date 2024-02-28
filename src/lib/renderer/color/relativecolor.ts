import {ColorToken, Token} from "../../../@types";
import {convert} from "./color";
import {EnumToken, walkValues} from "../../ast";
import {reduceNumber} from "../render";
import {evaluate} from "../../ast/math";
import {eq} from "../../parser/utils/eq";

type RGBKeyType = 'r' | 'g' | 'b' | 'alpha';
type HSLKeyType = 'h' | 's' | 'l' | 'alpha';
type HWBKeyType = 'h' | 'w' | 'b' | 'alpha';
type LABKeyType = 'l' | 'a' | 'b' | 'alpha';
type OKLABKeyType = 'l' | 'a' | 'b' | 'alpha';
type LCHKeyType = 'l' | 'c' | 'h' | 'alpha';
type OKLCHKeyType = 'l' | 'c' | 'h' | 'alpha';

export type RelativeColorTypes =
    RGBKeyType
    | HSLKeyType
    | HWBKeyType
    | LABKeyType
    | OKLABKeyType
    | LCHKeyType
    | OKLCHKeyType;

export function parseRelativeColor(relativeKeys: string, original: ColorToken, rExp: Token, gExp: Token, bExp: Token, aExp: Token | null): Record<RelativeColorTypes, Token> | null {

    let r: number | Token;
    let g: number | Token;
    let b: number | Token;
    let alpha: number | Token | null = null;

    let keys: Record<RelativeColorTypes, Token> = <Record<RelativeColorTypes, Token>>{};
    let values: Record<RelativeColorTypes, number | Token | null> = <Record<RelativeColorTypes, number | Token | null>>{};

    const converted: ColorToken = <ColorToken>convert(original, relativeKeys);

    if (converted == null) {

        return null;
    }

    [r, g, b, alpha] = <Token[]>converted.chi;

    values = <Record<RelativeColorTypes, number | Token | null>>{
        [relativeKeys[0]]: r,
        [relativeKeys[1]]: g,
        [relativeKeys[2]]: b,
        // @ts-ignore
        alpha: alpha == null || eq(alpha, {
            typ: EnumToken.IdenTokenType,
            val: 'none'
        }) ? {typ: EnumToken.NumberTokenType, val: '1'} : alpha
    };

    keys = <Record<RelativeColorTypes, Token>>{
        [relativeKeys[0]]: rExp,
        [relativeKeys[1]]: gExp,
        [relativeKeys[2]]: bExp,
        // @ts-ignore
        alpha: aExp == null || eq(aExp, {typ: EnumToken.IdenTokenType, val: 'none'}) ? {
            typ: EnumToken.NumberTokenType,
            val: '1'
        } : aExp
    };

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
