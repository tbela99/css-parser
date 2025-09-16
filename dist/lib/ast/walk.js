/**
 * options for the walk function
 */
var WalkerOptionEnum;
(function (WalkerOptionEnum) {
    /**
     * ignore the current node and its children
     */
    WalkerOptionEnum[WalkerOptionEnum["Ignore"] = 1] = "Ignore";
    /**
     * stop walking the tree
     */
    WalkerOptionEnum[WalkerOptionEnum["Stop"] = 2] = "Stop";
    /**
     * ignore node and process children
     */
    WalkerOptionEnum[WalkerOptionEnum["Children"] = 4] = "Children";
    /**
     * ignore children
     */
    WalkerOptionEnum[WalkerOptionEnum["IgnoreChildren"] = 8] = "IgnoreChildren";
})(WalkerOptionEnum || (WalkerOptionEnum = {}));
/**
 * event types for the walkValues function
 */
var WalkerEvent;
(function (WalkerEvent) {
    /**
     * enter node
     */
    WalkerEvent[WalkerEvent["Enter"] = 1] = "Enter";
    /**
     * leave node
     */
    WalkerEvent[WalkerEvent["Leave"] = 2] = "Leave";
})(WalkerEvent || (WalkerEvent = {}));
/**
 * walk ast nodes
 * @param node initial node
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * ```ts
 *
 * import {walk} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 *
 * html,
 * body {
 *     line-height: 1.474;
 * }
 *
 * .ruler {
 *
 *     height: 10px;
 * }
 * `;
 *
 * for (const {node, parent, root} of walk(ast)) {
 *
 *     // do something with node
 * }
 * ```
 *
 * Using a filter to control the walk process:
 *
 * ```ts
 *
 * import {walk} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 *
 * html,
 * body {
 *     line-height: 1.474;
 * }
 *
 * .ruler {
 *
 *     height: 10px;
 * }
 * `;
 *
 * for (const {node, parent, root} of walk(ast, (node) => {
 *
 *     if (node.typ == EnumToken.AstRule && node.sel.includes('html')) {
 *
 *         // skip the children of the current node
 *         return WalkerOptionEnum.IgnoreChildren;
 *     }
 * })) {
 *
 *     // do something with node
 * }
 * ```
 */
function* walk(node, filter, reverse) {
    const parents = [node];
    const root = node;
    const map = new Map;
    let isNumeric = false;
    while ((node = parents.shift())) {
        let option = null;
        if (filter != null) {
            option = filter(node);
            isNumeric = typeof option == 'number';
            if (isNumeric) {
                if ((option & WalkerOptionEnum.Ignore)) {
                    continue;
                }
                if ((option & WalkerOptionEnum.Stop)) {
                    break;
                }
            }
        }
        if (!isNumeric || (option & WalkerOptionEnum.Children) === 0) {
            // @ts-ignore
            yield { node, parent: map.get(node), root };
        }
        if ('chi' in node && (!isNumeric || ((option & WalkerOptionEnum.IgnoreChildren) === 0))) {
            parents.unshift(...node.chi[reverse ? 'reverse' : 'slice']());
            for (const child of node.chi.slice()) {
                map.set(child, node);
            }
        }
    }
}
/**
 * walk ast node value tokens
 * @param values
 * @param root
 * @param filter
 * @param reverse
 *
 * Example:
 *
 * ```ts
 *
 * import {EnumToken, walk} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 *
 * html,
 * body {
 *     line-height: 1.474;
 * }
 *
 * .ruler {
 *
 *     height: 10px;
 * }
 * `;
 *
 * for (const {value} of walkValues(result.ast.chi[0].chi[0].val, null, null,true)) {
 *
 *     console.error([EnumToken[value.typ], value.val]);
 * }
 *
 */
function* walkValues(values, root = null, filter, reverse) {
    // const set = new Set<Token>();
    const stack = values.slice();
    const map = new Map;
    let previous = null;
    if (filter != null && typeof filter == 'function') {
        filter = {
            event: WalkerEvent.Enter,
            fn: filter
        };
    }
    else if (filter == null) {
        filter = {
            event: WalkerEvent.Enter
        };
    }
    let isNumeric = false;
    const eventType = filter.event ?? WalkerEvent.Enter;
    while (stack.length > 0) {
        let value = reverse ? stack.pop() : stack.shift();
        let option = null;
        if (filter.fn != null && (eventType & WalkerEvent.Enter)) {
            const isValid = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));
            if (isValid) {
                option = filter.fn(value, map.get(value) ?? root, WalkerEvent.Enter);
                isNumeric = typeof option == 'number';
                if (isNumeric && (option & WalkerOptionEnum.Stop)) {
                    return;
                }
                if (isNumeric && (option & WalkerOptionEnum.Ignore)) {
                    continue;
                }
                // @ts-ignore
                if (option != null && typeof option == 'object' && 'typ' in option) {
                    map.set(option, map.get(value) ?? root);
                }
            }
        }
        // if ((eventType & WalkerValueEvent.Enter) && (!isNumeric || ((option as number) & WalkerOptionEnum.Children) === 0)) {
        yield {
            value,
            parent: map.get(value) ?? root,
            previousValue: previous,
            nextValue: stack[0] ?? null,
            // @ts-ignore
            root: root ?? null
        };
        // }
        if ('chi' in value && (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0)) {
            const sliced = value.chi.slice();
            for (const child of sliced) {
                map.set(child, value);
            }
            stack[reverse ? 'push' : 'unshift'](...sliced);
        }
        else {
            const values = [];
            if ('l' in value && value.l != null) {
                // @ts-ignore
                values[reverse ? 'push' : 'unshift'](value.l);
                // @ts-ignore
                map.set(value.l, value);
            }
            if ('op' in value && typeof value.op == 'object') {
                values[reverse ? 'push' : 'unshift'](value.op);
                // @ts-ignore
                map.set(value.op, value);
            }
            if ('r' in value && value.r != null) {
                if (Array.isArray(value.r)) {
                    for (const r of value.r) {
                        // @ts-ignore
                        values[reverse ? 'push' : 'unshift'](r);
                        // @ts-ignore
                        map.set(r, value);
                    }
                }
                else {
                    // @ts-ignore
                    values[reverse ? 'push' : 'unshift'](value.r);
                    // @ts-ignore
                    map.set(value.r, value);
                }
            }
            if (values.length > 0) {
                stack[reverse ? 'push' : 'unshift'](...values);
            }
        }
        if ((eventType & WalkerEvent.Leave) && filter.fn != null) {
            const isValid = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));
            if (isValid) {
                option = filter.fn(value, map.get(value), WalkerEvent.Leave);
                // @ts-ignore
                if (option != null && 'typ' in option) {
                    map.set(option, map.get(value) ?? root);
                }
            }
        }
        // if ((eventType & WalkerValueEvent.Leave) && (!isNumeric && ((option as number) & WalkerOptionEnum.Children) === 0)) {
        //
        //     yield {
        //         value,
        //         parent: <FunctionToken | ParensToken>map.get(value) ?? root,
        //         previousValue: previous,
        //         nextValue: <Token>stack[0] ?? null,
        //         // @ts-ignore
        //         root: root ?? null
        //     };
        // }
        previous = value;
    }
}

export { WalkerEvent, WalkerOptionEnum, walk, walkValues };
