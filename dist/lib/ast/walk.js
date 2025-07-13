var WalkerOptionEnum;
(function (WalkerOptionEnum) {
    WalkerOptionEnum[WalkerOptionEnum["Ignore"] = 0] = "Ignore";
    WalkerOptionEnum[WalkerOptionEnum["Stop"] = 1] = "Stop";
    WalkerOptionEnum[WalkerOptionEnum["Children"] = 2] = "Children";
    WalkerOptionEnum[WalkerOptionEnum["IgnoreChildren"] = 3] = "IgnoreChildren";
})(WalkerOptionEnum || (WalkerOptionEnum = {}));
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
            if (option === WalkerOptionEnum.Ignore) {
                continue;
            }
            if (option === WalkerOptionEnum.Stop) {
                break;
            }
        }
        // @ts-ignore
        if (option !== 'children') {
            // @ts-ignore
            yield { node, parent: map.get(node), root };
        }
        if (option !== WalkerOptionEnum.IgnoreChildren && 'chi' in node) {
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
    const eventType = filter.event ?? WalkerValueEvent.Enter;
    while (stack.length > 0) {
        let value = reverse ? stack.pop() : stack.shift();
        let option = null;
        if (filter.fn != null && eventType == WalkerValueEvent.Enter) {
            const isValid = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));
            if (isValid) {
                option = filter.fn(value, map.get(value) ?? root);
                if (option === WalkerOptionEnum.Ignore) {
                    continue;
                }
                if (option === WalkerOptionEnum.Stop) {
                    break;
                }
                // @ts-ignore
                if (option != null && typeof option == 'object' && 'typ' in option) {
                    map.set(option, map.get(value) ?? root);
                }
            }
        }
        if (eventType == WalkerValueEvent.Enter && option !== WalkerOptionEnum.Children) {
            yield {
                value,
                parent: map.get(value) ?? root,
                previousValue: previous,
                nextValue: stack[0] ?? null,
                // @ts-ignore
                root: root ?? null
            };
        }
        if (option !== WalkerOptionEnum.IgnoreChildren && 'chi' in value) {
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
        else {
            const values = [];
            if ('l' in value && value.l != null) {
                // @ts-ignore
                values.push(value.l);
                // @ts-ignore
                map.set(value.l, value);
            }
            if ('op' in value && typeof value.op == 'object') {
                values.push(value.op);
                // @ts-ignore
                map.set(value.op, value);
            }
            if ('r' in value && value.r != null) {
                if (Array.isArray(value.r)) {
                    for (const r of value.r) {
                        // @ts-ignore
                        values.push(r);
                        // @ts-ignore
                        map.set(r, value);
                    }
                }
                else {
                    // @ts-ignore
                    values.push(value.r);
                    // @ts-ignore
                    map.set(value.r, value);
                }
            }
            if (values.length > 0) {
                stack.unshift(...values);
            }
        }
        if (eventType == WalkerValueEvent.Leave && filter.fn != null) {
            const isValid = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));
            if (isValid) {
                option = filter.fn(value, map.get(value));
                // @ts-ignore
                if (option != null && 'typ' in option) {
                    map.set(option, map.get(value) ?? root);
                }
            }
        }
        if (eventType == WalkerValueEvent.Leave && option !== WalkerOptionEnum.Children) {
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

export { WalkerOptionEnum, WalkerValueEvent, walk, walkValues };
