import { EnumToken } from './types.js';

var WalkerValueEvent;
(function (WalkerValueEvent) {
    WalkerValueEvent[WalkerValueEvent["Enter"] = 0] = "Enter";
    WalkerValueEvent[WalkerValueEvent["Leave"] = 1] = "Leave";
})(WalkerValueEvent || (WalkerValueEvent = {}));
/**
 * walk ast nodes
 * @param node
 * @param filter
 */
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
/**
 * walk ast values
 * @param values
 * @param root
 * @param filter
 * @param reverse
 */
function* walkValues(values, root = null, filter, reverse) {
    // const set = new Set<Token>();
    const stack = values.slice();
    const map = new Map;
    let previous = null;
    // let parent: FunctionToken | ParensToken | BinaryExpressionToken | null = null;
    if (filter != null && typeof filter == 'function') {
        filter = {
            event: WalkerValueEvent.Enter,
            fn: filter
        };
    }
    else if (filter == null) {
        filter = {
            event: WalkerValueEvent.Enter
        };
    }
    while (stack.length > 0) {
        let value = reverse ? stack.pop() : stack.shift();
        let option = null;
        if (filter.fn != null && filter.event == WalkerValueEvent.Enter) {
            const isValid = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));
            if (isValid) {
                option = filter.fn(value, map.get(value) ?? root, WalkerValueEvent.Enter);
                if (option === 'ignore') {
                    continue;
                }
                if (option === 'stop') {
                    break;
                }
                // @ts-ignore
                if (option != null && typeof option == 'object' && 'typ' in option) {
                    map.set(option, map.get(value) ?? root);
                }
            }
        }
        // @ts-ignore
        if (filter.event == WalkerValueEvent.Enter && option !== 'children') {
            yield {
                value,
                parent: map.get(value) ?? root,
                previousValue: previous,
                nextValue: stack[0] ?? null,
                // @ts-ignore
                root: root ?? null
            };
        }
        if (option !== 'ignore-children' && 'chi' in value) {
            const sliced = value.chi.slice();
            for (const child of sliced) {
                map.set(child, value);
            }
            if (reverse) {
                stack.push(...sliced);
            }
            else {
                stack.unshift(...sliced);
            }
        }
        else if (value.typ == EnumToken.BinaryExpressionTokenType) {
            map.set(value.l, map.get(value) ?? root);
            map.set(value.r, map.get(value) ?? root);
            stack.unshift(value.l, value.r);
        }
        if (filter.event == WalkerValueEvent.Leave && filter.fn != null) {
            const isValid = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));
            if (isValid) {
                option = filter.fn(value, map.get(value), WalkerValueEvent.Leave);
                // @ts-ignore
                if (option != null && 'typ' in option) {
                    map.set(option, map.get(value) ?? root);
                }
            }
        }
        // @ts-ignore
        if (filter.event == WalkerValueEvent.Leave && option !== 'children') {
            yield {
                value,
                parent: map.get(value) ?? root,
                previousValue: previous,
                nextValue: stack[0] ?? null,
                // @ts-ignore
                root: root ?? null
            };
        }
        previous = value;
    }
}

export { WalkerValueEvent, walk, walkValues };
