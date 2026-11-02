import type { AstNode } from "../../@types/index.d.ts";
import type { Token } from "../../@types/token.d.ts";
import type { AstArena } from "./arena.ts";

/**
 * Clone an ast node
 *
 * The clone is allocated in the arena, detached from the tree.
 *
 * @param arena
 * @param node node id
 * @param cloneChildren also clone the children (rules) or the value tokens (declarations)
 * @param cloneMap map of the source tokens to their clones
 * @returns the clone id
 */
export function cloneNode(
    arena: AstArena,
    node: AstNode,
    cloneChildren: boolean = false,
    cloneMap: Map<Token, Token> | null = null,
): AstNode {
    return arena.clone(node, cloneChildren, cloneMap);
}

/**
 * Deep clone a token
 * @param arena
 * @param token
 * @param cloneMap map of the source tokens to their clones
 */
export function cloneValue(arena: AstArena, token: Token, cloneMap: Map<Token, Token> | null = null): Token {
    return arena.clone(token, true, cloneMap);
}
