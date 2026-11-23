/**
 * iterators of {@link AstArena.walk} and {@link AstArena.walkValues}: plain iterator objects, no generator. the
 * iteration result object is reused: the value must be read before the next call of `next()` (as `for ... of` does)
 *
 * @module
 * @internal
 */
import type { AstNode, Token, WalkerFilter, WalkerOptions, WalkerValueFilter, WalkerValueOptions } from "../../@types/index.d.ts";
import type { AstArena } from "./arena.ts";
/**
 * iterator of {@link AstArena.walk}: node ids (and value tokens when `attributes` is set) in document order. the
 * children of a node are read when the next node is requested: the node may be modified by the caller
 */
export declare class NodeWalker implements IterableIterator<AstNode | Token> {
    private readonly arena;
    private readonly stack;
    private readonly filter;
    private readonly reverse;
    private readonly children;
    private readonly attributes;
    private readonly iteration;
    private current;
    private option;
    constructor(arena: AstArena, node: AstNode | Token, filter?: WalkerFilter | WalkerOptions | null, reverse?: boolean);
    [Symbol.iterator](): this;
    /**
     * push the value tokens and the children of a node
     * @param node
     * @param option
     */
    private expand;
    next(): IteratorResult<number>;
    /**
     * stop the iteration (break of a for ... of loop)
     */
    return(value?: unknown): IteratorResult<number>;
    throw(error?: unknown): IteratorResult<number>;
}
/**
 * iterator of {@link AstArena.walkValues}: token ids in document order. the children of a token are read when the
 * next token is requested: the token may be modified by the caller
 */
export declare class ValueWalker implements IterableIterator<Token> {
    private readonly arena;
    private readonly stack;
    private readonly fn;
    private readonly type;
    private readonly eventType;
    private readonly reverse;
    private readonly iteration;
    private current;
    private option;
    constructor(arena: AstArena, tokens: Token | Token[], filter?: WalkerValueFilter | WalkerValueOptions | null, reverse?: boolean);
    [Symbol.iterator](): this;
    /**
     * the filter function is called for the token
     * @param token
     */
    private isValid;
    /**
     * the tokens returned by the filter are visited too
     * @param option
     */
    private pushOption;
    /**
     * children of the token returned by the previous call, then the leave event
     */
    private leave;
    next(): IteratorResult<Token>;
    /**
     * stop the iteration (break of a for ... of loop)
     * @param value
     */
    return(value?: unknown): IteratorResult<Token>;
    throw(error?: unknown): IteratorResult<Token>;
}
