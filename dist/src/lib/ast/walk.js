/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumAstNodeStatus, EnumToken } from './types.js';

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
 * Walk ast nodes. Nodes and value tokens (walked when `attributes` is set) are ids
 * @param arena
 * @param node initial node
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * @private
 */
function* walk(arena, node, filter, reverse) {
    const stack = [node];
    const root = node;
    let options = filter;
    let isNumeric = false;
    let children = true;
    let attributes = false;
    if (options != null && typeof options == "object") {
        filter = options.filter;
        reverse = options.reverse;
        attributes = options.attributes;
        children = options.children ?? true;
    }
    const parentOf = (item) => (item == root ? 0 : arena.parents[item]);
    const result = {
        node: 0,
        parent: 0,
        root,
        arena,
        parents: function* () {
            let parent = parentOf(node);
            while (parent != 0) {
                yield parent;
                parent = parentOf(parent);
            }
        },
    };
    let option = null;
    while (stack.length > 0) {
        node = stack.pop();
        isNumeric = false;
        // enter node
        if (filter != null) {
            // @ts-expect-error
            option = filter(node, arena);
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
            result.parent = parentOf(node);
            yield result;
        }
        if (attributes && (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0)) {
            // prelude tokens, declaration values or token children
            const values = arena.subTokens(node);
            if (reverse) {
                for (let i = 0; i < values.length; i++) {
                    stack.push(values[i]);
                }
            }
            else {
                for (let i = values.length - 1; i >= 0; i--) {
                    stack.push(values[i]);
                }
            }
        }
        if (children &&
            arena.flags[node] & EnumAstNodeStatus.HasChildren &&
            (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0)) {
            // children are pushed in reverse so that they are popped in document order
            if (reverse) {
                for (let child = arena.firstChild[node]; child != 0; child = arena.nextSibling[child]) {
                    stack.push(child);
                }
            }
            else {
                for (let child = arena.lastChild[node]; child != 0; child = arena.previousSibling[child]) {
                    stack.push(child);
                }
            }
        }
    }
}
/**
 * Walk node values
 * @param arena
 * @param tokens token ids
 * @param root root node or token
 * @param filter
 * @param reverse
 *
 * Example:
 *
 * ```ts
 *
 * import {EnumToken, transform, walkValues} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 * `;
 *
 * const result = await transform(css);
 * const arena = result.arena;
 * const declaration = arena.firstChild[arena.firstChild[result.ast]];
 *
 * // walk the node attribute's tokens in reverse order
 * for (const {value} of walkValues(arena, arena.tokens(declaration), declaration, null, true)) {
 *
 *     console.error([EnumToken[arena.dataTypes[value]], arena.getValue(value)]);
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
function* walkValues(arena, tokens, root = null, filter, reverse) {
    const nodes = [];
    let previous = null;
    if (reverse) {
        for (let i = 0; i < tokens.length; i++) {
            nodes.push(tokens[i]);
        }
    }
    else {
        for (let i = tokens.length - 1; i >= 0; i--) {
            nodes.push(tokens[i]);
        }
    }
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
    let node = 0;
    const eventType = filter.event ?? WalkerEvent.Enter;
    // parent of a token: the owner of the token list or the structured token owning the field list
    const parentOf = (token) => {
        let parent = arena.parents[token];
        if (parent == 0) {
            return root ?? null;
        }
        if (arena.dataTypes[parent] == EnumToken.ListTokenType) {
            parent = arena.parents[parent];
        }
        return parent == 0 ? (root ?? null) : parent;
    };
    // @ts-ignore
    const result = {
        value: 0,
        parent: null,
        previousValue: null,
        nextValue: null,
        root: root ?? null,
        parents: function* () {
            let parent = parentOf(node);
            while (parent != null && parent != 0) {
                yield parent;
                if (parent == root) {
                    break;
                }
                parent = parentOf(parent);
            }
        },
    };
    while (nodes.length > 0) {
        value = nodes.pop();
        node = value;
        option = null;
        if (filter.fn != null && eventType & WalkerEvent.Enter) {
            const isValid = filter.type == null ||
                arena.dataTypes[value] == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(arena.dataTypes[value])) ||
                (typeof filter.type == "function" && filter.type(value));
            if (isValid) {
                // @ts-expect-error
                option = filter.fn(value, parentOf(value), WalkerEvent.Enter, result.parents);
                isNumeric = typeof option == "number";
                if (isNumeric && option & WalkerOptionEnum.Stop) {
                    return;
                }
                if (isNumeric && option & WalkerOptionEnum.Ignore) {
                    continue;
                }
                // tokens returned by the filter are visited too
                if (option != null && !isNumeric) {
                    const op = Array.isArray(option) ? option : [option];
                    if (reverse) {
                        for (let i = 0; i < op.length; i++) {
                            nodes.push(op[i]);
                        }
                    }
                    else {
                        for (let i = op.length - 1; i >= 0; i--) {
                            nodes.push(op[i]);
                        }
                    }
                }
            }
        }
        result.value = value;
        result.parent = parentOf(value);
        result.previousValue = previous;
        result.nextValue = nodes.length > 0 ? nodes[nodes.length - 1] : null;
        yield result;
        if (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0) {
            const children = arena.subTokens(value);
            if (reverse) {
                for (let i = 0; i < children.length; i++) {
                    nodes.push(children[i]);
                }
            }
            else {
                for (let i = children.length - 1; i >= 0; i--) {
                    nodes.push(children[i]);
                }
            }
        }
        if (eventType & WalkerEvent.Leave && filter.fn != null) {
            const isValid = filter.type == null ||
                arena.dataTypes[value] == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(arena.dataTypes[value])) ||
                (typeof filter.type == "function" && filter.type(value));
            if (isValid) {
                // @ts-expect-error
                option = filter.fn(value, parentOf(value), WalkerEvent.Leave, result.parents);
                if (option != null && typeof option != "number") {
                    const op = Array.isArray(option) ? option : [option];
                    if (reverse) {
                        for (let i = 0; i < op.length; i++) {
                            nodes.push(op[i]);
                        }
                    }
                    else {
                        for (let i = op.length - 1; i >= 0; i--) {
                            nodes.push(op[i]);
                        }
                    }
                }
            }
        }
        previous = value;
    }
}

export { WalkerEvent, WalkerOptionEnum, walk, walkValues };
