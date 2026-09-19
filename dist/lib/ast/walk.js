import { PARENT, TOKENS } from '../syntax/constants.js';

/**
 * Options for the walk function
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
     * ignore the current node and process its children
     */
    WalkerOptionEnum[WalkerOptionEnum["Children"] = 4] = "Children";
    /**
     * ignore the current node children
     */
    WalkerOptionEnum[WalkerOptionEnum["IgnoreChildren"] = 8] = "IgnoreChildren";
})(WalkerOptionEnum || (WalkerOptionEnum = {}));
/**
 * Event types for the walkValues function
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
 * Walk ast nodes
 * @param node initial node
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * @private
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
 * Using a {@link filter} function to control the ast traversal.  the filter function returns a value of type {@link WalkerOption}.
 *
 * ```ts
 * import {EnumToken, transform, walk, WalkerOptionEnum} from '@tbela99/css-parser';
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
 * function filter(node) {
 *
 *     if (node.typ == EnumToken.AstRule && node.sel.includes('html')) {
 *
 *         // skip the children of the current node
 *         return WalkerOptionEnum.IgnoreChildren;
 *     }
 * }
 *
 * const result = await transform(css);
 * for (const {node} of walk(result.ast, filter)) {
 *
 *     console.error([EnumToken[node.typ]]);
 * }
 *
 * // [ "StyleSheetNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * ```
 */
function* walk(node, filter, reverse) {
    const parents = [node];
    const root = node;
    let options = filter;
    let isNumeric = false;
    let children = true;
    let attributes = false;
    let i = 0;
    if (options != null && typeof options == "object") {
        filter = options.filter;
        reverse = options.reverse;
        attributes = options.attributes;
        children = options.children ?? true;
    }
    // @ts-expect-error
    const result = {
        node: null,
        parent: null,
        root,
        parents: function* () {
            let parent = node[PARENT];
            while (parent != null) {
                yield parent;
                parent = parent[PARENT];
            }
        },
    };
    while ((node = parents[i++])) {
        let option = null;
        if (filter != null) {
            // @ts-expect-error
            option = filter(node);
            isNumeric = typeof option == "number";
            if (isNumeric) {
                if (option & WalkerOptionEnum.Ignore) {
                    continue;
                }
                if (option & WalkerOptionEnum.Stop) {
                    break;
                }
            }
        }
        if (!isNumeric || (option & WalkerOptionEnum.Children) === 0) {
            result.node = node;
            // @ts-expect-error
            result.parent = node[PARENT];
            yield result;
        }
        if (attributes) {
            if (node[TOKENS] != null) {
                // @ts-expect-error
                parents.splice(i, 0, ...(reverse ? node[TOKENS].toReversed() : node[TOKENS]));
                for (const child of node[TOKENS]) {
                    if (child[PARENT] != node) {
                        child[PARENT] = node;
                    }
                }
                // @ts-expect-error
            }
            else if (Array.isArray(node.val)) {
                // @ts-expect-error
                for (const val of node.val) {
                    if (val[PARENT] != node) {
                        val[PARENT] = node;
                    }
                }
                // @ts-expect-error
                parents.splice(i, 0, ...(reverse ? node.val.toReversed() : node.val));
            }
        }
        if (children &&
            // @ts-expect-error
            node["chi"] != null &&
            (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0)) {
            // @ts-expect-error
            parents.splice(i, 0, ...(reverse ? node.chi.toReversed() : node.chi));
            for (const child of node.chi) {
                if (child[PARENT] != node) {
                    child[PARENT] = node;
                }
            }
        }
    }
}
/**
 * Walk ast node value tokens
 * @param values
 * @param root
 * @param filter
 * @param reverse
 *
 * Example:
 *
 * ```ts
 *
 * import {AstDeclaration, EnumToken, transform, walkValues} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 * `;
 *
 * const result = await transform(css);
 * const declaration = result.ast.chi[0].chi[0] as AstDeclaration;
 *
 * // walk the node attribute's tokens in reverse order
 * for (const {value} of walkValues(declaration.val, null, null,true)) {
 *
 *     console.error([EnumToken[value.typ], value.val]);
 * }
 *
 * // [ "Color", "color" ]
 * // [ "FunctionTokenType", "calc" ]
 * // [ "Number", 0.15 ]
 * // [ "Add", undefined ]
 * // [ "Iden", "b" ]
 * // [ "Whitespace", undefined ]
 * // [ "FunctionTokenType", "calc" ]
 * // [ "Number", 0.24 ]
 * // [ "Add", undefined ]
 * // [ "Iden", "g" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "r" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "display-p3" ]
 * // [ "Whitespace", undefined ]
 * // [ "FunctionTokenType", "var" ]
 * // [ "DashedIden", "--base-color" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "from" ]
 * ```
 */
function* walkValues(values, root = null, filter, reverse) {
    const stack = values.slice();
    let previous = null;
    if (filter != null && typeof filter == "function") {
        filter = {
            event: WalkerEvent.Enter,
            fn: filter,
        };
    }
    else if (filter == null) {
        filter = {
            event: WalkerEvent.Enter,
        };
    }
    let isNumeric = false;
    let value;
    let option;
    let node;
    let i = -1;
    const eventType = filter.event ?? WalkerEvent.Enter;
    // @ts-ignore
    const result = {
        value: null,
        parent: null,
        previousValue: null,
        nextValue: null,
        //
        root: root ?? null,
        parents: function* () {
            // @ts-ignore
            let result = root;
            while (result != null) {
                yield result;
                result = result[PARENT] ?? null;
            }
        },
    };
    while (++i < stack.length) {
        value = stack[i];
        option = null;
        if (filter.fn != null && eventType & WalkerEvent.Enter) {
            const isValid = filter.type == null ||
                value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == "function" && filter.type(value));
            if (isValid) {
                // @ts-expect-error
                option = filter.fn(value, value[PARENT] ?? root, WalkerEvent.Enter, 
                // @ts-expect-error
                function* () {
                    // @ts-expect-error
                    let parent = node[PARENT];
                    while (parent != null) {
                        yield parent;
                        parent = parent[PARENT] ?? null;
                    }
                });
                isNumeric = typeof option == "number";
                if (isNumeric && option & WalkerOptionEnum.Stop) {
                    return;
                }
                if (isNumeric && option & WalkerOptionEnum.Ignore) {
                    continue;
                }
                //
                if (option != null && typeof option == "object" && ("typ" in option || Array.isArray(option))) {
                    const op = Array.isArray(option) ? option : [option];
                    stack.splice(i, 0, ...(reverse ? op.toReversed() : op));
                    for (const o of op) {
                        if (o[PARENT] != value) {
                            o[PARENT] = value;
                        }
                    }
                }
            }
        }
        result.value = value;
        result.parent = value[PARENT] ?? root;
        result.previousValue = previous;
        result.nextValue = stack[0] ?? null;
        yield result;
        if (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0) {
            if ("chi" in value) {
                const sliced = value.chi.slice();
                for (const child of sliced) {
                    if (child[PARENT] != value) {
                        child[PARENT] = value;
                    }
                    if (reverse) {
                        stack.unshift(child);
                    }
                    else {
                        stack.push(child);
                    }
                }
            }
            else {
                const values = [];
                if ("l" in value && value.l != null) {
                    // @ts-expect-error
                    values.push(value.l);
                    // @ts-expect-error
                    if (value.l[PARENT] != value) {
                        // @ts-expect-error
                        value.l[PARENT] = value;
                    }
                }
                if ("op" in value && typeof value.op == "object") {
                    // @ts-expect-error
                    values.push(value.op);
                    // @ts-expect-error
                    if (value.op[PARENT] != value) {
                        // @ts-expect-error
                        value.op[PARENT] = value;
                    }
                }
                if ("r" in value && value.r != null) {
                    if (Array.isArray(value.r)) {
                        for (const r of value.r) {
                            //
                            values.push(r);
                            if (r[PARENT] != value) {
                                //
                                r[PARENT] = value;
                            }
                        }
                    }
                    else {
                        //
                        values.push(value.r);
                        if (value.r[PARENT] != value) {
                            //
                            value.r[PARENT] = value;
                        }
                    }
                }
                if (values.length > 0) {
                    for (const v of values) {
                        if (reverse) {
                            stack.unshift(v);
                        }
                        else {
                            stack.push(v);
                        }
                    }
                }
            }
        }
        if (eventType & WalkerEvent.Leave && filter.fn != null) {
            const isValid = filter.type == null ||
                value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == "function" && filter.type(value));
            if (isValid) {
                // @ts-ignore
                option = filter.fn(value, value[PARENT], WalkerEvent.Leave);
                // @ts-ignore
                if (option != null && ("typ" in option || Array.isArray(option))) {
                    const op = Array.isArray(option) ? option : [option];
                    stack.splice(i, 0, ...(reverse ? op.toReversed() : op));
                    for (const o of op) {
                        if (o[PARENT] != value) {
                            o[PARENT] = value;
                        }
                    }
                }
            }
        }
        previous = value;
    }
}

export { WalkerEvent, WalkerOptionEnum, walk, walkValues };
