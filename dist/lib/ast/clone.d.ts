import type { AstNode } from "../../@types/index.d.ts";
import type { Token } from "../../@types/token.d.ts";
/**
 *
 * Clone an ast node or value
 * @param node
 * @param cloneChildren
 * @param cloneMap
 * @returns
 */
export declare function cloneNode(node: AstNode | Token, cloneChildren?: boolean, cloneMap?: Map<Token | AstNode, Token | AstNode> | null): AstNode | Token;
