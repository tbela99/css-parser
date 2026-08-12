import { EnumToken } from './types.js';

/**
 *
 * Clone an ast node or value
 * @param node
 * @param cloneChildren
 * @param cloneMap
 * @returns
 */
function cloneNode(node, cloneChildren = false, cloneMap = null) {
    const checkNode = node.typ == EnumToken.DeclarationNodeType ? "val" : "chi";
    const clone = {};
    cloneMap?.set?.(node, clone);
    for (const [name, value] of Object.entries(node)) {
        if (value == null || typeof value != "object") {
            clone[name] = value;
        }
        else if (Array.isArray(value)) {
            clone[name] = [];
            if (cloneChildren || name !== checkNode) {
                for (const c of value) {
                    const newObj = cloneNode(c, cloneChildren, cloneMap);
                    cloneMap?.set?.(c, newObj);
                    clone[name].push(newObj);
                }
            }
        }
        else {
            clone[name] = { ...value };
        }
    }
    for (const symbol of Object.getOwnPropertySymbols(node)) {
        clone[symbol] = node[symbol];
    }
    return clone;
}

export { cloneNode };
