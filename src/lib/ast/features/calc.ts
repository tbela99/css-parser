import {
    AstAtRule,
    AstDeclaration,
    AstRule,
    BinaryExpressionNode,
    BinaryExpressionToken,
    FractionToken,
    FunctionToken,
    LiteralToken,
    MinifyOptions,
    ParensToken,
    Token
} from "../../../@types";
import {EnumToken} from "../types";
import {reduceNumber} from "../../renderer";
import {walkValues} from "../walk";
import {MinifyFeature} from "../utils";
import {compute} from "./utils";

export class ComputeCalcExpression extends MinifyFeature {

    static get ordering(): number {
        return 1;
    }

    static register(options: MinifyOptions):void {

        if (options.computeCalcExpression) {

            for (const feature of options.features) {

                if (feature instanceof ComputeCalcExpression) {

                    return
                }
            }

            // @ts-ignore
            options.features.push(new ComputeCalcExpression());
        }
    }

    run(ast: AstRule | AstAtRule): AstRule | AstAtRule {

        if (!('chi' in ast)) {

            return ast;
        }

        // @ts-ignore
        for (const node of ast.chi) {

            if (node.typ != EnumToken.DeclarationNodeType) {

                continue;
            }

            const set: Set<Token> = new Set;

            for (const {parent} of walkValues((<AstDeclaration>node).val)) {

                if (parent != null && parent.typ == EnumToken.FunctionTokenType && parent.val == 'calc') {

                    if (!set.has(<FunctionToken>parent)) {

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
function doEvaluate(l: Token, r: Token, op: EnumToken.Add | EnumToken.Sub | EnumToken.Div | EnumToken.Mul): Token {

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
        if (l.typ != r.typ) {

            return defaultReturn;
        }
    }

    const typ: EnumToken = l.typ == EnumToken.NumberTokenType ? r.typ : l.typ;

    // @ts-ignore
    const val: number | FractionToken = compute(typeof l.val == 'string' ? +l.val :  l.val, typeof r.val == 'string' ? +r.val : r.val, op);

    return <Token>{...(l.typ == EnumToken.NumberTokenType ? r : l), typ, val : typeof val == 'number' ? reduceNumber(val) : val};
}

/**
 * evaluate an array of tokens
 * @param tokens
 */
function evaluate(tokens: Token[]): Token[] {

    const nodes: Token[] = inlineExpression(evaluateExpression(buildExpression(tokens)));

    if (nodes.length <= 1) {

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
 * convert BinaryExpression into an array
 * @param token
 */
function inlineExpression(token: Token): Token[] {

    const result: Token[] = [];

    if (token.typ == EnumToken.ParensTokenType && token.chi.length == 1) {

        result.push(token.chi[0]);
    }

    else if (token.typ == EnumToken.BinaryExpressionTokenType) {

        if ([EnumToken.Mul, EnumToken.Div].includes(token.op)) {

            result.push(token);
        } else {

            result.push(...inlineExpression(token.l), {typ: token.op}, ...inlineExpression(token.r));
        }
    }   else {

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

    if (token.r.typ == EnumToken.BinaryExpressionTokenType) {

        token.r = <BinaryExpressionNode>evaluateExpression(token.r);
    }

    if (token.l.typ == EnumToken.BinaryExpressionTokenType) {

        token.l = <BinaryExpressionNode>evaluateExpression(token.l);
    }

    return doEvaluate(token.l, token.r, token.op);
}

function isScalarToken(token: Token): boolean {

    return token.typ != EnumToken.BinaryExpressionTokenType && token.typ != EnumToken.ParensTokenType && token.typ != EnumToken.FunctionTokenType;
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
