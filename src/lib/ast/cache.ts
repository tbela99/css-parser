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
import type {Arena} from "./arena.ts";

/**
 * flags of the header of a serialized token: the fields that follow the header. the header is never negative
 * (8 bits type, 8 bits color type, flags)
 */
const enum Field {
    Name = 1 << 16,
    String = 1 << 17,
    Unit = 1 << 18,
    // 32 bits integer numeric value, other than 0
    Integer = 1 << 19,
    // raw bits of the numeric value (2 values)
    Number = 1 << 20,
    // token list, terminated by an end marker
    Tokens = 1 << 21,
    // children list, terminated by an end marker
    Children = 1 << 22,
}

/**
 * end of a token list or of a children list
 */
const End: number = -1;

/**
 * numeric value conversion buffer
 */
const f64: Float64Array = new Float64Array(1);

/**
 * raw bits of the numeric value conversion buffer
 */
const bits: Int32Array = new Int32Array(f64.buffer);

/**
 * canonical value: 0 for -0, NaN for all the NaN values
 * @param value
 */
function normalize(value: number): number {
    return value !== value ? NaN : value;
}

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
export class StructuralMemo<T> {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: StructuralMemo<unknown> = new StructuralMemo();

    /**
     * values by slot. read and written by the library (see {@link get} and {@link set})
     *
     * @internal
     */
    readonly values: Array<T | undefined> = [];
    /**
     * number of distinct structures (lookups that inserted a new entry)
     */
    public size: number = 0;
    /**
     * number of lookups that found an existing entry
     */
    public hits: number = 0;
    /**
     * key hash, key offset in the pool and key length of each slot (3 values per slot)
     */
    private slots: Int32Array = new Int32Array(64 * 3);
    /**
     * serialized keys. the key being looked up is serialized after the last key: it is kept when it is inserted
     */
    private pool: Int32Array = new Int32Array(1024);
    /**
     * used length of the pool
     */
    private poolSize: number = 0;
    /**
     * open addressing hash table: slot + 1, 0 when empty
     */
    private table: Int32Array = new Int32Array(128);
    /**
     * end of the key being looked up in the pool
     */
    private used: number = 0;

    /**
     * @param numericEquality compare the numeric values with `==` semantics (`0` and `-0` are equal) and consider
     * all the `NaN` values equal. the raw bits are compared otherwise
     */
    constructor(private readonly numericEquality: boolean = false) {}

    /**
     * number of int32 values allocated by the memo
     */
    get footprint(): number {
        return this.slots.length + this.pool.length + this.table.length;
    }

    /**
     * slot of a token list (the token and its next siblings)
     * @param arena
     * @param first first token of the list. 0 for an empty list
     * @param prefix extra key component, not negative (an interned name id for instance)
     */
    list(arena: Arena, first: number, prefix: number = 0): number {
        let used: number = this.poolSize;

        if (used + 1 > this.pool.length) {
            this.growPool(used + 1);
        }

        this.pool[used++] = prefix;

        for (let token = first; token != 0; token = arena.nextSibling[token]) {
            used = this.serialize(arena, token, used);
        }

        this.used = used;
        return this.lookup();
    }

    /**
     * slot of a single token (its next siblings are ignored)
     * @param arena
     * @param token
     */
    token(arena: Arena, token: number): number {
        this.used = this.serialize(arena, token, this.poolSize);

        return this.lookup();
    }

    /**
     * value of a slot. `undefined` if the value has not been set
     * @param slot
     */
    get(slot: number): T | undefined {
        return this.values[slot];
    }

    /**
     * set the value of a slot
     * @param slot
     * @param value
     */
    set(slot: number, value: T): void {
        this.values[slot] = value;
    }

    /**
     * drop the entries. the allocated buffers are kept
     */
    clear(): void {
        this.values.length = 0;
        this.table.fill(0);
        this.poolSize = 0;
        this.used = 0;
        this.size = 0;
        this.hits = 0;
    }

    /**
     * serialize a token after the used part of the pool: a header, the fields that are not empty, then its token list
     * and its children list
     * @param arena
     * @param token
     * @param used end of the serialized key
     * @returns the new end of the serialized key
     */
    private serialize(arena: Arena, token: number, used: number): number {
        // header, 5 fields, end marker
        let buffer: Int32Array = used + 7 > this.pool.length ? this.growPool(used + 7) : this.pool;
        const name: number = arena.name[token];
        const str: number = arena.stringValue[token];
        const unit: number = arena.unit[token];
        const firstToken: number = arena.firstToken[token];
        const firstChild: number = arena.firstChild[token];
        let value: number = arena.numericValue[token];
        // type and color type are 8 bits values
        let header: number = arena.dataTypes[token] | (arena.colorType[token] << 8);
        const index: number = used++;

        if (name != 0) {
            header |= Field.Name;
            buffer[used++] = name;
        }

        if (str != 0) {
            header |= Field.String;
            buffer[used++] = str;
        }

        if (unit != 0) {
            header |= Field.Unit;
            buffer[used++] = unit;
        }

        if (this.numericEquality) {
            value = normalize(value);
        }

        // 0 is not serialized. -0 is not an integer: its raw bits are serialized
        if (value !== 0 || 1 / value < 0) {
            if ((value | 0) === value && value !== 0) {
                header |= Field.Integer;
                buffer[used++] = value;
            } else {
                header |= Field.Number;
                f64[0] = value;
                buffer[used++] = bits[0];
                buffer[used++] = bits[1];
            }
        }

        if (firstToken != 0) {
            header |= Field.Tokens;
        }

        if (firstChild != 0) {
            header |= Field.Children;
        }

        buffer[index] = header;

        if (firstToken != 0) {
            for (let child: number = firstToken; child != 0; child = arena.nextSibling[child]) {
                used = this.serialize(arena, child, used);
            }

            buffer = used + 1 > this.pool.length ? this.growPool(used + 1) : this.pool;
            buffer[used++] = End;
        }

        if (firstChild != 0) {
            for (let child: number = firstChild; child != 0; child = arena.nextSibling[child]) {
                used = this.serialize(arena, child, used);
            }

            buffer = used + 1 > this.pool.length ? this.growPool(used + 1) : this.pool;
            buffer[used++] = End;
        }

        return used;
    }

    /**
     * grow the pool
     * @param size minimum size
     */
    private growPool(size: number): Int32Array {
        this.pool = grow(this.pool, size);
        return this.pool;
    }

    /**
     * find or insert the key serialized after the used part of the pool
     */
    private lookup(): number {
        const pool: Int32Array = this.pool;
        const base: number = this.poolSize;
        const length: number = this.used - base;
        let hash: number = 0x811c9dc5 ^ length;

        for (let i = base; i < this.used; i++) {
            hash = Math.imul(hash ^ pool[i], 0x01000193);
        }

        // the multiplications only propagate the bits upwards: the low bits, used as the table index, are mixed with
        // the high bits (murmur3 finalizer)
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x85ebca6b);
        hash ^= hash >>> 13;
        hash = Math.imul(hash, 0xc2b2ae35);
        hash ^= hash >>> 16;

        const table: Int32Array = this.table;
        const mask: number = table.length - 1;
        let index: number = hash & mask;
        let slot: number;

        while ((slot = table[index]) != 0) {
            slot--;

            const meta: number = slot * 3;

            if (this.slots[meta] == hash && this.slots[meta + 2] == length) {
                const offset: number = this.slots[meta + 1];
                let i: number = 0;

                while (i < length && pool[offset + i] == pool[base + i]) {
                    i++;
                }

                if (i == length) {
                    this.hits++;
                    return slot;
                }
            }

            index = (index + 1) & mask;
        }

        // insert: the serialized key is kept in the pool
        slot = this.size++;

        if (slot * 3 == this.slots.length) {
            this.slots = grow(this.slots, slot * 3 + 3);
        }

        this.slots[slot * 3] = hash;
        this.slots[slot * 3 + 1] = base;
        this.slots[slot * 3 + 2] = length;
        this.values.push(undefined);
        this.poolSize = this.used;
        table[index] = slot + 1;

        // load factor <= 0.5
        if (this.size * 2 > table.length) {
            this.rehash();
        }

        return slot;
    }

    private rehash(): void {
        // the table grows by 4: fewer reallocations
        const table: Int32Array = new Int32Array(this.table.length * 4);
        const mask: number = table.length - 1;

        for (let slot = 0; slot < this.size; slot++) {
            let index: number = this.slots[slot * 3] & mask;

            while (table[index] != 0) {
                index = (index + 1) & mask;
            }

            table[index] = slot + 1;
        }

        this.table = table;
    }
}

/**
 * grow an int32 buffer: its size is multiplied by 4 (fewer reallocations)
 * @param buffer
 * @param size minimum size
 */
function grow(buffer: Int32Array, size: number): Int32Array {
    let length: number = buffer.length * 4;

    while (length < size) {
        length *= 4;
    }

    const result: Int32Array = new Int32Array(length);

    result.set(buffer);
    return result;
}
