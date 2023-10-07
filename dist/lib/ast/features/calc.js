import { EnumToken } from '../types.js';
import { reduceNumber, renderToken } from '../../renderer/render.js';
import { walkValues } from '../walk.js';

class ComputeCalcExpression {
    run(ast) {
        if (!('chi' in ast)) {
            return ast;
        }
        // @ts-ignore
        for (const node of ast.chi) {
            if (node.typ != 5 /* NodeType.DeclarationNodeType */) {
                continue;
            }
            const set = new Set;
            for (const { parent } of walkValues(node.val)) {
                if (parent != null && parent.typ == EnumToken.FunctionTokenType && parent.val == 'calc') {
                    if (set.has(parent)) {
                        continue;
                    }
                    set.add(parent);
                    parent.chi = evaluate(parent.chi);
                }
            }
        }
        return ast;
    }
}
function doEvaluate(l, r, op) {
    const defaultReturn = {
        typ: EnumToken.BinaryExpressionTokenType,
        op,
        l,
        r
    };
    if (!isScalarToken(l) || !isScalarToken(r)) {
        return defaultReturn;
    }
    if ((op == EnumToken.Add || op == EnumToken.Sub)) {
        // @ts-ignore
        if (l.typ != r.typ || Number.isNaN(+l.val) || Number.isNaN(r.val)) {
            return defaultReturn;
        }
        // @ts-ignore
        return { ...l, val: reduceNumber(+l.val + (op == EnumToken.Add ? +r.val : -1 * r.val)) };
    }
    else {
        // @ts-ignore
        let val;
        if (op == EnumToken.Div) {
            if (r.typ != EnumToken.NumberTokenType || r.val == '0') {
                return defaultReturn;
            }
            // @ts-ignore
            val = reduceNumber(l.val / r.val);
        }
        else {
            // @ts-ignore
            val = reduceNumber(r.val * l.val);
        }
        let result;
        if (r.typ == EnumToken.NumberTokenType || op == EnumToken.Div) {
            result = { ...l, val };
        }
        else {
            // @ts-ignore
            result = { ...r, val };
        }
        if (renderToken(result).length <= renderToken(defaultReturn).length) {
            return result;
        }
    }
    return defaultReturn;
}
function evaluate(tokens) {
    tokens = inlineExpression(evaluateExpression(buildExpression(tokens)));
    if (tokens.length <= 1) {
        return tokens;
    }
    const map = new Map;
    let token;
    let i;
    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        if (token.typ == EnumToken.Add) {
            continue;
        }
        if (token.typ == EnumToken.Sub) {
            if (!isScalarToken(tokens[i + 1])) {
                token = { typ: EnumToken.ListToken, chi: [tokens[i], tokens[i + 1]] };
            }
            else {
                token = doEvaluate(tokens[i + 1], { typ: EnumToken.NumberTokenType, val: '-1' }, EnumToken.Mul);
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
function inlineExpression(token) {
    const result = [];
    if (token.typ == EnumToken.BinaryExpressionTokenType) {
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
function evaluateExpression(token) {
    if (token.typ != EnumToken.BinaryExpressionTokenType) {
        return token;
    }
    if (token.r.typ == EnumToken.BinaryExpressionTokenType) {
        token.r = doEvaluate(token.r.l, token.r.r, token.r.op);
    }
    if (token.l.typ == EnumToken.BinaryExpressionTokenType) {
        token.l = doEvaluate(token.l.l, token.l.r, token.l.op);
    }
    return doEvaluate(token.l, token.r, token.op);
}
function isScalarToken(token) {
    return token.typ != EnumToken.ParensTokenType && token.typ != EnumToken.FunctionTokenType;
}
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
function factorToken(token) {
    if (token.typ == EnumToken.ParensTokenType || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc')) {
        return buildExpression(token.chi);
    }
    return token;
}
function factor(tokens, ops) {
    let isOp;
    const opList = [EnumToken.Add, EnumToken.Sub, EnumToken.Div, EnumToken.Mul];
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

export { ComputeCalcExpression, evaluate };
