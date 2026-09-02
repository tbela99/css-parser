import { TOKENS, ERRORS, STATE, LOCSRCID, LOCSTA, LOCEND, PARENT } from '../syntax/constants.js';

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
            return node[LOCSRCID] == null && node[LOCSTA] == null && node[LOCEND] == null ? null : { srcId: node[LOCSRCID], sta: node[LOCSTA], end: node[LOCEND] };
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
            node[LOCSRCID] = value.srcId;
            node[LOCSTA] = value.sta;
            node[LOCEND] = value.end;
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
