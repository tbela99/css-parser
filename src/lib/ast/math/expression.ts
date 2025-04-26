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
import {reduceNumber} from "../../renderer/index.ts";

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

    try {

        nodes = inlineExpression(evaluateExpression(buildExpression(tokens)));
    } catch (e) {

        return tokens;
    }

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
                    val: ('' + Math[(<IdentToken>nodes[0]).val.toUpperCase()] as number),
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

                token = doEvaluate(<Token>nodes[i + 1], {typ: EnumToken.NumberTokenType, val: '-1'}, EnumToken.Mul);
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

                acc.push({typ: EnumToken.Sub}, <Token>{...token, val: String(-token.val)});
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

    if (l.typ == EnumToken.FunctionTokenType) {

        const val: Token[] = evaluateFunc(l as FunctionToken);

        if (val.length == 1) {

            l = val[0];
        } else {

            return defaultReturn;
        }
    }

    if (r.typ == EnumToken.FunctionTokenType) {

        const val = evaluateFunc(r as FunctionToken);

        if (val.length == 1) {

            r = val[0];
        } else {

            return defaultReturn;
        }
    }

    if (l.typ == EnumToken.FunctionTokenType) {

        const val = evaluateFunc(l as FunctionToken);

        if (val.length == 1) {

            l = val[0];
        }
    }

    if ((op == EnumToken.Add || op == EnumToken.Sub)) {

        // @ts-ignore
        if (l.typ != r.typ) {

            return defaultReturn;
        }
    } else if (
        op == EnumToken.Mul &&
        ![EnumToken.NumberTokenType, EnumToken.PercentageTokenType].includes(l.typ) &&
        ![EnumToken.NumberTokenType, EnumToken.PercentageTokenType].includes(r.typ)) {

        return defaultReturn;
    }

    let typ: EnumToken = l.typ == EnumToken.NumberTokenType ? r.typ : (r.typ == EnumToken.NumberTokenType ? l.typ : (l.typ == EnumToken.PercentageTokenType ? r.typ : l.typ));

    // @ts-ignore
    let v1: number | Token | null = getValue(l);
    let v2: number | Token | null = getValue(r as NumberToken | IdentToken | FunctionToken);

    if (v1 == null || v2 == null) {

        return defaultReturn;
    }

    if (op == EnumToken.Mul) {

        if (l.typ != EnumToken.NumberTokenType && r.typ != EnumToken.NumberTokenType) {

            if (typeof v1 == 'number' && l.typ == EnumToken.PercentageTokenType) {

                v1 = {
                    typ: EnumToken.FractionTokenType,
                    l: {typ: EnumToken.NumberTokenType, val: String(v1)},
                    r: {typ: EnumToken.NumberTokenType, val: '100'}
                };
            } else if (typeof v2 == 'number' && r.typ == EnumToken.PercentageTokenType) {

                v2 = {
                    typ: EnumToken.FractionTokenType,
                    l: {typ: EnumToken.NumberTokenType, val: String(v2)},
                    r: {typ: EnumToken.NumberTokenType, val: '100'}
                };
            }
        }
    }

    // @ts-ignore
    const val: number | FractionToken = compute(v1, v2, op);

    const token = {
        ...(l.typ == EnumToken.NumberTokenType ? r : l),
        typ,
        val: typeof val == 'number' ? reduceNumber(val) : val
    } as Token;

    if (token.typ == EnumToken.IdenTokenType) {

        // @ts-ignore
        token.typ = EnumToken.NumberTokenType;
    }

    return token;
}

function getValue(t: NumberToken | IdentToken | FunctionToken): number | null {

    let v1: number | FractionToken | Token[];

    if (t.typ == EnumToken.FunctionTokenType) {

        v1 = evaluateFunc(t as FunctionToken);

        if (v1.length != 1 || v1[0].typ == EnumToken.BinaryExpressionTokenType) {

            return null;
        }

        t = v1[0] as NumberToken | IdentToken;
    }

    if (t.typ == EnumToken.IdenTokenType) {

        // @ts-ignore
        return Math[(t as IdentToken).val.toUpperCase()] as number;
    }

    if ((t.val as FractionToken).typ == EnumToken.FractionTokenType) {

        // @ts-ignore
        return (t.val as FractionToken).l.val / (t.val as FractionToken).r.val;
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

            if (value.length != 1 || (value[0].typ != EnumToken.NumberTokenType && value[0].typ != EnumToken.FractionTokenType) || (value[0].typ == EnumToken.FractionTokenType && (+(value[0] as FractionToken).r.val == 0 || !Number.isFinite(+(value[0] as FractionToken).l.val) || !Number.isFinite(+(value[0] as FractionToken).r.val)))) {

                return value;
            }

            // @ts-ignore
            let val: number = value[0].typ == EnumToken.NumberTokenType ? +value[0].val : (value[0] as FractionToken).l.val / (value[0] as FractionToken).r.val;

            return [{
                typ: EnumToken.NumberTokenType,
                val: '' + Math[token.val](val)
            }];
        }

        case 'hypot': {

            const chi = values.filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(t.typ));

            let all: number[] = [];
            let ref = chi[0];
            let value: number = 0;

            if (![EnumToken.NumberTokenType, EnumToken.PercentageTokenType].includes(ref.typ) && !('unit' in ref)) {

                return [token];
            }

            for (let i = 0; i < chi.length; i++) {

                // @ts-ignore
                if (chi[i].typ != ref.typ || ('unit' in chi[i] && 'unit' in ref && chi[i].unit != ref.unit)) {

                    return [token];
                }

                // @ts-ignore
                const val = getValue(chi[i] as DimensionToken | NumberToken) as number;

                if (val == null) {

                    return [token];
                }

                all.push(val);
                value += val * val;
            }

            return [
                {
                    ...ref,
                    val: Math.sqrt(value).toFixed(rem(...all))
                } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
        }

        case 'atan2':
        case 'pow':
        case 'rem':
        case 'mod': {

            const chi = values.filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));

            if (chi.length != 3 || chi[1].typ != EnumToken.CommaTokenType) {

                return [token];
            }

            if (token.val == 'pow' && (chi[0].typ != EnumToken.NumberTokenType || chi[2].typ != EnumToken.NumberTokenType)) {

                return [token];
            }

            if (['rem', 'mod'].includes(token.val) &&
                (
                    chi[0].typ != chi[2].typ) || (
                    'unit' in chi[0] && 'unit' in chi[2] &&
                    chi[0].unit != chi[2].unit
                )) {

                return [token];
            }

            // https://developer.mozilla.org/en-US/docs/Web/CSS/mod
            const v1: Token[] = evaluate([chi[0]]);
            const v2: Token[] = evaluate([chi[2]]);
            const types: EnumToken[] = [EnumToken.PercentageTokenType, EnumToken.DimensionTokenType, EnumToken.AngleTokenType, EnumToken.NumberTokenType, EnumToken.LengthTokenType, EnumToken.TimeTokenType, EnumToken.FrequencyTokenType, EnumToken.ResolutionTokenType];

            if (v1.length != 1 || v2.length != 1 || !types.includes(v1[0].typ) || !types.includes(v2[0].typ) || (v1[0] as DimensionToken).unit != (v2[0] as DimensionToken).unit) {

                return [token];
            }

            // @ts-ignore
            const val1 = getValue(v1[0] as Token) as number;
            // @ts-ignore
            const val2 = getValue(v2[0] as Token) as number;

            if (val1 == null || val2 == null || (v1[0].typ != v2[0].typ && val1 != 0 && val2 != 0)) {

                return [token];
            }

            if (token.val == 'rem') {

                if (val2 == 0) {

                    return [token];
                }

                return [
                    {
                        ...v1[0],
                        val: (val1 % val2).toFixed(rem(val1, val2))
                    } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
            }

            if (token.val == 'pow') {

                return [
                    {
                        ...v1[0],
                        val: String(Math.pow(val1, val2))
                    } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
            }

            if (token.val == 'atan2') {

                return [
                    {
                        ...{}, ...v1[0],
                        val: String(Math.atan2(val1, val2))
                    } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
            }

            return [
                {
                    ...v1[0],
                    val: String(val2 == 0 ? val1 : val1 - (Math.floor(val1 / val2) * val2))
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

                if (result.length != 1 || result[0].typ == EnumToken.FunctionTokenType) {

                    return [token];
                }

                const key: string = result[0].typ + ('unit' in result[0] ? result[0].unit : '');

                if (!valuesMap.has(key)) {

                    valuesMap.set(key, []);
                }

                valuesMap.get(key)!.push(result[0]);
            }

            if (valuesMap.size == 1) {

                const values = valuesMap.values().next().value as Token[];

                if (token.val == 'log') {

                    if (values[0].typ != EnumToken.NumberTokenType || values.length > 2) {

                        return [token];
                    }

                    const val1 = getValue(values[0] as NumberToken) as number;
                    const val2 = values.length == 2 ? getValue(values[1] as NumberToken) as number : null;

                    if (values.length == 1) {

                        return [
                            {
                                ...values[0],
                                val: String(Math.log(val1))
                            } as DimensionToken | AngleToken | NumberToken | LengthToken | TimeToken | FrequencyToken | ResolutionToken];
                    }

                    return [
                        {
                            ...values[0],
                            val: String(Math.log(val1) / Math.log(val2 as number))
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

                    if (Number.isNaN(val) || Number.isNaN(val2)) {

                        return [token];
                    }

                    if (strategy == null || strategy == 'down') {

                        val = val - (val % val2);
                    } else {

                        val = strategy == 'to-zero' ? Math.trunc(val / val2) * val2 : (strategy == 'nearest' ? Math.round(val / val2) * val2 : Math.ceil(val / val2) * val2);
                    }

                    // @ts-ignore
                    return [{...values[0], val: String(val)}];
                }
            }
        }

            return [token];
    }

    return [token];
}

/**
 * convert BinaryExpression into an array
 * @param token
 */
export function inlineExpression(token: Token): Token[] {

    const result: Token[] = [];

    if (token.typ == EnumToken.ParensTokenType && (token as ParensToken).chi.length == 1) {

        result.push((token as ParensToken).chi[0]);
    } else if (token.typ == EnumToken.BinaryExpressionTokenType) {

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
 * generate binary expression tree
 * @param tokens
 */
function buildExpression(tokens: Token[]): BinaryExpressionToken {

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
 * generate binary expression tree
 * @param token
 */
function factorToken(token: Token): Token {

    if (token.typ == EnumToken.ParensTokenType || (token.typ == EnumToken.FunctionTokenType && (<FunctionToken>token).val == 'calc')) {

        if (token.typ == EnumToken.FunctionTokenType && (<FunctionToken>token).val == 'calc') {

            token = <ParensToken>{...token, typ: EnumToken.ParensTokenType};

            // @ts-ignore
            delete token.val;
        }

        return buildExpression((<ParensToken>token).chi);
    }

    return token;
}

/**
 * generate binary expression tree
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

        isOp = opList.includes((<Token>tokens[i]).typ);

        if (isOp ||
            // @ts-ignore
            ((<Token>tokens[i]).typ == EnumToken.LiteralTokenType && ops.includes((<LiteralToken>tokens[i]).val))) {

            tokens.splice(i - 1, 3, <BinaryExpressionToken>{
                typ: EnumToken.BinaryExpressionTokenType,
                op: isOp ? (<Token>tokens[i]).typ : getArithmeticOperation(<'-' | '+' | '/' | '*'>(<LiteralToken>tokens[i]).val),
                l: factorToken(tokens[i - 1]),
                r: factorToken(tokens[i + 1])
            });

            i--;
        }
    }

    return tokens;
}
