import { TOKENS, ERRORS, STATE, LOC, PARENT } from '../syntax/constants.js';

/**
 *
 * @param node
 * @param key
 * @returns
 */
function getNodeProperty(node, key) {
    switch (key) {
        case "parent":
            return node[PARENT];
        case "location":
            return node[LOC];
        case "state":
            return node[STATE];
        case "errors":
            return node[ERRORS];
        case "tokens":
            return node[TOKENS];
    }
    return undefined;
}
/**
 *
 * @param node
 * @param key
 * @param value
 */
function setNodeProperty(node, key, value) {
    switch (key) {
        case "parent":
            node[PARENT] = value;
            break;
        case "location":
            node[LOC] = value;
            break;
        case "state":
            node[STATE] = value;
            break;
        case "errors":
            node[ERRORS] = value;
            break;
        case "tokens":
            node[TOKENS] = value;
            break;
    }
}

export { getNodeProperty, setNodeProperty };
