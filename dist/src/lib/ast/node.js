/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumAstNodeStatus } from './types.js';

/**
 * Read a node property
 * @param arena
 * @param node
 * @param key
 * @returns
 */
function getNodeProperty(arena, node, key) {
    switch (key) {
        case "parent":
            return arena.parents[node];
        case "location":
            return arena.getLocation(node);
        case "state":
            return arena.flags[node] & EnumAstNodeStatus.StateMask;
        case "errors":
            return arena.errors.get(node) ?? null;
        case "tokens":
            return arena.firstToken[node] == 0 ? null : arena.tokens(node);
        case "selector":
            return arena.strings[arena.name[node]] ?? null;
    }
    return undefined;
}
/**
 * Set a node property
 * @param arena
 * @param node
 * @param key
 * @param value
 */
function setNodeProperty(arena, node, key, value) {
    switch (key) {
        case "parent":
            // move the node at the end of the parent children
            arena.appendChildren(value, node);
            break;
        case "location":
            arena.setLocation(node, value?.srcId, value?.sta, value?.end);
            break;
        case "state":
            arena.setState(node, value);
            break;
        case "errors":
            if (value == null) {
                arena.errors.delete(node);
            }
            else {
                arena.errors.set(node, value);
            }
            break;
        case "tokens":
            arena.setTokenList(node, (value ?? []));
            break;
        case "selector":
            arena.name[node] = arena.internString(value);
            break;
    }
}

export { getNodeProperty, setNodeProperty };
