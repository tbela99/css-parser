import type { AstNode } from "../../../@types/ast.d.ts";
import type { BinaryExpressionToken, Token } from "../../../@types/token.ts";
/**
 * replace token in its parent node
 * @param parent
 * @param value
 * @param replacement
 */
export declare function replaceToken(parent: BinaryExpressionToken | (AstNode & ({
    chi: Token[];
} | {
    val: Token[];
})), value: Token, replacement: Token | Token[]): void;
export declare function trimWhiteSpaceTokens(tokens: Token[]): Token[];
