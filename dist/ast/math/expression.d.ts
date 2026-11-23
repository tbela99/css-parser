import type { Token } from "../../../@types/index.d.ts";
import { type AstArena } from "../arena.ts";
/**
 * evaluate an array of tokens. the tokens are cloned: the result does not share any token with the input
 * @param arena
 * @param tokens
 */
export declare function evaluate(arena: AstArena, tokens: Token[]): Token[];
/**
 * evaluate a math function
 * @param arena
 * @param token
 */
export declare function evaluateFunc(arena: AstArena, token: Token): Token[] | null;
/**
 * convert BinaryExpression into an array
 * @param arena
 * @param token
 */
export declare function inlineExpression(arena: AstArena, token: Token): Token[];
/**
 *
 * generate a binary expression tree
 * @param arena
 * @param tokens
 */
export declare function buildExpression(arena: AstArena, tokens: Token[]): Token;
