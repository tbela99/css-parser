import type { AstNode } from "../../../@types/ast.d.ts";
import type { BinaryExpressionToken, Token } from "../../../@types/token.d.ts";
/**
 * Replace token in its parent node
 * @param parent
 * @param node
 * @param replacement
 * @throws TypeError replacement is null
 * @throws ReferenceError node not found in parent
 */
export declare function replaceNodeOrValue(parent: BinaryExpressionToken | (AstNode & ({
    chi: Token[];
} | {
    val: Token[];
})), node: Token, replacement: Token | Token[]): boolean;
export declare function trimWhiteSpaceTokens(tokens: Token[]): Token[];
