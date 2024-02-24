import { EnumToken } from '../types.js';
import { compute } from './math.js';
import { reduceNumber } from '../../renderer/render.js';

/**
 * evaluate an array of tokens
 * @param tokens
 */
function evaluate(tokens) {
    const nodes = inlineExpression(evaluateExpression(buildExpression(tokens)));
    if (nodes.length <= 1) {
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
    if (typeof l != 'object') {
        throw new Error('foo');
    }
    if (!isScalarToken(l) || !isScalarToken(r)) {
        return defaultReturn;
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
    const typ = l.typ == EnumToken.NumberTokenType ? r.typ : (r.typ == EnumToken.NumberTokenType ? l.typ : (l.typ == EnumToken.PercentageTokenType ? r.typ : l.typ));
    // @ts-ignore
    let v1 = typeof l.val == 'string' ? +l.val : l.val;
    // @ts-ignore
    let v2 = typeof r.val == 'string' ? +r.val : r.val;
    if (op == EnumToken.Mul) {
        if (l.typ != EnumToken.NumberTokenType && r.typ != EnumToken.NumberTokenType) {
            if (typeof v1 == 'number' && l.typ == EnumToken.PercentageTokenType) {
                v1 = { typ: EnumToken.FractionTokenType, l: { typ: EnumToken.NumberTokenType, val: String(v1) }, r: { typ: EnumToken.NumberTokenType, val: '100' } };
            }
            else if (typeof v2 == 'number' && r.typ == EnumToken.PercentageTokenType) {
                v2 = { typ: EnumToken.FractionTokenType, l: { typ: EnumToken.NumberTokenType, val: String(v2) }, r: { typ: EnumToken.NumberTokenType, val: '100' } };
            }
        }
    }
    // @ts-ignore
    const val = compute(v1, v2, op);
    // if (typeof val == 'number') {
    //
    //     return {typ: EnumToken.NumberTokenType, val: String(val)};
    // }
    return { ...(l.typ == EnumToken.NumberTokenType ? r : l), typ, val: typeof val == 'number' ? reduceNumber(val) : val };
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
    return 'unit' in token || [EnumToken.NumberTokenType, EnumToken.FractionTokenType, EnumToken.PercentageTokenType].includes(token.typ);
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

export { evaluate };
