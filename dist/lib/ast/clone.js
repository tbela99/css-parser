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
            clone[name] =
                !cloneChildren && name == checkNode
                    ? []
                    : value.map((c) => {
                        const newObj = cloneNode(c, cloneChildren, cloneMap);
                        cloneMap?.set?.(c, newObj);
                        return newObj;
                    });
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
