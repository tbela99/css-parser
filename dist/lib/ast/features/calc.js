import { EnumToken } from '../types.js';
import { reduceNumber, renderToken } from '../../renderer/render.js';
import { walkValues } from '../walk.js';
import { MinifyFeature } from '../utils/minifyfeature.js';

class ComputeCalcExpression extends MinifyFeature {
    static get ordering() {
        return 1;
    }
    static register(options) {
        if (options.computeCalcExpression) {
            for (const feature of options.features) {
                if (feature instanceof ComputeCalcExpression) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new ComputeCalcExpression());
        }
    }
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
                    if (!set.has(parent)) {
                        set.add(parent);
                        parent.chi = evaluate(parent.chi);
                    }
                }
            }
        }
        return ast;
    }
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
 * convert BinaryExpression into an array
 * @param token
 */
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
    const result = doEvaluate(token.l, token.r, token.op);
    if (result.typ == EnumToken.BinaryExpressionTokenType &&
        [EnumToken.Mul, EnumToken.Div].includes(result.op)) {
        // wrap expression
        if (result.l.typ == EnumToken.BinaryExpressionTokenType && [EnumToken.Sub, EnumToken.Add].includes(result.l.op)) {
            result.l = { typ: EnumToken.ParensTokenType, chi: [result.l] };
        }
        else if (result.r.typ == EnumToken.BinaryExpressionTokenType && [EnumToken.Sub, EnumToken.Add].includes(result.r.op)) {
            result.r = { typ: EnumToken.ParensTokenType, chi: [result.r] };
        }
    }
    return result;
}
function isScalarToken(token) {
    return token.typ != EnumToken.BinaryExpressionTokenType && token.typ != EnumToken.ParensTokenType && token.typ != EnumToken.FunctionTokenType;
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
    const opList = [EnumToken.Add, EnumToken.Sub, EnumToken.Div, EnumToken.Mul];
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

export { ComputeCalcExpression };