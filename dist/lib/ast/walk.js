import { EnumToken } from './types.js';

function* walk(node, filter) {
    const parents = [node];
    const root = node;
    const map = new Map;
    while ((node = parents.shift())) {
        let option = null;
        if (filter != null) {
            option = filter(node);
            if (option === 'ignore') {
                continue;
            }
            if (option === 'stop') {
                break;
            }
        }
        // @ts-ignore
        if (option !== 'children') {
            // @ts-ignore
            yield { node, parent: map.get(node), root };
        }
        if (option !== 'ignore-children' && 'chi' in node) {
            parents.unshift(...node.chi);
            for (const child of node.chi.slice()) {
                map.set(child, node);
            }
        }
    }
}
function* walkValues(values, root = null, filter) {
    const stack = values.slice();
    const map = new Map;
    const parentMap = new Map;
    let value;
    let previous = null;
    while ((value = stack.shift())) {
        let option = null;
        if (filter != null) {
            option = filter(value);
            if (option === 'ignore') {
                continue;
            }
            if (option === 'stop') {
                break;
            }
        }
        // @ts-ignore
        if (option !== 'children') {
            let list = parentMap.get(value) ?? null;
            if (Array.isArray(list)) {
                list.shift();
                if (list.length === 0) {
                    parentMap.delete(value);
                    list = null;
                }
            }
            // @ts-ignore
            yield { value, parent: map.get(value), previousValue: previous, nextValue: stack[0] ?? null, root, list };
        }
        if (option !== 'ignore-children' && 'chi' in value) {
            const parents = value.chi.slice();
            for (const child of parents.slice()) {
                parentMap.set(child, parents);
                map.set(child, value);
            }
            stack.unshift(...value.chi);
        }
        else if (value.typ == EnumToken.BinaryExpressionTokenType) {
            map.set(value.l, value);
            map.set(value.r, value);
            stack.unshift(value.l, value.r);
        }
        previous = value;
    }
}

export { walk, walkValues };
