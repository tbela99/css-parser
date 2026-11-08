/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { WalkerOptionEnum, EnumAstNodeStatus, WalkerEvent, EnumToken } from './types.js';

/**
 * push the direct value tokens of a token onto a stack, from the linked lists: the token list, then the fields (the
 * tokens of the list fields) of a structured token. they are pushed in order, then reversed in place (unless reverse
 * is true) so that they are popped in order: no array is created
 * @param arena
 * @param stack
 * @param value
 * @param reverse
 */
function pushValues(arena, stack, value, reverse) {
    const first = stack.length;
    let token = arena.firstToken[value];
    while (token != 0) {
        stack.push(token);
        token = arena.nextSibling[token];
    }
    if ((arena.flags[value] & EnumAstNodeStatus.HasChildren) == 0) {
        let child = arena.firstChild[value];
        while (child != 0) {
            if (arena.dataTypes[child] == EnumToken.ListTokenType) {
                token = arena.firstToken[child];
                while (token != 0) {
                    stack.push(token);
                    token = arena.nextSibling[token];
                }
            }
            else {
                stack.push(child);
            }
            child = arena.nextSibling[child];
        }
    }
    if (!reverse) {
        for (let i = first, j = stack.length - 1; i < j; i++, j--) {
            const swap = stack[i];
            stack[i] = stack[j];
            stack[j] = swap;
        }
    }
}
/**
 * iterator of {@link AstArena.walk}: node ids (and value tokens when `attributes` is set) in document order. the
 * children of a node are read when the next node is requested: the node may be modified by the caller
 */
class NodeWalker {
    arena;
    stack;
    filter = null;
    reverse = false;
    children = true;
    attributes = false;
    // iteration result, reused
    iteration = { done: false, value: 0 };
    // node returned by the last call of next(): its children are pushed by the next call
    current = 0;
    // value returned by the filter for the current node
    option = null;
    constructor(arena, node, filter, reverse) {
        this.arena = arena;
        this.stack = [node];
        if (filter != null && typeof filter == "object") {
            this.filter = filter.filter ?? null;
            this.reverse = filter.reverse === true;
            this.attributes = filter.attributes === true;
            this.children = filter.children ?? true;
        }
        else {
            this.filter = filter ?? null;
            this.reverse = reverse === true;
        }
    }
    [Symbol.iterator]() {
        return this;
    }
    /**
     * push the value tokens and the children of a node
     * @param node
     * @param option
     */
    expand(node, option) {
        if (typeof option == "number" && option & WalkerOptionEnum.IgnoreChildren) {
            return;
        }
        const arena = this.arena;
        const stack = this.stack;
        if (this.attributes) {
            // prelude tokens, declaration values or token children
            pushValues(arena, stack, node, this.reverse);
        }
        if (this.children && arena.flags[node] & EnumAstNodeStatus.HasChildren) {
            // children are pushed in reverse so that they are popped in document order
            if (this.reverse) {
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
    next() {
        const stack = this.stack;
        const filter = this.filter;
        if (this.current != 0) {
            this.expand(this.current, this.option);
            this.current = 0;
        }
        while (stack.length > 0) {
            const node = stack.pop();
            let option = null;
            if (filter != null) {
                option = filter(this.arena, node);
                if (typeof option == "number") {
                    if (option & WalkerOptionEnum.Ignore) {
                        continue;
                    }
                    if (option & WalkerOptionEnum.Stop) {
                        break;
                    }
                    if (option & WalkerOptionEnum.Children) {
                        // the node is not returned, its children are walked
                        this.expand(node, option);
                        continue;
                    }
                }
            }
            this.current = node;
            this.option = option;
            this.iteration.value = node;
            return this.iteration;
        }
        return this.return();
    }
    /**
     * stop the iteration (break of a for ... of loop)
     */
    return(value) {
        this.stack.length = 0;
        this.current = 0;
        return { done: true, value: value };
    }
    throw(error) {
        this.return();
        throw error;
    }
}
/**
 * iterator of {@link AstArena.walkValues}: token ids in document order. the children of a token are read when the
 * next token is requested: the token may be modified by the caller
 */
class ValueWalker {
    arena;
    stack = [];
    fn = null;
    type = null;
    eventType = WalkerEvent.Enter;
    reverse;
    // iteration result, reused
    iteration = { done: false, value: 0 };
    // token returned by the last call of next(): its children are visited by the next call
    current = 0;
    // value returned by the filter for the current token
    option = null;
    constructor(arena, tokens, filter, reverse) {
        this.arena = arena;
        this.reverse = reverse === true;
        if (typeof tokens == "number") {
            // the value tokens of a node or a token
            pushValues(arena, this.stack, tokens, this.reverse);
        }
        else if (this.reverse) {
            for (let i = 0; i < tokens.length; i++) {
                this.stack.push(tokens[i]);
            }
        }
        else {
            for (let i = tokens.length - 1; i >= 0; i--) {
                this.stack.push(tokens[i]);
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
    }
    [Symbol.iterator]() {
        return this;
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
            (typeof type == "function" && type(this.arena, token)));
    }
    /**
     * the tokens returned by the filter are visited too
     * @param option
     */
    pushOption(option) {
        if (this.reverse) {
            for (let i = 0; i < option.length; i++) {
                this.stack.push(option[i]);
            }
        }
        else {
            for (let i = option.length - 1; i >= 0; i--) {
                this.stack.push(option[i]);
            }
        }
    }
    /**
     * children of the token returned by the previous call, then the leave event
     */
    leave(value) {
        const option = this.option;
        // the children are read after the token is visited (it may have been modified)
        if (typeof option != "number" || (option & WalkerOptionEnum.IgnoreChildren) === 0) {
            pushValues(this.arena, this.stack, value, this.reverse);
        }
        if (this.eventType & WalkerEvent.Leave && this.fn != null && this.isValid(value)) {
            const option = this.fn(this.arena, value, WalkerEvent.Leave);
            if (Array.isArray(option)) {
                this.pushOption(option);
            }
        }
    }
    next() {
        const stack = this.stack;
        if (this.current != 0) {
            this.leave(this.current);
            this.current = 0;
        }
        while (stack.length > 0) {
            const value = stack.pop();
            this.option = null;
            if (this.fn != null && this.eventType & WalkerEvent.Enter && this.isValid(value)) {
                const option = this.fn(this.arena, value, WalkerEvent.Enter);
                this.option = option;
                if (typeof option == "number") {
                    if (option & WalkerOptionEnum.Stop) {
                        break;
                    }
                    if (option & WalkerOptionEnum.Ignore) {
                        continue;
                    }
                }
                else if (Array.isArray(option)) {
                    this.pushOption(option);
                }
            }
            this.current = value;
            this.iteration.value = value;
            return this.iteration;
        }
        return this.return();
    }
    /**
     * stop the iteration (break of a for ... of loop)
     * @param value
     */
    return(value) {
        this.stack.length = 0;
        this.current = 0;
        return { done: true, value: value };
    }
    throw(error) {
        this.return();
        throw error;
    }
}

export { NodeWalker, ValueWalker };
