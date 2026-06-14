import { EnumToken } from './types.js';

/**
 *
 * @param node he nod to clone
 * @param cloneChildren deep clone
 * @param cloneMap a map of existing children as keys and their clones as values
 * @returns
 */
function cloneNode(node, cloneChildren = false, cloneMap = null) {
    const checkNode = node.typ == EnumToken.DeclarationNodeType ? "val" : "chi";
    const clone = {};
    const properties = {};
    cloneMap?.set?.(node, clone);
    for (const [name, value] of Object.entries(Object.getOwnPropertyDescriptors(node))) {
        // @ts-expect-error
        if (value.value == null || typeof value.value != "object" || name == "parent") {
            // @ts-expect-error
            properties[name] = { ...value };
            // @ts-expect-error
        }
        else if (Array.isArray(value.value)) {
            // @ts-expect-error
            properties[name] = {
                // @ts-expect-error
                ...value,
                value: !cloneChildren && name == checkNode
                    ? []
                    : // @ts-expect-error
                        value.value.map((c) => {
                            const newObj = cloneNode(c, cloneChildren, cloneMap);
                            cloneMap?.set?.(c, newObj);
                            return newObj;
                        }),
            };
        }
        else {
            // @ts-expect-error
            properties[name] = { ...value, value: cloneNode(value.value, clone) };
        }
    }
    return Object.defineProperties(clone, properties);
}

export { cloneNode };
