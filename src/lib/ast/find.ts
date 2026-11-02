import type { Token } from "../../@types/token.d.ts";
import type { AstNode, AstValueMatcher, TokenSearchResult } from "../../@types/ast.d.ts";
import { EnumAstNodeStatus } from "./types.ts";
import { walk, walkValues } from "./walk.ts";
import type { AstArena } from "./arena.ts";

/**
 * node matcher
 */
export type AstNodeMatcher = (node: AstNode, arena: AstArena, parent?: AstNode | null) => boolean;

/**
 * Search the ast subtree and return the first match
 *
 * ```ts
 * // find the first ast declaration node which name is 'aspect-ratio'
 * import { find, EnumToken, transform } from "@tbela99/css-parser";
 *
 * const css = `
 *
 * button {
 *   aspect-ratio: 1;
 *   width: if(media(any-pointer: fine): 30px; else: 44px);
 * }
 * `;
 *
 * const result = await transform(css);
 * const arena = result.arena;
 * const nodeMatcher = (node: number) =>
 *     arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.strings[arena.name[node]] == 'aspect-ratio';
 *
 * const node = find(arena, result.ast, nodeMatcher);
 * console.log(arena.toObject(node));
 * ```
 *
 * @param arena
 * @param ast
 * @param matcher
 * @returns
 */
export function find(arena: AstArena, ast: AstNode, matcher: AstNodeMatcher): AstNode | null {
    for (const r of walk(arena, ast)) {
        if (matcher(r.node as AstNode, arena, r.parent as AstNode)) {
            return r.node as AstNode;
        }
    }

    return null;
}

/**
 * Search the ast sub-tree by checking each node's value token and return the first match
 *
 * ```ts
 * // find the first ast node which contains the length token '30px'
 * import { findByValue, EnumToken, transform } from "@tbela99/css-parser";
 *
 * const result = await transform(css);
 * const nodeMatcher = (value: Token) =>
 *     value.typ == EnumToken.LengthTokenType && value.val == 30 && value.unit == 'px';
 *
 * const { node, value } = findByValue(result.arena, result.ast, nodeMatcher) ?? {};
 * ```
 *
 * @param arena
 * @param ast
 * @param matcher
 * @returns
 */
export function findByValue(
    arena: AstArena,
    ast: AstNode,
    matcher: AstValueMatcher,
): { node: AstNode; value: TokenSearchResult } | null {
    let source: Token[] | null | undefined;

    for (const r1 of walk(arena, ast)) {
        const node: AstNode = r1.node as AstNode;

        if (arena.firstToken[node] == 0) {
            continue;
        }

        source = arena.tokens(node);

        for (const r2 of walkValues(arena, source, node)) {
            if (matcher(r2.value, node)) {
                return {
                    node,
                    // @ts-ignore
                    value: { node: r2.value, parent: r2.parent, root: r2.root, parents: r2.parents },
                } as { node: AstNode; value: TokenSearchResult };
            }
        }
    }

    return null;
}

/**
 * Search the ast sub-tree and return all matches
 *
 * @param arena
 * @param ast
 * @param matcher
 * @returns
 */
export function findAll(arena: AstArena, ast: AstNode, matcher: AstNodeMatcher): AstNode[] {
    const result: AstNode[] = [];

    for (const r of walk(arena, ast)) {
        if (matcher(r.node as AstNode, arena, r.parent as AstNode)) {
            result.push(r.node as AstNode);
        }
    }

    return result;
}

/**
 * Search the ast tree and return the last node matching the specified criteria.
 *
 * @param arena
 * @param ast
 * @param matcher
 * @returns
 */
export function findLast(arena: AstArena, ast: AstNode, matcher: AstNodeMatcher): AstNode | null {
    for (const r of walk(arena, ast, null, true)) {
        if (matcher(r.node as AstNode, arena, r.parent as AstNode)) {
            return r.node as AstNode;
        }
    }

    return null;
}

/**
 * Find the node's value token matching the specified criteria.
 *
 * @param arena
 * @param ast ast node id or token
 * @param matcher
 * @returns
 */
export function findValue(
    arena: AstArena,
    ast: AstNode | Token,
    matcher: (
        node: Token,
        parent?: AstNode | Token | null,
        root?: AstNode | null,
        parents?: Generator<Token> | null,
    ) => boolean,
): TokenSearchResult | null {
    if (ast == null || ast == 0) {
        return null;
    }

    const isNode: boolean = (arena.flags[ast] & (EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues)) != 0;

    if (!isNode) {
        // token: the token itself is tested first
        const parent: Token | null = arena.parents[ast] == 0 ? null : arena.parents[ast];

        if (matcher(ast, parent)) {
            return { node: ast, parent, root: null, parents: null };
        }
    }

    // prelude tokens, declaration values or token children
    const tokens: Token[] = arena.subTokens(ast);

    if (tokens.length > 0) {
        for (const { value, parent, root: rootNode, parents } of walkValues(arena, tokens, ast)) {
            // @ts-ignore
            if (matcher(value, parent, rootNode, parents)) {
                // @ts-ignore
                return { node: value, parent, root: rootNode, parents };
            }
        }
    }

    return null;
}
