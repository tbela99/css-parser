import {
    AstAtRule,
    AstDeclaration,
    AstRule,
    AstRuleStyleSheet,
    BinaryExpressionNode,
    BinaryExpressionToken,
    DimensionToken,
    FunctionToken,
    LiteralToken,
    NumberToken,
    ParensToken,
    PropertyListOptions,
    Token
} from "../../../@types";
import {EnumToken, NodeType} from "../types";
import {reduceNumber, renderToken} from "../../renderer";
import {walkValues} from "../walk";

export class ComputeCalcExpression {

    run(ast: AstRule | AstAtRule) {

        if (!('chi' in ast)) {

            return ast;
        }

        // @ts-ignore
        for (const node of ast.chi) {

            if (node.typ != NodeType.DeclarationNodeType) {

                continue;
            }

            const set: Set<Token> = new Set;

            for (const {parent} of walkValues((<AstDeclaration>node).val)) {

                if (parent != null && parent.typ == EnumToken.FunctionTokenType && parent.val == 'calc') {

                    if (set.has(<FunctionToken>parent)) {

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

function doEvaluate(l: Token, r: Token, op: EnumToken.Add | EnumToken.Sub | EnumToken.Div | EnumToken.Mul) {

    const defaultReturn: BinaryExpressionToken = <BinaryExpressionToken>{
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
        return <Token>{...l, val: reduceNumber(+l.val + (op == EnumToken.Add ? +r.val : -1 * r.val))}
    } else {

        // @ts-ignore
        let val;

        if (op == EnumToken.Div) {

            if (r.typ != EnumToken.NumberTokenType || r.val == '0') {

                return defaultReturn;
            }

            // @ts-ignore
            val = reduceNumber((<NumberToken | DimensionToken>l).val / (<NumberToken>r).val);
        } else {

            // @ts-ignore
            val = reduceNumber((<NumberToken | DimensionToken>r).val * (<NumberToken>l).val);
        }

        let result: Token;

        if (r.typ == EnumToken.NumberTokenType || op == EnumToken.Div) {

            result = <Token>{...l, val}
        } else {

            // @ts-ignore
            result = <Token>{...r, val}
        }

        if (renderToken(result).length <= renderToken(defaultReturn).length) {

            return result;
        }
    }

    return defaultReturn;
}

export function evaluate(tokens: Token[]): Token[] {

    tokens = inlineExpression(evaluateExpression(buildExpression(tokens)));

    if (tokens.length <= 1) {

        return tokens;
    }

    const map: Map<EnumToken, Token[]> = new Map;
    let token: Token;
    let i: number;

    for (i = 0; i < tokens.length; i++) {

        token = tokens[i];

        if (token.typ == EnumToken.Add) {

            continue;
        }

        if (token.typ == EnumToken.Sub) {

            if (!isScalarToken(<Token>tokens[i + 1])) {

                token = {typ: EnumToken.ListToken, chi: [tokens[i], tokens[i + 1]]};
            }

            else {

                token = doEvaluate(<Token>tokens[i + 1], {typ: EnumToken.NumberTokenType, val: '-1'}, EnumToken.Mul);
            }

            i++;
        }

        if (!map.has(token.typ)) {

            map.set(token.typ, [token]);
        }

        else {

            (<Token[]> map.get(token.typ)).push(token);
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

function inlineExpression(token: Token) {

    const result: Token[] = [];

    if (token.typ == EnumToken.BinaryExpressionTokenType) {

        if ([EnumToken.Mul, EnumToken.Div].includes(token.op)) {

            result.push(token);
        } else {

            result.push(...inlineExpression(token.l), {typ: token.op}, ...inlineExpression(token.r));
        }
    } else {

        result.push(token);
    }

    return result;
}

function evaluateExpression(token: Token) {

    if (token.typ != EnumToken.BinaryExpressionTokenType) {

        return token;
    }

    if (token.r.typ == EnumToken.BinaryExpressionTokenType) {

        token.r = <BinaryExpressionNode>doEvaluate(token.r.l, token.r.r, token.r.op);
    }

    if (token.l.typ == EnumToken.BinaryExpressionTokenType) {

        token.l = <BinaryExpressionNode>doEvaluate(token.l.l, token.l.r, token.l.op);
    }

    return doEvaluate(token.l, token.r, token.op);
}

function isScalarToken(token: Token) {

    return token.typ != EnumToken.ParensTokenType && token.typ != EnumToken.FunctionTokenType;
}

function buildExpression(tokens: Token[]): BinaryExpressionToken {

    return <BinaryExpressionToken>factor(factor(tokens.filter(t => t.typ != EnumToken.WhitespaceTokenType), ['/', '*']), ['+', '-'])[0];
}

function getArithmeticOperation(op: '+' | '-' | '/' | '*') {

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

function factorToken(token: Token): Token {

    if (token.typ == EnumToken.ParensTokenType || (token.typ == EnumToken.FunctionTokenType && (<FunctionToken>token).val == 'calc')) {

        return buildExpression((<ParensToken>token).chi);
    }

    return token;
}

function factor(tokens: Array<Token | BinaryExpressionToken>, ops: Array<'+' | '-' | '/' | '*'>): Token[] {

    let isOp: boolean;
    const opList: EnumToken[] = [EnumToken.Add, EnumToken.Sub, EnumToken.Div, EnumToken.Mul];

    for (let i = 0; i < tokens.length; i++) {

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
