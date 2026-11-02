/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';
import { tokensfuncSet } from '../../syntax/constants.js';

const trimTokenSpace = new Set([
    EnumToken.CommaTokenType,
    EnumToken.DelimTokenType,
    EnumToken.GtTokenType,
    EnumToken.GteTokenType,
    EnumToken.LtTokenType,
    EnumToken.LteTokenType,
    EnumToken.ChildCombinatorTokenType,
    EnumToken.PipeTokenType,
    EnumToken.ColonTokenType,
]);
const trimSpaceAfter = new Set([
    ...tokensfuncSet.values(),
    EnumToken.ChildCombinatorTokenType,
    EnumToken.SupportsQueryConditionTokenType,
    EnumToken.SupportsQueryUnaryConditionTokenType,
    EnumToken.CommaTokenType,
    EnumToken.PipeTokenType,
]);
/**
 * Replace a value token in its parent (token list of a node, function arguments or structured token field)
 * @param arena
 * @param parent parent token or node id. the token must be attached to this parent
 * @param node token id
 * @param replacement token id(s)
 * @throws TypeError replacement is null
 * @throws ReferenceError node not found in parent
 */
function replaceNodeOrValue(arena, parent, node, replacement) {
    if (replacement == null || (Array.isArray(replacement) && replacement.length === 0)) {
        throw new TypeError(`replacement is null`);
    }
    const owner = arena.parents[node];
    if (owner == 0) {
        throw new ReferenceError("Node not found");
    }
    // structured fields are stored in list tokens
    if (parent != null && owner != parent && arena.parents[owner] != parent) {
        throw new ReferenceError("Node not found");
    }
    arena.replaceToken(node, ...(Array.isArray(replacement) ? replacement : [replacement]));
    return true;
}
/**
 * Replace an ast node in its parent
 * @param arena
 * @param node node id
 * @param replacement node ids
 * @throws TypeError replacement is null
 * @throws ReferenceError node has no parent
 */
function replaceNode(arena, node, replacement) {
    if (replacement == null || (Array.isArray(replacement) && replacement.length === 0)) {
        throw new TypeError(`replacement is null`);
    }
    if (arena.parents[node] == 0) {
        throw new ReferenceError("Node not found");
    }
    arena.replaceChild(node, ...(Array.isArray(replacement) ? replacement : [replacement]));
}
/**
 * remove leading, trailing and redundant whitespace tokens (in place)
 * @param arena
 * @param tokens
 */
function trimWhiteSpaceTokens(arena, tokens) {
    let i = 0;
    if (tokens.length > 0 && arena.dataTypes[tokens[0]] === EnumToken.WhitespaceTokenType) {
        tokens.shift();
    }
    if (tokens.length > 0 && arena.dataTypes[tokens[tokens.length - 1]] === EnumToken.WhitespaceTokenType) {
        tokens.pop();
    }
    if (tokens.length === 1) {
        if (arena.dataTypes[tokens[0]] === EnumToken.WhitespaceTokenType) {
            tokens.length = 0;
        }
        return tokens;
    }
    for (; i < tokens.length; i++) {
        if (trimTokenSpace.has(arena.dataTypes[tokens[i]])) {
            if (i + 1 < tokens.length && arena.dataTypes[tokens[i + 1]] === EnumToken.WhitespaceTokenType) {
                tokens.splice(i + 1, 1);
            }
            if (i > 0 && arena.dataTypes[tokens[i - 1]] === EnumToken.WhitespaceTokenType) {
                tokens.splice(--i, 1);
                continue;
            }
        }
        if (trimSpaceAfter.has(arena.dataTypes[tokens[i]]) &&
            i + 1 < tokens.length &&
            arena.dataTypes[tokens[i + 1]] === EnumToken.WhitespaceTokenType) {
            tokens.splice(i + 1, 1);
        }
    }
    return tokens;
}

export { replaceNode, replaceNodeOrValue, trimWhiteSpaceTokens };
