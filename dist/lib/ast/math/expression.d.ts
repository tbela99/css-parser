import type { BinaryExpressionToken, FunctionToken, Token } from "../../../@types/index.d.ts";
/**
 * evaluate an array of tokens
 * @param tokens
 */
export declare function evaluate(tokens: Token[]): Token[];
export declare function evaluateFunc(token: FunctionToken): Token[];
/**
 * convert BinaryExpression into an array
 * @param token
 */
export declare function inlineExpression(token: Token): Token[];
/**
 *
 * generate a binary expression tree
 * @param tokens
 */
export declare function buildExpression(tokens: Token[]): BinaryExpressionToken;
