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
function walkValues(arena, tokens, root = null, filter, reverse) {
    // an iterator object holds the state: no generator
    return new ValueWalker(arena, tokens, root, filter, reverse);
}
/**
 * push the children of a token onto a stack, from the linked lists: the token list, then the fields (the tokens of
 * the list fields) of a structured token. they are pushed in order, then reversed in place (unless reverse is true)
 * so that they are popped in order: no array is created
 * @param arena
 * @param nodes stack
 * @param value
 * @param reverse
 */
function pushChildren(arena, nodes, value, reverse) {
    const first = nodes.length;
    let token = arena.firstToken[value];
    while (token != 0) {
        nodes.push(token);
        token = arena.nextSibling[token];
    }
    if ((arena.flags[value] & EnumAstNodeStatus.HasChildren) == 0) {
        let child = arena.firstChild[value];
        while (child != 0) {
            if (arena.dataTypes[child] == EnumToken.ListTokenType) {
                token = arena.firstToken[child];
                while (token != 0) {
                    nodes.push(token);
                    token = arena.nextSibling[token];
                }
            }
            else {
                nodes.push(child);
            }
            child = arena.nextSibling[child];
        }
    }
    if (!reverse) {
        for (let i = first, j = nodes.length - 1; i < j; i++, j--) {
            const swap = nodes[i];
            nodes[i] = nodes[j];
            nodes[j] = swap;
        }
    }
}
// stack of visitValues(), shared by the nested calls: each call uses the entries above its base. the entries are
// written by index and the array never shrinks (pop() and a smaller length release the memory of the array)
const visitStack = [];
let visitTop = 0;
/**
 * call the visitor for the tokens and their children, in the order of {@link walkValues} (the children of a token are
 * read after the visitor returns). no iterator, result object or stack is created: use it when the parents are not
 * needed and the visitor is not a closure
 * @param arena
 * @param tokens
 * @param visitor
 */
function visitValues(arena, tokens, visitor) {
    const stack = visitStack;
    const base = visitTop;
    let top = base;
    for (let i = tokens.length - 1; i >= 0; i--) {
        stack[top++] = tokens[i];
    }
    try {
        while (top > base) {
            const value = stack[--top];
            // nested calls use the entries above top
            visitTop = top;
            visitor(arena, value);
            // the children, in reverse order (see pushChildren())
            const first = top;
            let token = arena.firstToken[value];
            while (token != 0) {
                stack[top++] = token;
                token = arena.nextSibling[token];
            }
            if ((arena.flags[value] & EnumAstNodeStatus.HasChildren) == 0) {
                let child = arena.firstChild[value];
                while (child != 0) {
                    if (arena.dataTypes[child] == EnumToken.ListTokenType) {
                        token = arena.firstToken[child];
                        while (token != 0) {
                            stack[top++] = token;
                            token = arena.nextSibling[token];
                        }
                    }
                    else {
                        stack[top++] = child;
                    }
                    child = arena.nextSibling[child];
                }
            }
            for (let i = first, j = top - 1; i < j; i++, j--) {
                const swap = stack[i];
                stack[i] = stack[j];
                stack[j] = swap;
            }
        }
    }
    finally {
        visitTop = base;
    }
}
/**
 * iterator of {@link walkValues}: a stack of the tokens to visit. the same result object is returned for every token
 */
class ValueWalker {
    arena;
    root;
    reverse;
    nodes = [];
    // iterator result, reused
    iteration;
    fn = null;
    type = null;
    eventType = WalkerEvent.Enter;
    result;
    previous = null;
    // token returned by the last call of next(): its children are visited by the next call
    current = null;
    // value returned by the filter for the current token
    option = null;
    // last visited token, see parents()
    node = 0;
    constructor(arena, tokens, root, filter, reverse) {
        this.arena = arena;
        this.root = root;
        this.reverse = reverse;
        if (reverse) {
            for (let i = 0; i < tokens.length; i++) {
                this.nodes.push(tokens[i]);
            }
        }
        else {
            for (let i = tokens.length - 1; i >= 0; i--) {
                this.nodes.push(tokens[i]);
            }
        }
        // the filter is read once: no filter object is created
        if (typeof filter == "function") {
            this.fn = filter;
        }
        else if (filter != null) {
            this.fn = filter.fn ?? null;
            this.type = filter.type ?? null;
            this.eventType = filter.event ?? WalkerEvent.Enter;
        }
        const walker = this;
        // @ts-ignore
        this.result = {
            value: 0,
            parent: null,
            previousValue: null,
            nextValue: null,
            root: root ?? null,
            parents: function* () {
                let parent = walker.parentOf(walker.node);
                while (parent != null && parent != 0) {
                    yield parent;
                    if (parent == root) {
                        break;
                    }
                    parent = walker.parentOf(parent);
                }
            },
        };
        this.iteration = { done: false, value: this.result };
    }
    /**
     * parent of a token: the owner of the token list or the structured token owning the field list
     * @param token
     */
    parentOf(token) {
        let parent = this.arena.parents[token];
        if (parent == 0) {
            return this.root ?? null;
        }
        if (this.arena.dataTypes[parent] == EnumToken.ListTokenType) {
            parent = this.arena.parents[parent];
        }
        return parent == 0 ? (this.root ?? null) : parent;
    }
    /**
     * the filter function is called for the token
     * @param token
     */
    isValid(token) {
        const type = this.type;
        return (type == null ||
            this.arena.dataTypes[token] == type ||
            (Array.isArray(type) && type.includes(this.arena.dataTypes[token])) ||
            (typeof type == "function" && type(token)));
    }
    /**
     * the tokens returned by the filter are visited too
     * @param option
     */
    pushOption(option) {
        if (!Array.isArray(option)) {
            this.nodes.push(option);
        }
        else if (this.reverse) {
            for (let i = 0; i < option.length; i++) {
                this.nodes.push(option[i]);
            }
        }
        else {
            for (let i = option.length - 1; i >= 0; i--) {
                this.nodes.push(option[i]);
            }
        }
    }
    /**
     * children of the token returned by the previous call, then the leave event
     */
    leave(value) {
        const arena = this.arena;
        const nodes = this.nodes;
        const option = this.option;
        // the children are read after the token is visited (it may have been modified)
        if (typeof option != "number" || (option & WalkerOptionEnum.IgnoreChildren) === 0) {
            pushChildren(arena, nodes, value, this.reverse);
        }
        if (this.eventType & WalkerEvent.Leave && this.fn != null && this.isValid(value)) {
            // @ts-expect-error
            const option = this.fn(value, this.parentOf(value), WalkerEvent.Leave, this.result.parents);
            if (option != null && typeof option != "number") {
                this.pushOption(option);
            }
        }
        this.previous = value;
    }
    [Symbol.iterator]() {
        return this;
    }
    next() {
        const result = this.nextValue();
        // the value of the iteration is always the result object
        return result == null ? { done: true, value: undefined } : this.iteration;
    }
    /**
     * stop the iteration (break of a for ... of loop)
     * @param value
     */
    return(value) {
        this.nodes.length = 0;
        this.current = null;
        return { done: true, value: value };
    }
    throw(error) {
        this.nodes.length = 0;
        this.current = null;
        throw error;
    }
    /**
     * next token, null at the end
     */
    nextValue() {
        const nodes = this.nodes;
        let value;
        if (this.current != null) {
            this.leave(this.current);
            this.current = null;
        }
        while (nodes.length > 0) {
            value = nodes.pop();
            this.node = value;
            this.option = null;
            if (this.fn != null && this.eventType & WalkerEvent.Enter && this.isValid(value)) {
                // @ts-expect-error
                const option = this.fn(value, this.parentOf(value), WalkerEvent.Enter, this.result.parents);
                this.option = option;
                if (typeof option == "number") {
                    if (option & WalkerOptionEnum.Stop) {
                        nodes.length = 0;
                        return null;
                    }
                    if (option & WalkerOptionEnum.Ignore) {
                        continue;
                    }
                }
                else if (option != null) {
                    this.pushOption(option);
                }
            }
            const result = this.result;
            result.value = value;
            result.parent = this.parentOf(value);
            result.previousValue = this.previous;
            result.nextValue = nodes.length > 0 ? nodes[nodes.length - 1] : null;
            this.current = value;
            return result;
        }
        return null;
    }
}

export { WalkerEvent, WalkerOptionEnum, visitValues, walk, walkValues };
