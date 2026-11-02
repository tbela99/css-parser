/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
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
function cloneNode(arena, node, cloneChildren = false, cloneMap = null) {
    return arena.clone(node, cloneChildren, cloneMap);
}
/**
 * Deep clone a token
 * @param arena
 * @param token
 * @param cloneMap map of the source tokens to their clones
 */
function cloneValue(arena, token, cloneMap = null) {
    return arena.clone(token, true, cloneMap);
}

export { cloneNode, cloneValue };
