import type {
    AngleToken,
    BinaryExpressionNode,
    BinaryExpressionToken,
    DimensionToken,
    FractionToken,
    FrequencyToken,
    FunctionToken,
    IdentToken,
    LengthToken,
    LiteralToken,
    NumberToken,
    ParensToken,
    ResolutionToken,
    TimeToken,
    Token
} from "../../../@types/index.d.ts";
import {EnumToken} from "../types.ts";
import {compute, rem} from "./math.ts";

import {mathFuncs} from "../../syntax/index.ts";

/**
 * evaluate an array of tokens
 * @param tokens
 */
export function evaluate(tokens: Token[]): Token[] {

    let nodes: Token[];

    if (tokens.length == 1 && tokens[0].typ == EnumToken.FunctionTokenType && (<FunctionToken>tokens[0]).val != 'calc' && mathFuncs.includes((<FunctionToken>tokens[0]).val)) {

        const chi: Token[][] = (tokens[0] as FunctionToken).chi.reduce((acc: Token[][], t: Token): Token[][] => {

            if (acc.length == 0 || t.typ == EnumToken.CommaTokenType) {

                acc.push([]);
            }

            if ([EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.CommaTokenType].includes(t.typ)) {

                return acc;
            }

            acc.at(-1)!.push(t);
            return acc;
        }, [] as Token[][]);

        for (let i = 0; i < chi.length; i++) {

            chi[i] = evaluate(chi[i]);
        }

        (tokens[0] as FunctionToken).chi = chi.reduce((acc: Token[], t: Token[]): Token[] => {

            if (acc.length > 0) {

                acc.push({typ: EnumToken.CommaTokenType});
            }

            acc.push(...t);

            return acc;
        });

        return evaluateFunc(tokens[0] as FunctionToken);
    }

    nodes = inlineExpression(evaluateExpression(buildExpression(tokens)));

    if (nodes.length <= 1) {

        if (nodes.length == 1) {

            if (nodes[0].typ == EnumToken.BinaryExpressionTokenType) {

                return inlineExpression(nodes[0]);
            }

            // @ts-ignore
            if (nodes[0].typ == EnumToken.IdenTokenType && typeof Math[(<IdentToken>nodes[0]).val.toUpperCase()] == 'number') {

                return [{
                    ...nodes[0],
                    // @ts-ignore
                    val: Math[(<IdentToken>nodes[0]).val.toUpperCase()] as number,
                    typ: EnumToken.NumberTokenType
                }];
            }
        }

        return nodes;
    }

    const map: Map<EnumToken, Token[]> = new Map;
    let token: Token;
    let i: number;

    for (i = 0; i < nodes.length; i++) {

        token = nodes[i];

        if (token.typ == EnumToken.Add) {

            continue;
        }

        if (token.typ == EnumToken.Sub) {

            if (!isScalarToken(<Token>nodes[i + 1])) {

                token = {typ: EnumToken.ListToken, chi: [nodes[i], nodes[i + 1]]};
            } else {

                token = doEvaluate(<Token>nodes[i + 1], {typ: EnumToken.NumberTokenType, val: -1}, EnumToken.Mul);
            }

            i++;
        }

        if (!map.has(token.typ)) {

            map.set(token.typ, [token]);
        } else {

            (<Token[]>map.get(token.typ)).push(token);
        }
    }

    return [...map].reduce((acc: Token[], curr: [EnumToken, Token[]]) => {

        const token: Token = curr[1].reduce((acc, curr) => doEvaluate(acc, curr, EnumToken.Add));

        if (token.typ != EnumToken.BinaryExpressionTokenType) {

            if ('val' in token && +token.val < 0) {

                acc.push({typ: EnumToken.Sub}, {...token, val: -token.val} as Token);
                return acc;
            }
        }

        if (acc.length > 0 && curr[0] != EnumToken.ListToken) {

            acc.push({typ: EnumToken.Add});
        }

        acc.push(token);

        return acc;
    }, <Token[]>[]);
}

/**
 * evaluate arithmetic operation
 * @param l
 * @param r
 * @param op
 */
function doEvaluate(l: Token, r: Token, op: EnumToken.Add | EnumToken.Sub | EnumToken.Div | EnumToken.Mul): Token {

    const defaultReturn: BinaryExpressionToken = <BinaryExpressionToken>{
        typ: EnumToken.BinaryExpressionTokenType,
        op,
        l,
        r
    };

    if (!isScalarToken(l) || !isScalarToken(r) || (l.typ == r.typ && 'unit' in l && 'unit' in r && l.unit != r.unit)) {

        return defaultReturn;
    }

    if (r.typ == EnumToken.FunctionTokenType) {

        const val = evaluateFunc(r as FunctionToken);

        if (val.length == 1) {

            r = val[0];
        }
    }

    if ((op == EnumToken.Add || op == EnumToken.Sub)) {

        // @ts-ignore
        if (l.typ != r.typ) {

            return defaultReturn;
        }
    }

    let typ: EnumToken = l.typ == EnumToken.NumberTokenType ? r.typ : (r.typ == EnumToken.NumberTokenType ? l.typ : (l.typ == EnumToken.PercentageTokenType ? r.typ : l.typ));

    // @ts-ignore
    let v1: number | Token | null = l.val?.typ == EnumToken.FractionTokenType ? l.val : getValue(l);
    // @ts-ignore
    let v2: number | Token | null = r.val?.typ == EnumToken.FractionTokenType ? r.val : getValue(r as NumberToken | IdentToken | FunctionToken);

    if (op == EnumToken.Mul) {

        if (l.typ != EnumToken.NumberTokenType && r.typ != EnumToken.NumberTokenType) {

            if (typeof v1 == 'number' && l.typ == EnumToken.PercentageTokenType) {

                v1 = {
                    typ: EnumToken.FractionTokenType,
                    l: {typ: EnumToken.NumberTokenType, val: v1},
                    r: {typ: EnumToken.NumberTokenType, val: 100}
                };
            } else if (typeof v2 == 'number' && r.typ == EnumToken.PercentageTokenType) {

                v2 = {
                    typ: EnumToken.FractionTokenType,
                    l: {typ: EnumToken.NumberTokenType, val: v2},
                    r: {typ: EnumToken.NumberTokenType, val: 100}
                };
            }
        }
    }

    // @ts-ignore
    const val: number | FractionToken = compute(v1, v2, op);

    const token = {
        ...(l.typ == EnumToken.NumberTokenType ? r : l),
        typ,
        val /* : typeof val == 'number' ? minifyNumber(val) : val */
    } as Token;

    if (token.typ == EnumToken.IdenTokenType) {

        // @ts-ignore
        token.typ = EnumToken.NumberTokenType;
    }

    return token;
}

function getValue(t: NumberToken | IdentToken | FunctionToken): number | null {

    if (t.typ == EnumToken.IdenTokenType) {

        // @ts-ignore
        return Math[(t as IdentToken).val.toUpperCase()] as number;
    }

    // @ts-ignore
    return t.typ == EnumToken.FractionTokenType ? (t as FractionToken).l.val / (t as FractionToken).r.val : +t.val;
}

export function evaluateFunc(token: FunctionToken): Token[] {

    const values: Token[] = token.chi.slice();

    switch (token.val) {

        case 'abs':
        case 'sin':
        case 'cos':
        case 'tan':
        case 'asin':
        case 'acos':
        case 'atan':
        case 'sign':
        case 'sqrt':
        case 'exp': {

            const value: Token[] = evaluate(values);

            // @ts-ignore
            let val: number = value[0].typ == EnumToken.NumberTokenType ? +value[0].val : (value[0] as FractionToken).l.val / (value[0] as FractionToken).r.val;

            return [{
                typ: EnumToken.NumberTokenType,
                val: Math[token.val](val)
            }];
        }

        case 'hypot': {

            const chi = values.filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(t.typ));

            let all: number[] = [];
            let ref = chi[0];
            let value: number = 0;

            for (let i = 0; i < chi.length; i++) {

                // @ts-ignore
                const val = getValue(chi[i] as DimensionToken | NumberToken) as number;

                all.push(val);
                value += val * val;
            }

            return [
                {
                    ...ref,
                    val: +(Math.sqrt(value).toFixed(rem(...all)))
                } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
        }

        case 'atan2':
        case 'pow':
        case 'rem':
        case 'mod': {

            const chi = values.filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));

            // https://developer.mozilla.org/en-US/docs/Web/CSS/mod
            const v1: Token[] = evaluate([chi[0]]);
            const v2: Token[] = evaluate([chi[2]]);
// @ts-ignore
            const val1 = getValue(v1[0] as Token) as number;
            // @ts-ignore
            const val2 = getValue(v2[0] as Token) as number;

            if (token.val == 'rem') {

                return [
                    {
                        ...v1[0],
                        val: +((val1 % val2).toFixed(rem(val1, val2)))
                    } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
            }

            if (token.val == 'pow') {

                return [
                    {
                        ...v1[0],
                        val: Math.pow(val1, val2)
                    } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
            }

            if (token.val == 'atan2') {

                return [
                    {
                        ...{}, ...v1[0],
                        val: Math.atan2(val1, val2)
                    } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
            }

            return [
                {
                    ...v1[0],
                    val: val2 == 0 ? val1 : val1 - (Math.floor(val1 / val2) * val2)
                } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
        }

        case 'clamp':

            token.chi = values;

            return [token];

        case 'log':
        case 'round':
        case 'min':
        case 'max': {

            const strategy = token.val == 'round' && values[0]?.typ == EnumToken.IdenTokenType ? (values.shift() as IdentToken).val : null;
            const valuesMap = new Map;

            for (const curr of values) {

                if (curr.typ == EnumToken.CommaTokenType || curr.typ == EnumToken.WhitespaceTokenType || curr.typ == EnumToken.CommentTokenType) {

                    continue;
                }

                const result: Token[] = evaluate([curr]);

                const key: string = result[0].typ + ('unit' in result[0] ? result[0].unit : '');

                if (!valuesMap.has(key)) {

                    valuesMap.set(key, []);
                }

                valuesMap.get(key)!.push(result[0]);
            }

            if (valuesMap.size == 1) {

                const values = valuesMap.values().next().value as Token[];

                if (token.val == 'log') {

                    const val1 = getValue(values[0] as NumberToken) as number;
                    const val2 = values.length == 2 ? getValue(values[1] as NumberToken) as number : null;

                    return [
                        {
                            ...values[0],
                            val: Math.log(val1) / Math.log(val2 as number)
                        } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
                }

                if (token.val == 'min' || token.val == 'max') {

                    let val = getValue(values[0] as NumberToken) as number;
                    let val2: number = val;
                    let ret = values[0];

                    for (const curr of values.slice(1)) {

                        val2 = getValue(curr as NumberToken) as number;

                        if (val2 < val && token.val == 'min') {

                            val = val2;
                            ret = curr;
                        } else if (val2 > val && token.val == 'max') {

                            val = val2;
                            ret = curr;
                        }
                    }

                    return [ret];
                }

                if (token.val == 'round') {

                    let val = getValue(values[0] as NumberToken) as number;
                    let val2 = getValue(values[1] as NumberToken) as number;

                    if (strategy == null || strategy == 'down') {

                        val = val - (val % val2);
                    } else {

                        val = strategy == 'to-zero' ? Math.trunc(val / val2) * val2 : (strategy == 'nearest' ? Math.round(val / val2) * val2 : Math.ceil(val / val2) * val2);
                    }

                    // @ts-ignore
                    return [{...values[0], val}];
                }
            }
        }
    }

    return [token];
}

/**
 * convert BinaryExpression into an array
 * @param token
 */
export function inlineExpression(token: Token): Token[] {

    const result: Token[] = [];

    if (token.typ == EnumToken.BinaryExpressionTokenType) {

        if ([EnumToken.Mul, EnumToken.Div].includes((token as BinaryExpressionToken).op)) {

            result.push(token);
        } else {

            result.push(...inlineExpression((token as BinaryExpressionToken).l), {typ: (token as BinaryExpressionToken).op}, ...inlineExpression((token as BinaryExpressionToken).r));
        }
    } else {

        result.push(token);
    }

    return result;
}

/**
 * evaluate expression
 * @param token
 */
function evaluateExpression(token: Token): Token {

    if (token.typ != EnumToken.BinaryExpressionTokenType) {

        return token;
    }

    if ((token as BinaryExpressionToken).r.typ == EnumToken.BinaryExpressionTokenType) {

        (token as BinaryExpressionToken).r = <BinaryExpressionNode>evaluateExpression((token as BinaryExpressionToken).r);
    }

    if ((token as BinaryExpressionToken).l.typ == EnumToken.BinaryExpressionTokenType) {

        (token as BinaryExpressionToken).l = <BinaryExpressionNode>evaluateExpression((token as BinaryExpressionToken).l);
    }

    return doEvaluate((token as BinaryExpressionToken).l, (token as BinaryExpressionToken).r, (token as BinaryExpressionToken).op);
}

function isScalarToken(token: Token): boolean {

    return 'unit' in token ||
        (token.typ == EnumToken.FunctionTokenType && mathFuncs.includes((token as FunctionToken).val)) ||
        // @ts-ignore
        (token.typ == EnumToken.IdenTokenType && typeof Math[(token as IdentToken).val.toUpperCase()] == 'number') ||
        [EnumToken.NumberTokenType, EnumToken.FractionTokenType, EnumToken.PercentageTokenType].includes(token.typ);
}

/**
 *
 * generate a binary expression tree
 * @param tokens
 */
export function buildExpression(tokens: Token[]): BinaryExpressionToken {

    return <BinaryExpressionToken>factor(factor(tokens.filter(t => t.typ != EnumToken.WhitespaceTokenType), ['/', '*']), ['+', '-'])[0];
}

function getArithmeticOperation(op: '+' | '-' | '/' | '*'): EnumToken.Mul | EnumToken.Div | EnumToken.Add | EnumToken.Sub {

    if (op == '+') {

        return EnumToken.Add;
    }

    if (op == '-') {

        return EnumToken.Sub;
    }

    if (op == '/') {

        return EnumToken.Div;
    }

    return EnumToken.Mul;
}

/**
 *
 * generate a binary expression tree
 * @param token
 */
function factorToken(token: Token): Token {

    if (token.typ == EnumToken.ParensTokenType || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc')) {

        if (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc') {

            token = {...token, typ: EnumToken.ParensTokenType} as ParensToken;

            // @ts-ignore
            delete token.val;
        }

        return buildExpression((<ParensToken>token).chi);
    }

    return token;
}

/**
 * generate a binary expression tree
 * @param tokens
 * @param ops
 */
function factor(tokens: Array<Token | BinaryExpressionToken>, ops: Array<'+' | '-' | '/' | '*'>): Token[] {

    let isOp: boolean;
    const opList: EnumToken[] = ops.map(x => getArithmeticOperation(x));

    if (tokens.length == 1) {

        return [factorToken(tokens[0])];
    }

    for (let i = 0; i < tokens.length; i++) {

        if (tokens[i].typ == EnumToken.ListToken) {

            // @ts-ignore
            tokens.splice(i, 1, ...tokens[i].chi);
        }

        isOp = opList.includes((tokens[i] as Token).typ);

        if (isOp ||
            // @ts-ignore
            ((<Token>tokens[i]).typ == EnumToken.LiteralTokenType && ops.includes((tokens[i] as LiteralToken).val))) {

            tokens.splice(i - 1, 3, <BinaryExpressionToken>{
                typ: EnumToken.BinaryExpressionTokenType,
                op: isOp ? (tokens[i] as Token).typ : getArithmeticOperation(<'-' | '+' | '/' | '*'>(tokens[i] as LiteralToken).val),
                l: factorToken(tokens[i - 1]),
                r: factorToken(tokens[i + 1])
            });

            i--;
        }
    }

    return tokens;
}
