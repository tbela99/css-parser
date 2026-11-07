import type {
    AstNode,
    Token,
    WalkAttributesResult,
    WalkerFilter,
    WalkerOption,
    WalkerOptions,
    WalkerValueFilter,
    WalkResult,
} from "../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "./types.ts";
import type { AstArena } from "./arena.ts";

/**
 * Options for the walk function
 */
export enum WalkerOptionEnum {
    /**
     * ignore the current node and its children
     */
    Ignore = 1 << 0,
    /**
     * stop walking the tree
     */
    Stop = 1 << 1,
    /**
     * ignore the current node and process its children
     */
    Children = 1 << 2,
    /**
     * ignore the current node children
     */
    IgnoreChildren = 1 << 3,
}

/**
 * Event types for the walkValues function
 */
export enum WalkerEvent {
    /**
     * enter node
     */
    Enter = 0x1,
    /**
     * leave node
     */
    Leave = 0x2,
}

/**
 * Walk ast nodes
 * @param arena the arena the nodes are stored in
 * @param node initial node id (or value token)
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * ```ts
 *
 * import {walk, EnumToken} from '@tbela99/css-parser';
 *
 * const result = await parse(css);
 *
 * for (const {node, parent, root, arena} of walk(result.arena, result.ast)) {
 *
 *     console.log(EnumToken[arena.dataTypes[node]]);
 * }
 * ```
 *
 * Using a {@link filter} function to control the ast traversal.  the filter function returns a value of type {@link WalkerOption}.
 *
 * ```ts
 * import {EnumToken, transform, walk, WalkerOptionEnum} from '@tbela99/css-parser';
 *
 * const result = await transform(css);
 * const arena = result.arena;
 *
 * function filter(node) {
 *
 *     if (arena.dataTypes[node] == EnumToken.RuleNodeType && arena.strings[arena.name[node]].includes('html')) {
 *
 *         // skip the children of the current node
 *         return WalkerOptionEnum.IgnoreChildren;
 *     }
 * }
 *
 * for (const {node} of walk(arena, result.ast, filter)) {
 *
 *     console.error([EnumToken[arena.dataTypes[node]]]);
 * }
 * ```
 */
export function walk(
    arena: AstArena,
    node: AstNode | Token,
    filter?: WalkerFilter | null,
    reverse?: boolean,
): Generator<WalkResult>;

/**
 * Walk ast nodes
 * @param arena the arena the nodes are stored in
 * @param node initial node id (or value token)
 * @param filter control the walk process
 */
export function walk(arena: AstArena, node: AstNode | Token, filter?: WalkerOptions | null): Generator<WalkResult>;

/**
 * Walk ast nodes. Nodes and value tokens (walked when `attributes` is set) are ids
 * @param arena
 * @param node initial node
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * @private
 */
export function* walk(
    arena: AstArena,
    node: AstNode | Token,
    filter?: WalkerFilter | WalkerOptions | null,
    reverse?: boolean,
): Generator<WalkResult> {
    const stack: Array<AstNode | Token> = [node];
    const root: AstNode | Token = node;

    let options: WalkerOptions | null = filter as WalkerOptions | null;
    let isNumeric: boolean = false;
    let children: boolean = true;
    let attributes: boolean = false;

    if (options != null && typeof options == "object") {
        filter = options.filter as WalkerFilter;
        reverse = options.reverse;
        attributes = options.attributes as boolean;
        children = (options.children as boolean) ?? true;
    }

    const parentOf = (item: AstNode | Token): AstNode | Token => (item == root ? 0 : arena.parents[item]);

    const result = {
        node: 0,
        parent: 0,
        root,
        arena,
        parents: function* () {
            let parent: AstNode | Token = parentOf(node);

            while (parent != 0) {
                yield parent;
                parent = parentOf(parent);
            }
        },
    } as WalkResult;

    let option: WalkerOption = null;

    while (stack.length > 0) {
        node = stack.pop() as AstNode | Token;
        isNumeric = false;

        // enter node
        if (filter != null) {
            // @ts-expect-error
            option = filter(node, arena);
            isNumeric = typeof option == "number";

            if (isNumeric) {
                if ((option as number) & WalkerOptionEnum.Ignore) {
                    continue;
                }

                if ((option as number) & WalkerOptionEnum.Stop) {
                    break;
                }
            }
        }

        if (!isNumeric || ((option as number) & WalkerOptionEnum.Children) === 0) {
            result.node = node;
            result.parent = parentOf(node);

            yield result;
        }

        if (attributes && (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0)) {
            // prelude tokens, declaration values or token children
            const values: Token[] = arena.subTokens(node);

            if (reverse) {
                for (let i = 0; i < values.length; i++) {
                    stack.push(values[i]);
                }
            } else {
                for (let i = values.length - 1; i >= 0; i--) {
                    stack.push(values[i]);
                }
            }
        }

        if (
            children &&
            arena.flags[node] & EnumAstNodeStatus.HasChildren &&
            (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0)
        ) {
            // children are pushed in reverse so that they are popped in document order
            if (reverse) {
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
export function walkValues(
    arena: AstArena,
    tokens: Token[],
    root: AstNode | Token | null = null,
    filter?:
        | WalkerValueFilter
        | null
        | {
              event?: WalkerEvent;
              fn?: WalkerValueFilter;
              type?: EnumToken | EnumToken[] | ((token: Token) => boolean);
          },
    reverse?: boolean,
): Generator<WalkAttributesResult> {
    // an iterator object holds the state: no generator
    return new ValueWalker(arena, tokens, root, filter, reverse) as unknown as Generator<WalkAttributesResult>;
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
function pushChildren(arena: AstArena, nodes: Token[], value: Token, reverse?: boolean): void {
    const first: number = nodes.length;
    let token: number = arena.firstToken[value];

    while (token != 0) {
        nodes.push(token);
        token = arena.nextSibling[token];
    }

    if ((arena.flags[value] & EnumAstNodeStatus.HasChildren) == 0) {
        let child: number = arena.firstChild[value];

        while (child != 0) {
            if (arena.dataTypes[child] == EnumToken.ListTokenType) {
                token = arena.firstToken[child];

                while (token != 0) {
                    nodes.push(token);
                    token = arena.nextSibling[token];
                }
            } else {
                nodes.push(child);
            }

            child = arena.nextSibling[child];
        }
    }

    if (!reverse) {
        for (let i = first, j = nodes.length - 1; i < j; i++, j--) {
            const swap: Token = nodes[i];

            nodes[i] = nodes[j];
            nodes[j] = swap;
        }
    }
}

// stack of visitValues(), shared by the nested calls: each call uses the entries above its base. the entries are
// written by index and the array never shrinks (pop() and a smaller length release the memory of the array)
const visitStack: Token[] = [];
let visitTop: number = 0;

/**
 * call the visitor for the tokens and their children, in the order of {@link walkValues} (the children of a token are
 * read after the visitor returns). no iterator, result object or stack is created: use it when the parents are not
 * needed and the visitor is not a closure
 * @param arena
 * @param tokens
 * @param visitor
 */
export function visitValues(arena: AstArena, tokens: Token[], visitor: (arena: AstArena, token: Token) => void): void {
    const stack: Token[] = visitStack;
    const base: number = visitTop;
    let top: number = base;

    for (let i = tokens.length - 1; i >= 0; i--) {
        stack[top++] = tokens[i];
    }

    try {
        while (top > base) {
            const value: Token = stack[--top];

            // nested calls use the entries above top
            visitTop = top;
            visitor(arena, value);

            // the children, in reverse order (see pushChildren())
            const first: number = top;
            let token: number = arena.firstToken[value];

            while (token != 0) {
                stack[top++] = token;
                token = arena.nextSibling[token];
            }

            if ((arena.flags[value] & EnumAstNodeStatus.HasChildren) == 0) {
                let child: number = arena.firstChild[value];

                while (child != 0) {
                    if (arena.dataTypes[child] == EnumToken.ListTokenType) {
                        token = arena.firstToken[child];

                        while (token != 0) {
                            stack[top++] = token;
                            token = arena.nextSibling[token];
                        }
                    } else {
                        stack[top++] = child;
                    }

                    child = arena.nextSibling[child];
                }
            }

            for (let i = first, j = top - 1; i < j; i++, j--) {
                const swap: Token = stack[i];

                stack[i] = stack[j];
                stack[j] = swap;
            }
        }
    } finally {
        visitTop = base;
    }
}

/**
 * iterator of {@link walkValues}: a stack of the tokens to visit. the same result object is returned for every token
 */
class ValueWalker implements Iterator<WalkAttributesResult> {
    private readonly nodes: Token[] = [];
    // iterator result, reused
    private readonly iteration: IteratorResult<WalkAttributesResult>;
    private readonly fn: WalkerValueFilter | null = null;
    private readonly type: EnumToken | EnumToken[] | ((token: Token) => boolean) | null = null;
    private readonly eventType: WalkerEvent = WalkerEvent.Enter;
    private readonly result: WalkAttributesResult;
    private previous: Token | null = null;
    // token returned by the last call of next(): its children are visited by the next call
    private current: Token | null = null;
    // value returned by the filter for the current token
    private option: WalkerOption = null;
    // last visited token, see parents()
    private node: Token = 0;

    constructor(
        private readonly arena: AstArena,
        tokens: Token[],
        private readonly root: AstNode | Token | null,
        filter:
            | WalkerValueFilter
            | null
            | undefined
            | {
                  event?: WalkerEvent;
                  fn?: WalkerValueFilter;
                  type?: EnumToken | EnumToken[] | ((token: Token) => boolean);
              },
        private readonly reverse: boolean | undefined,
    ) {
        if (reverse) {
            for (let i = 0; i < tokens.length; i++) {
                this.nodes.push(tokens[i]);
            }
        } else {
            for (let i = tokens.length - 1; i >= 0; i--) {
                this.nodes.push(tokens[i]);
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

        const walker: ValueWalker = this;

        // @ts-ignore
        this.result = {
            value: 0,
            parent: null,
            previousValue: null,
            nextValue: null,
            root: root ?? null,
            parents: function* () {
                let parent: Token | AstNode | null = walker.parentOf(walker.node);

                while (parent != null && parent != 0) {
                    yield parent;

                    if (parent == root) {
                        break;
                    }

                    parent = walker.parentOf(parent);
                }
            },
        } as WalkAttributesResult;

        this.iteration = { done: false, value: this.result };
    }

    /**
     * parent of a token: the owner of the token list or the structured token owning the field list
     * @param token
     */
    private parentOf(token: Token): Token | AstNode | null {
        let parent: Token = this.arena.parents[token];

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
    private isValid(token: Token): boolean {
        const type = this.type;

        return (
            type == null ||
            this.arena.dataTypes[token] == type ||
            (Array.isArray(type) && type.includes(this.arena.dataTypes[token])) ||
            (typeof type == "function" && type(token))
        );
    }

    /**
     * the tokens returned by the filter are visited too
     * @param option
     */
    private pushOption(option: Token | Token[]): void {
        if (!Array.isArray(option)) {
            this.nodes.push(option);
        } else if (this.reverse) {
            for (let i = 0; i < option.length; i++) {
                this.nodes.push(option[i]);
            }
        } else {
            for (let i = option.length - 1; i >= 0; i--) {
                this.nodes.push(option[i]);
            }
        }
    }

    /**
     * children of the token returned by the previous call, then the leave event
     */
    private leave(value: Token): void {
        const arena: AstArena = this.arena;
        const nodes: Token[] = this.nodes;
        const option: WalkerOption = this.option;

        // the children are read after the token is visited (it may have been modified)
        if (typeof option != "number" || (option & WalkerOptionEnum.IgnoreChildren) === 0) {
            pushChildren(arena, nodes, value, this.reverse);
        }

        if (this.eventType & WalkerEvent.Leave && this.fn != null && this.isValid(value)) {
            // @ts-expect-error
            const option: WalkerOption = this.fn(value, this.parentOf(value), WalkerEvent.Leave, this.result.parents);

            if (option != null && typeof option != "number") {
                this.pushOption(option as Token | Token[]);
            }
        }

        this.previous = value;
    }

    [Symbol.iterator](): this {
        return this;
    }

    next(): IteratorResult<WalkAttributesResult> {
        const result: WalkAttributesResult | null = this.nextValue();

        // the value of the iteration is always the result object
        return result == null ? { done: true, value: undefined } : this.iteration;
    }

    /**
     * stop the iteration (break of a for ... of loop)
     * @param value
     */
    return(value?: unknown): IteratorResult<WalkAttributesResult> {
        this.nodes.length = 0;
        this.current = null;

        return { done: true, value: value as undefined };
    }

    throw(error?: unknown): IteratorResult<WalkAttributesResult> {
        this.nodes.length = 0;
        this.current = null;

        throw error;
    }

    /**
     * next token, null at the end
     */
    private nextValue(): WalkAttributesResult | null {
        const nodes: Token[] = this.nodes;
        let value: Token;

        if (this.current != null) {
            this.leave(this.current);
            this.current = null;
        }

        while (nodes.length > 0) {
            value = nodes.pop() as Token;
            this.node = value;
            this.option = null;

            if (this.fn != null && this.eventType & WalkerEvent.Enter && this.isValid(value)) {
                // @ts-expect-error
                const option: WalkerOption = this.fn(
                    value,
                    this.parentOf(value),
                    WalkerEvent.Enter,
                    this.result.parents,
                );

                this.option = option;

                if (typeof option == "number") {
                    if (option & WalkerOptionEnum.Stop) {
                        nodes.length = 0;
                        return null;
                    }

                    if (option & WalkerOptionEnum.Ignore) {
                        continue;
                    }
                } else if (option != null) {
                    this.pushOption(option as Token | Token[]);
                }
            }

            const result: WalkAttributesResult = this.result;

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
