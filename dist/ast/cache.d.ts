/**
 * Structural memoization of values computed from token trees.
 *
 * Identical values are very common in real world stylesheets (`display: block`, `color: #fff`, `width: 100%`, ...).
 * The work that only depends on the structure of the tokens (rendering, validation, ...) can be done once per distinct
 * structure and reused for every other occurrence.
 *
 * A token tree is serialized into int32 values, after the keys already stored in the pool: for every token, a header (type, color
 * type and the fields that follow) followed by the fields that are not empty (name, string value, unit, numeric value),
 * then its token list and its children list. Most tokens are serialized as one or two values. The buffer is hashed and
 * looked up in an open addressing hash table. The keys are stored in a single pool: a lookup does not allocate, a miss
 * keeps the serialized key in the pool (no copy).
 *
 * The serialization writes go to a local buffer reference (one capacity check per token): module level mutable bindings
 * would be loaded and stored at every write. The memos can be cleared and reused: the buffers are kept.
 *
 * The keys do not reference arena ids: the entries remain valid when tokens are moved, mutated or released.
 * Interned string ids are part of the keys, a memo must not outlive the string table of the arena
 * (see {@link AstArena.compact}).
 *
 * @module
 * @internal
 */
import type { Arena } from "./arena.ts";
/**
 * Memoize values by token structure. Lookups return a slot, the value of a slot is `undefined` until it is set.
 *
 * The keys are stored in a typed array pool (one allocation, grown by doubling): a miss copies the key into the pool.
 *
 * ```ts
 * const memo = new StructuralMemo<string>();
 * const slot = memo.list(arena, arena.getFirstToken(declaration));
 * let value = memo.get(slot);
 *
 * if (value === undefined) {
 *     value = expensiveRender(declaration);
 *     memo.set(slot, value);
 * }
 * ```
 *
 * @internal
 */
export declare class StructuralMemo<T> {
    private readonly numericEquality;
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: StructuralMemo<unknown>;
    /**
     * values by slot. read and written by the library (see {@link get} and {@link set})
     *
     * @internal
     */
    readonly values: Array<T | undefined>;
    /**
     * number of distinct structures (lookups that inserted a new entry)
     */
    size: number;
    /**
     * number of lookups that found an existing entry
     */
    hits: number;
    /**
     * key hash, key offset in the pool and key length of each slot (3 values per slot)
     */
    private slots;
    /**
     * serialized keys. the key being looked up is serialized after the last key: it is kept when it is inserted
     */
    private pool;
    /**
     * length of the pool: the length of a typed array is a getter
     */
    private poolLength;
    /**
     * used length of the pool
     */
    private poolSize;
    /**
     * open addressing hash table: slot + 1, 0 when empty
     */
    private table;
    /**
     * end of the key being looked up in the pool
     */
    private used;
    private hash;
    /**
     * @param numericEquality compare the numeric values with `==` semantics (`0` and `-0` are equal) and consider
     * all the `NaN` values equal. the raw bits are compared otherwise
     */
    constructor(numericEquality?: boolean);
    /**
     * number of int32 values allocated by the memo
     */
    get footprint(): number;
    /**
     * slot of a token list (the token and its next siblings)
     * @param arena
     * @param first first token of the list. 0 for an empty list
     * @param prefix extra key component, not negative (an interned name id for instance)
     */
    list(arena: Arena, first: number, prefix?: number): number;
    /**
     * slot of a single token (its next siblings are ignored)
     * @param arena
     * @param token
     */
    token(arena: Arena, token: number): number;
    /**
     * value of a slot. `undefined` if the value has not been set
     * @param slot
     */
    get(slot: number): T | undefined;
    /**
     * set the value of a slot
     * @param slot
     * @param value
     */
    set(slot: number, value: T): void;
    /**
     * drop the entries. the allocated buffers are kept
     */
    clear(): void;
    /**
     * serialize a token after the used part of the pool: a header, the fields that are not empty, then its token list
     * and its children list
     * @param arena
     * @param token
     * @param used end of the serialized key
     * @returns the new end of the serialized key
     */
    private serialize;
    /**
     * grow the pool
     * @param size minimum size
     */
    private growPool;
    /**
     * find or insert the key serialized after the used part of the pool
     */
    private lookup;
    private rehash;
}
