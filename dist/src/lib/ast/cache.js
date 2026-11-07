/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
/**
 * flags of the header of a serialized token: the fields that follow the header. the header is never negative
 * (8 bits type, 8 bits color type, flags)
 */
var Field;
(function (Field) {
    Field[Field["Name"] = 65536] = "Name";
    Field[Field["String"] = 131072] = "String";
    Field[Field["Unit"] = 262144] = "Unit";
    // 32 bits integer numeric value, other than 0
    Field[Field["Integer"] = 524288] = "Integer";
    // raw bits of the numeric value (2 values)
    Field[Field["Number"] = 1048576] = "Number";
    // token list, terminated by an end marker
    Field[Field["Tokens"] = 2097152] = "Tokens";
    // children list, terminated by an end marker
    Field[Field["Children"] = 4194304] = "Children";
})(Field || (Field = {}));
/**
 * end of a token list or of a children list
 */
const End = -1;
/**
 * numeric value conversion buffer
 */
const f64 = new Float64Array(1);
/**
 * raw bits of the numeric value conversion buffer
 */
const bits = new Int32Array(f64.buffer);
/**
 * canonical value: 0 for -0, NaN for all the NaN values
 * @param value
 */
function normalize(value) {
    return value !== value ? NaN : value + 0;
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
class StructuralMemo {
    numericEquality;
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static shape = new StructuralMemo();
    /**
     * values by slot. read and written by the library (see {@link get} and {@link set})
     *
     * @internal
     */
    values = [];
    /**
     * key hash, key offset in the pool and key length of each slot (3 values per slot)
     */
    slots = new Int32Array(64 * 3);
    /**
     * serialized keys. the key being looked up is serialized after the last key: it is kept when it is inserted
     */
    pool = new Int32Array(1024);
    /**
     * used length of the pool
     */
    poolSize = 0;
    /**
     * open addressing hash table: slot + 1, 0 when empty
     */
    table = new Int32Array(128);
    /**
     * end of the key being looked up in the pool
     */
    used = 0;
    /**
     * number of distinct structures (lookups that inserted a new entry)
     */
    size = 0;
    /**
     * number of lookups that found an existing entry
     */
    hits = 0;
    /**
     * @param numericEquality compare the numeric values with `==` semantics (`0` and `-0` are equal) and consider
     * all the `NaN` values equal. the raw bits are compared otherwise
     */
    constructor(numericEquality = false) {
        this.numericEquality = numericEquality;
    }
    /**
     * number of int32 values allocated by the memo
     */
    get footprint() {
        return this.slots.length + this.pool.length + this.table.length;
    }
    /**
     * slot of a token list (the token and its next siblings)
     * @param arena
     * @param first first token of the list. 0 for an empty list
     * @param prefix extra key component, not negative (an interned name id for instance)
     */
    list(arena, first, prefix = 0) {
        let used = this.poolSize;
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
    token(arena, token) {
        this.used = this.serialize(arena, token, this.poolSize);
        return this.lookup();
    }
    /**
     * value of a slot. `undefined` if the value has not been set
     * @param slot
     */
    get(slot) {
        return this.values[slot];
    }
    /**
     * set the value of a slot
     * @param slot
     * @param value
     */
    set(slot, value) {
        this.values[slot] = value;
    }
    /**
     * drop the entries. the allocated buffers are kept
     */
    clear() {
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
    serialize(arena, token, used) {
        // header, 5 fields, end marker
        let buffer = used + 7 > this.pool.length ? this.growPool(used + 7) : this.pool;
        const name = arena.name[token];
        const str = arena.stringValue[token];
        const unit = arena.unit[token];
        const firstToken = arena.firstToken[token];
        const firstChild = arena.firstChild[token];
        let value = arena.numericValue[token];
        // type and color type are 8 bits values
        let header = arena.dataTypes[token] | (arena.colorType[token] << 8);
        const index = used++;
        if (name != 0) {
            header |= 65536 /* Field.Name */;
            buffer[used++] = name;
        }
        if (str != 0) {
            header |= 131072 /* Field.String */;
            buffer[used++] = str;
        }
        if (unit != 0) {
            header |= 262144 /* Field.Unit */;
            buffer[used++] = unit;
        }
        if (this.numericEquality) {
            value = normalize(value);
        }
        // 0 is not serialized. -0 is not an integer: its raw bits are serialized
        if (value !== 0 || 1 / value < 0) {
            if ((value | 0) === value && value !== 0) {
                header |= 524288 /* Field.Integer */;
                buffer[used++] = value;
            }
            else {
                header |= 1048576 /* Field.Number */;
                f64[0] = value;
                buffer[used++] = bits[0];
                buffer[used++] = bits[1];
            }
        }
        if (firstToken != 0) {
            header |= 2097152 /* Field.Tokens */;
        }
        if (firstChild != 0) {
            header |= 4194304 /* Field.Children */;
        }
        buffer[index] = header;
        if (firstToken != 0) {
            for (let child = firstToken; child != 0; child = arena.nextSibling[child]) {
                used = this.serialize(arena, child, used);
            }
            buffer = used + 1 > this.pool.length ? this.growPool(used + 1) : this.pool;
            buffer[used++] = End;
        }
        if (firstChild != 0) {
            for (let child = firstChild; child != 0; child = arena.nextSibling[child]) {
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
    growPool(size) {
        this.pool = grow(this.pool, size);
        return this.pool;
    }
    /**
     * find or insert the key serialized after the used part of the pool
     */
    lookup() {
        const pool = this.pool;
        const base = this.poolSize;
        const length = this.used - base;
        let hash = 0x811c9dc5 ^ length;
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
        const table = this.table;
        const mask = table.length - 1;
        let index = hash & mask;
        let slot;
        while ((slot = table[index]) != 0) {
            slot--;
            const meta = slot * 3;
            if (this.slots[meta] == hash && this.slots[meta + 2] == length) {
                const offset = this.slots[meta + 1];
                let i = 0;
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
    rehash() {
        // the table grows by 4: fewer reallocations
        const table = new Int32Array(this.table.length * 4);
        const mask = table.length - 1;
        for (let slot = 0; slot < this.size; slot++) {
            let index = this.slots[slot * 3] & mask;
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
function grow(buffer, size) {
    let length = buffer.length * 4;
    while (length < size) {
        length *= 4;
    }
    const result = new Int32Array(length);
    result.set(buffer);
    return result;
}

export { StructuralMemo };
