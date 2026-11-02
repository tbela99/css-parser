/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumAstNodeStatus } from './types.js';
import { walk, walkValues } from './walk.js';

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
function find(arena, ast, matcher) {
    for (const r of walk(arena, ast)) {
        if (matcher(r.node, arena, r.parent)) {
            return r.node;
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
function findByValue(arena, ast, matcher) {
    let source;
    for (const r1 of walk(arena, ast)) {
        const node = r1.node;
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
                };
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
function findAll(arena, ast, matcher) {
    const result = [];
    for (const r of walk(arena, ast)) {
        if (matcher(r.node, arena, r.parent)) {
            result.push(r.node);
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
function findLast(arena, ast, matcher) {
    for (const r of walk(arena, ast, null, true)) {
        if (matcher(r.node, arena, r.parent)) {
            return r.node;
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
function findValue(arena, ast, matcher) {
    if (ast == null || ast == 0) {
        return null;
    }
    const isNode = (arena.flags[ast] & (EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues)) != 0;
    if (!isNode) {
        // token: the token itself is tested first
        const parent = arena.parents[ast] == 0 ? null : arena.parents[ast];
        if (matcher(ast, parent)) {
            return { node: ast, parent, root: null, parents: null };
        }
    }
    // prelude tokens, declaration values or token children
    const tokens = arena.subTokens(ast);
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

export { find, findAll, findByValue, findLast, findValue };
