import { EnumToken } from '../types.js';
import { rem, compute } from './math.js';
import { reduceNumber } from '../../renderer/render.js';
import { mathFuncs } from '../../syntax/syntax.js';

/**
 * evaluate an array of tokens
 * @param tokens
 */
function evaluate(tokens) {
    let nodes;
    if (tokens.length == 1 && tokens[0].typ == EnumToken.FunctionTokenType && tokens[0].val != 'calc' && mathFuncs.includes(tokens[0].val)) {
        const chi = tokens[0].chi.reduce((acc, t) => {
            if (acc.length == 0 || t.typ == EnumToken.CommaTokenType) {
                acc.push([]);
            }
            if ([EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.CommaTokenType].includes(t.typ)) {
                return acc;
            }
            acc.at(-1).push(t);
            return acc;
        }, []);
        for (let i = 0; i < chi.length; i++) {
            chi[i] = evaluate(chi[i]);
        }
        tokens[0].chi = chi.reduce((acc, t) => {
            if (acc.length > 0) {
                acc.push({ typ: EnumToken.CommaTokenType });
            }
            acc.push(...t);
            return acc;
        });
        return evaluateFunc(tokens[0]);
    }
    try {
        nodes = inlineExpression(evaluateExpression(buildExpression(tokens)));
    }
    catch (e) {
        return tokens;
    }
    if (nodes.length <= 1) {
        if (nodes.length == 1) {
            if (nodes[0].typ == EnumToken.BinaryExpressionTokenType) {
                return inlineExpression(nodes[0]);
            }
            // @ts-ignore
            if (nodes[0].typ == EnumToken.IdenTokenType && typeof Math[nodes[0].val.toUpperCase()] == 'number') {
                return [{
                        ...nodes[0],
                        // @ts-ignore
                        val: '' + Math[nodes[0].val.toUpperCase()],
                        typ: EnumToken.NumberTokenType
                    }];
            }
        }
        return nodes;
    }
    const map = new Map;
    let token;
    let i;
    for (i = 0; i < nodes.length; i++) {
        token = nodes[i];
        if (token.typ == EnumToken.Add) {
            continue;
        }
        if (token.typ == EnumToken.Sub) {
            if (!isScalarToken(nodes[i + 1])) {
                token = { typ: EnumToken.ListToken, chi: [nodes[i], nodes[i + 1]] };
            }
            else {
                token = doEvaluate(nodes[i + 1], { typ: EnumToken.NumberTokenType, val: '-1' }, EnumToken.Mul);
            }
            i++;
        }
        if (!map.has(token.typ)) {
            map.set(token.typ, [token]);
        }
        else {
            map.get(token.typ).push(token);
        }
    }
    return [...map].reduce((acc, curr) => {
        const token = curr[1].reduce((acc, curr) => doEvaluate(acc, curr, EnumToken.Add));
        if (token.typ != EnumToken.BinaryExpressionTokenType) {
            if ('val' in token && +token.val < 0) {
                acc.push({ typ: EnumToken.Sub }, { ...token, val: String(-token.val) });
                return acc;
            }
        }
        if (acc.length > 0 && curr[0] != EnumToken.ListToken) {
            acc.push({ typ: EnumToken.Add });
        }
        acc.push(token);
        return acc;
    }, []);
}
/**
 * evaluate arithmetic operation
 * @param l
 * @param r
 * @param op
 */
function doEvaluate(l, r, op) {
    const defaultReturn = {
        typ: EnumToken.BinaryExpressionTokenType,
        op,
        l,
        r
    };
    if (!isScalarToken(l) || !isScalarToken(r) || (l.typ == r.typ && 'unit' in l && 'unit' in r && l.unit != r.unit)) {
        return defaultReturn;
    }
    if (l.typ == EnumToken.FunctionTokenType) {
        const val = evaluateFunc(l);
        if (val.length == 1) {
            l = val[0];
        }
        else {
            return defaultReturn;
        }
    }
    if (r.typ == EnumToken.FunctionTokenType) {
        const val = evaluateFunc(r);
        if (val.length == 1) {
            r = val[0];
        }
        else {
            return defaultReturn;
        }
    }
    if (l.typ == EnumToken.FunctionTokenType) {
        const val = evaluateFunc(l);
        if (val.length == 1) {
            l = val[0];
        }
    }
    if ((op == EnumToken.Add || op == EnumToken.Sub)) {
        // @ts-ignore
        if (l.typ != r.typ) {
            return defaultReturn;
        }
    }
    else if (op == EnumToken.Mul &&
        ![EnumToken.NumberTokenType, EnumToken.PercentageTokenType].includes(l.typ) &&
        ![EnumToken.NumberTokenType, EnumToken.PercentageTokenType].includes(r.typ)) {
        return defaultReturn;
    }
    let typ = l.typ == EnumToken.NumberTokenType ? r.typ : (r.typ == EnumToken.NumberTokenType ? l.typ : (l.typ == EnumToken.PercentageTokenType ? r.typ : l.typ));
    // @ts-ignore
    let v1 = getValue(l);
    let v2 = getValue(r);
    if (v1 == null || v2 == null) {
        return defaultReturn;
    }
    if (op == EnumToken.Mul) {
        if (l.typ != EnumToken.NumberTokenType && r.typ != EnumToken.NumberTokenType) {
            if (typeof v1 == 'number' && l.typ == EnumToken.PercentageTokenType) {
                v1 = {
                    typ: EnumToken.FractionTokenType,
                    l: { typ: EnumToken.NumberTokenType, val: String(v1) },
                    r: { typ: EnumToken.NumberTokenType, val: '100' }
                };
            }
            else if (typeof v2 == 'number' && r.typ == EnumToken.PercentageTokenType) {
                v2 = {
                    typ: EnumToken.FractionTokenType,
                    l: { typ: EnumToken.NumberTokenType, val: String(v2) },
                    r: { typ: EnumToken.NumberTokenType, val: '100' }
                };
            }
        }
    }
    // @ts-ignore
    const val = compute(v1, v2, op);
    // typ = typeof val == 'number' ? EnumToken.NumberTokenType : EnumToken.FractionTokenType;
    const token = {
        ...(l.typ == EnumToken.NumberTokenType ? r : l),
        typ,
        val: typeof val == 'number' ? reduceNumber(val) : val
    };
    if (token.typ == EnumToken.IdenTokenType) {
        // @ts-ignore
        token.typ = EnumToken.NumberTokenType;
    }
    return token;
}
function getValue(t) {
    let v1;
    if (t.typ == EnumToken.FunctionTokenType) {
        v1 = evaluateFunc(t);
        if (v1.length != 1 || v1[0].typ == EnumToken.BinaryExpressionTokenType) {
            return null;
        }
        t = v1[0];
    }
    if (t.typ == EnumToken.IdenTokenType) {
        // @ts-ignore
        return Math[t.val.toUpperCase()];
    }
    if (t.val.typ == EnumToken.FractionTokenType) {
        // @ts-ignore
        return t.val.l.val / t.val.r.val;
    }
    // @ts-ignore
    return t.typ == EnumToken.FractionTokenType ? t.l.val / t.r.val : +t.val;
}
function evaluateFunc(token) {
    const values = token.chi.slice();
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
            const value = evaluate(values);
            if (value.length != 1 || (value[0].typ != EnumToken.NumberTokenType && value[0].typ != EnumToken.FractionTokenType) || (value[0].typ == EnumToken.FractionTokenType && (+value[0].r.val == 0 || !Number.isFinite(+value[0].l.val) || !Number.isFinite(+value[0].r.val)))) {
                return value;
            }
            // @ts-ignore
            let val = value[0].typ == EnumToken.NumberTokenType ? +value[0].val : value[0].l.val / value[0].r.val;
            return [{
                    typ: EnumToken.NumberTokenType,
                    val: '' + Math[token.val](val)
                }];
        }
        case 'hypot': {
            const chi = values.filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(t.typ));
            let all = [];
            let ref = chi[0];
            let value = 0;
            if (![EnumToken.NumberTokenType, EnumToken.PercentageTokenType].includes(ref.typ) && !('unit' in ref)) {
                return [token];
            }
            for (let i = 0; i < chi.length; i++) {
                // @ts-ignore
                if (chi[i].typ != ref.typ || ('unit' in chi[i] && 'unit' in ref && chi[i].unit != ref.unit)) {
                    return [token];
                }
                // @ts-ignore
                const val = getValue(chi[i]);
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
                }
            ];
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
                (chi[0].typ != chi[2].typ) || ('unit' in chi[0] && 'unit' in chi[2] &&
                chi[0].unit != chi[2].unit)) {
                return [token];
            }
            // https://developer.mozilla.org/en-US/docs/Web/CSS/mod
            const v1 = evaluate([chi[0]]);
            const v2 = evaluate([chi[2]]);
            const types = [EnumToken.PercentageTokenType, EnumToken.DimensionTokenType, EnumToken.AngleTokenType, EnumToken.NumberTokenType, EnumToken.LengthTokenType, EnumToken.TimeTokenType, EnumToken.FrequencyTokenType, EnumToken.ResolutionTokenType];
            if (v1.length != 1 || v2.length != 1 || !types.includes(v1[0].typ) || !types.includes(v2[0].typ) || v1[0].unit != v2[0].unit) {
                return [token];
            }
            // @ts-ignore
            const val1 = getValue(v1[0]);
            // @ts-ignore
            const val2 = getValue(v2[0]);
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
                    }
                ];
            }
            if (token.val == 'pow') {
                return [
                    {
                        ...v1[0],
                        val: String(Math.pow(val1, val2))
                    }
                ];
            }
            if (token.val == 'atan2') {
                return [
                    {
                        ...{}, ...v1[0],
                        val: String(Math.atan2(val1, val2))
                    }
                ];
            }
            return [
                {
                    ...v1[0],
                    val: String(val2 == 0 ? val1 : val1 - (Math.floor(val1 / val2) * val2))
                }
            ];
        }
        case 'clamp':
            token.chi = values;
            return [token];
        case 'log':
        case 'round':
        case 'min':
        case 'max':
            {
                const strategy = token.val == 'round' && values[0]?.typ == EnumToken.IdenTokenType ? values.shift().val : null;
                const valuesMap = new Map;
                for (const curr of values) {
                    if (curr.typ == EnumToken.CommaTokenType || curr.typ == EnumToken.WhitespaceTokenType || curr.typ == EnumToken.CommentTokenType) {
                        continue;
                    }
                    const result = evaluate([curr]);
                    if (result.length != 1 || result[0].typ == EnumToken.FunctionTokenType) {
                        return [token];
                    }
                    const key = result[0].typ + ('unit' in result[0] ? result[0].unit : '');
                    if (!valuesMap.has(key)) {
                        valuesMap.set(key, []);
                    }
                    valuesMap.get(key).push(result[0]);
                }
                if (valuesMap.size == 1) {
                    const values = valuesMap.values().next().value;
                    if (token.val == 'log') {
                        if (values[0].typ != EnumToken.NumberTokenType || values.length > 2) {
                            return [token];
                        }
                        const val1 = getValue(values[0]);
                        const val2 = values.length == 2 ? getValue(values[1]) : null;
                        if (values.length == 1) {
                            return [
                                {
                                    ...values[0],
                                    val: String(Math.log(val1))
                                }
                            ];
                        }
                        return [
                            {
                                ...values[0],
                                val: String(Math.log(val1) / Math.log(val2))
                            }
                        ];
                    }
                    if (token.val == 'min' || token.val == 'max') {
                        let val = getValue(values[0]);
                        let val2 = val;
                        let ret = values[0];
                        for (const curr of values.slice(1)) {
                            val2 = getValue(curr);
                            if (val2 < val && token.val == 'min') {
                                val = val2;
                                ret = curr;
                            }
                            else if (val2 > val && token.val == 'max') {
                                val = val2;
                                ret = curr;
                            }
                        }
                        return [ret];
                    }
                    if (token.val == 'round') {
                        let val = getValue(values[0]);
                        let val2 = getValue(values[1]);
                        if (Number.isNaN(val) || Number.isNaN(val2)) {
                            return [token];
                        }
                        if (strategy == null || strategy == 'down') {
                            val = val - (val % val2);
                        }
                        else {
                            val = strategy == 'to-zero' ? Math.trunc(val / val2) * val2 : (strategy == 'nearest' ? Math.round(val / val2) * val2 : Math.ceil(val / val2) * val2);
                        }
                        // @ts-ignore
                        return [{ ...values[0], val: String(val) }];
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
function inlineExpression(token) {
    const result = [];
    if (token.typ == EnumToken.ParensTokenType && token.chi.length == 1) {
        result.push(token.chi[0]);
    }
    else if (token.typ == EnumToken.BinaryExpressionTokenType) {
        if ([EnumToken.Mul, EnumToken.Div].includes(token.op)) {
            result.push(token);
        }
        else {
            result.push(...inlineExpression(token.l), { typ: token.op }, ...inlineExpression(token.r));
        }
    }
    else {
        result.push(token);
    }
    return result;
}
/**
 * evaluate expression
 * @param token
 */
function evaluateExpression(token) {
    // if (token.typ == EnumToken.ParensTokenType) {
    //
    //     return evaluateExpression(buildExpression((token as ParensToken).chi));
    // }
    if (token.typ != EnumToken.BinaryExpressionTokenType) {
        return token;
    }
    if (token.r.typ == EnumToken.BinaryExpressionTokenType) {
        token.r = evaluateExpression(token.r);
    }
    if (token.l.typ == EnumToken.BinaryExpressionTokenType) {
        token.l = evaluateExpression(token.l);
    }
    return doEvaluate(token.l, token.r, token.op);
}
function isScalarToken(token) {
    return 'unit' in token ||
        (token.typ == EnumToken.FunctionTokenType && mathFuncs.includes(token.val)) ||
        // @ts-ignore
        (token.typ == EnumToken.IdenTokenType && typeof Math[token.val.toUpperCase()] == 'number') ||
        [EnumToken.NumberTokenType, EnumToken.FractionTokenType, EnumToken.PercentageTokenType].includes(token.typ);
}
/**
 *
 * generate binary expression tree
 * @param tokens
 */
function buildExpression(tokens) {
    return factor(factor(tokens.filter(t => t.typ != EnumToken.WhitespaceTokenType), ['/', '*']), ['+', '-'])[0];
}
function getArithmeticOperation(op) {
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
function factorToken(token) {
    if (token.typ == EnumToken.ParensTokenType || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc')) {
        if (token.typ == EnumToken.FunctionTokenType && token.val == 'calc') {
            token = { ...token, typ: EnumToken.ParensTokenType };
            // @ts-ignore
            delete token.val;
        }
        return buildExpression(token.chi);
    }
    return token;
}
/**
 * generate binary expression tree
 * @param tokens
 * @param ops
 */
function factor(tokens, ops) {
    let isOp;
    const opList = ops.map(x => getArithmeticOperation(x));
    if (tokens.length == 1) {
        return [factorToken(tokens[0])];
    }
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].typ == EnumToken.ListToken) {
            // @ts-ignore
            tokens.splice(i, 1, ...tokens[i].chi);
        }
        isOp = opList.includes(tokens[i].typ);
        if (isOp ||
            // @ts-ignore
            (tokens[i].typ == EnumToken.LiteralTokenType && ops.includes(tokens[i].val))) {
            tokens.splice(i - 1, 3, {
                typ: EnumToken.BinaryExpressionTokenType,
                op: isOp ? tokens[i].typ : getArithmeticOperation(tokens[i].val),
                l: factorToken(tokens[i - 1]),
                r: factorToken(tokens[i + 1])
            });
            i--;
        }
    }
    return tokens;
}

export { evaluate, evaluateFunc, inlineExpression };
