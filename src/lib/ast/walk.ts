/**
 * iterators of {@link AstArena.walk} and {@link AstArena.walkValues}: plain iterator objects, no generator. the
 * iteration result object is reused: the value must be read before the next call of `next()` (as `for ... of` does)
 *
 * @module
 * @internal
 */
import type {
    AstNode,
    Token,
    WalkerFilter,
    WalkerOption,
    WalkerOptions,
    WalkerValueFilter,
    WalkerValueOptions,
} from "../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken, WalkerEvent, WalkerOptionEnum } from "./types.ts";
import type { AstArena } from "./arena.ts";

/**
 * push the direct value tokens of a token onto a stack, from the linked lists: the token list, then the fields (the
 * tokens of the list fields) of a structured token. they are pushed in order, then reversed in place (unless reverse
 * is true) so that they are popped in order: no array is created
 * @param arena
 * @param stack
 * @param value
 * @param reverse
 */
function pushValues(arena: AstArena, stack: number[], value: number, reverse: boolean): void {
    const first: number = stack.length;
    let token: number = arena.firstToken[value];

    while (token != 0) {
        stack.push(token);
        token = arena.nextSibling[token];
    }

    if ((arena.flags[value] & EnumAstNodeStatus.HasChildren) == 0) {
        let child: number = arena.firstChild[value];

        while (child != 0) {
            if (arena.dataTypes[child] == EnumToken.ListTokenType) {
                token = arena.firstToken[child];

                while (token != 0) {
                    stack.push(token);
                    token = arena.nextSibling[token];
                }
            } else {
                stack.push(child);
            }

            child = arena.nextSibling[child];
        }
    }

    if (!reverse) {
        for (let i = first, j = stack.length - 1; i < j; i++, j--) {
            const swap: number = stack[i];

            stack[i] = stack[j];
            stack[j] = swap;
        }
    }
}

/**
 * iterator of {@link AstArena.walk}: node ids (and value tokens when `attributes` is set) in document order. the
 * children of a node are read when the next node is requested: the node may be modified by the caller
 */
export class NodeWalker implements IterableIterator<AstNode | Token> {
    private readonly stack: number[];
    private readonly filter: WalkerFilter | null = null;
    private readonly reverse: boolean = false;
    private readonly children: boolean = true;
    private readonly attributes: boolean = false;
    // iteration result, reused
    private readonly iteration: IteratorResult<number> = { done: false, value: 0 };
    // node returned by the last call of next(): its children are pushed by the next call
    private current: number = 0;
    // value returned by the filter for the current node
    private option: WalkerOption = null;

    constructor(
        private readonly arena: AstArena,
        node: AstNode | Token,
        filter?: WalkerFilter | WalkerOptions | null,
        reverse?: boolean,
    ) {
        this.stack = [node];

        if (filter != null && typeof filter == "object") {
            this.filter = filter.filter ?? null;
            this.reverse = filter.reverse === true;
            this.attributes = filter.attributes === true;
            this.children = filter.children ?? true;
        } else {
            this.filter = filter ?? null;
            this.reverse = reverse === true;
        }
    }

    [Symbol.iterator](): this {
        return this;
    }

    /**
     * push the value tokens and the children of a node
     * @param node
     * @param option
     */
    private expand(node: number, option: WalkerOption): void {
        if (typeof option == "number" && option & WalkerOptionEnum.IgnoreChildren) {
            return;
        }

        const arena: AstArena = this.arena;
        const stack: number[] = this.stack;

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
            } else {
                for (let child = arena.lastChild[node]; child != 0; child = arena.previousSibling[child]) {
                    stack.push(child);
                }
            }
        }
    }

    next(): IteratorResult<number> {
        const stack: number[] = this.stack;
        const filter: WalkerFilter | null = this.filter;

        if (this.current != 0) {
            this.expand(this.current, this.option);
            this.current = 0;
        }

        while (stack.length > 0) {
            const node: number = stack.pop() as number;
            let option: WalkerOption = null;

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
    return(value?: unknown): IteratorResult<number> {
        this.stack.length = 0;
        this.current = 0;

        return { done: true, value: value as undefined };
    }

    throw(error?: unknown): IteratorResult<number> {
        this.return();

        throw error;
    }
}

/**
 * iterator of {@link AstArena.walkValues}: token ids in document order. the children of a token are read when the
 * next token is requested: the token may be modified by the caller
 */
export class ValueWalker implements IterableIterator<Token> {
    private readonly stack: Token[] = [];
    private readonly fn: WalkerValueFilter | null = null;
    private readonly type: EnumToken | EnumToken[] | ((arena: AstArena, token: Token) => boolean) | null = null;
    private readonly eventType: WalkerEvent = WalkerEvent.Enter;
    private readonly reverse: boolean;
    // iteration result, reused
    private readonly iteration: IteratorResult<Token> = { done: false, value: 0 };
    // token returned by the last call of next(): its children are visited by the next call
    private current: Token = 0;
    // value returned by the filter for the current token
    private option: WalkerOption | Token[] = null;

    constructor(
        private readonly arena: AstArena,
        tokens: Token | Token[],
        filter?: WalkerValueFilter | WalkerValueOptions | null,
        reverse?: boolean,
    ) {
        this.reverse = reverse === true;

        if (typeof tokens == "number") {
            // the value tokens of a node or a token
            pushValues(arena, this.stack, tokens, this.reverse);
        } else if (this.reverse) {
            for (let i = 0; i < tokens.length; i++) {
                this.stack.push(tokens[i]);
            }
        } else {
            for (let i = tokens.length - 1; i >= 0; i--) {
                this.stack.push(tokens[i]);
            }
        }

        // the filter is read once: no filter object is created
        if (typeof filter == "function") {
            this.fn = filter;
        } else if (filter != null) {
            this.fn = filter.fn ?? null;
            this.type = filter.type ?? null;
            this.eventType = filter.event ?? WalkerEvent.Enter;
        }
    }

    [Symbol.iterator](): this {
        return this;
    }

    /**
     * the filter function is called for the token
     * @param token
     */
    private isValid(token: Token): boolean {
        const type = this.type;

        return (
            type == null ||
            this.arena.dataTypes[token] == type ||
            (Array.isArray(type) && type.includes(this.arena.dataTypes[token])) ||
            (typeof type == "function" && type(this.arena, token))
        );
    }

    /**
     * the tokens returned by the filter are visited too
     * @param option
     */
    private pushOption(option: Token[]): void {
        if (this.reverse) {
            for (let i = 0; i < option.length; i++) {
                this.stack.push(option[i]);
            }
        } else {
            for (let i = option.length - 1; i >= 0; i--) {
                this.stack.push(option[i]);
            }
        }
    }

    /**
     * children of the token returned by the previous call, then the leave event
     */
    private leave(value: Token): void {
        const option: WalkerOption | Token[] = this.option;

        // the children are read after the token is visited (it may have been modified)
        if (typeof option != "number" || (option & WalkerOptionEnum.IgnoreChildren) === 0) {
            pushValues(this.arena, this.stack, value, this.reverse);
        }

        if (this.eventType & WalkerEvent.Leave && this.fn != null && this.isValid(value)) {
            const option: WalkerOption | Token[] = this.fn(this.arena, value, WalkerEvent.Leave);

            if (Array.isArray(option)) {
                this.pushOption(option);
            }
        }
    }

    next(): IteratorResult<Token> {
        const stack: Token[] = this.stack;

        if (this.current != 0) {
            this.leave(this.current);
            this.current = 0;
        }

        while (stack.length > 0) {
            const value: Token = stack.pop() as Token;

            this.option = null;

            if (this.fn != null && this.eventType & WalkerEvent.Enter && this.isValid(value)) {
                const option: WalkerOption | Token[] = this.fn(this.arena, value, WalkerEvent.Enter);

                this.option = option;

                if (typeof option == "number") {
                    if (option & WalkerOptionEnum.Stop) {
                        break;
                    }

                    if (option & WalkerOptionEnum.Ignore) {
                        continue;
                    }
                } else if (Array.isArray(option)) {
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
    return(value?: unknown): IteratorResult<Token> {
        this.stack.length = 0;
        this.current = 0;

        return { done: true, value: value as undefined };
    }

    throw(error?: unknown): IteratorResult<Token> {
        this.return();

        throw error;
    }
}
