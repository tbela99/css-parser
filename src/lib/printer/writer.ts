/**
 * shared encoder
 */
const encoder: TextEncoder = new TextEncoder();

/**
 * strings longer than this are encoded natively ({@link TextEncoder.encodeInto} or the node.js Buffer): a loop is
 * faster for very short strings. the strings are of different representations (flat, concatenated, sliced, ...): the
 * loop is not specialized for one of them, it is slow for long strings
 */
const NATIVE_THRESHOLD: number = 24;

/**
 * node.js `Buffer`: a view of the buffer of a writer encodes strings at an offset without allocation
 */
export interface NativeBufferClass {
    from(arrayBuffer: ArrayBufferLike, byteOffset: number, length: number): NativeBuffer;
    byteLength(str: string, encoding: "utf8"): number;
    allocUnsafeSlow(size: number): NativeBuffer & Uint8Array;
}

/**
 * node.js `Buffer` instance
 */
export interface NativeBuffer {
    write(str: string, offset: number, length?: number, encoding?: "utf8" | "utf16le"): number;
}

/**
 * node.js `Buffer` class, see {@link useNativeBuffer}
 */
let NativeBufferClass: NativeBufferClass | null = null;

/**
 * encode the strings with the node.js `Buffer` class: faster than {@link TextEncoder.encodeInto}. the rendered bytes are
 * still stored in a `Uint8Array`
 * @param bufferClass node.js `Buffer`
 *
 * @internal
 */
export function useNativeBuffer(bufferClass: NativeBufferClass | null): void {
    NativeBufferClass = bufferClass;
}

/**
 * the node.js `Buffer` class, null when it is not used (see {@link useNativeBuffer})
 *
 * @internal
 */
export function nativeBufferClass(): NativeBufferClass | null {
    return NativeBufferClass;
}

/**
 * last writer id
 */
let writerId: number = 0;

/**
 * a new writer id: a positive 31 bits integer (the ids are stored in an Int32Array, 0 is not an id)
 */
function nextWriterId(): number {
    writerId = (writerId % 0x7ffffffe) + 1;

    return writerId;
}

/**
 * default capacity of a writer, in bytes
 */
export const DEFAULT_CAPACITY: number = 1 << 12;

/**
 * Growable buffer the rendered css is written to, encoded as UTF-8.
 *
 * The renderer writes the rendered css directly into the buffer: the strings and the single characters. Identical
 * declarations are copied from the bytes already written ({@link copy}). The bytes written last can be discarded
 * ({@link truncate}): the renderer drops the empty rules and the semicolon that ends the last declaration of a block.
 * The bytes of a declaration that is copied are never discarded: a rule that contains a declaration is not empty.
 *
 * The capacity should be large enough for the whole output (the renderer allocates it from the input length, see
 * `outputCapacity()`): the buffer is copied when it grows.
 *
 * @internal
 */
export class Writer {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: Writer = new Writer(16);

    /**
     * underlying buffer. only the first {@link length} bytes are meaningful. it is replaced when the writer grows
     */
    buffer: Uint8Array;

    /**
     * unique id of the content of the writer: it changes when the writer is {@link reset}
     */
    id: number = nextWriterId();

    /**
     * number of bytes written. it can be decreased to drop the bytes written last
     */
    length: number = 0;

    /**
     * number of bytes written minus the number of UTF-16 code units of the written strings: 0 when only ascii is
     * written. the length of the decoded css is {@link codeLength}
     */
    extra: number = 0;

    /**
     * node.js `Buffer` view of {@link buffer}, null when `Buffer` is not available
     */
    private view: NativeBuffer | null;

    /**
     * @param capacity initial capacity in bytes
     */
    constructor(capacity: number = DEFAULT_CAPACITY) {
        this.buffer = new Uint8Array(capacity > 0 ? capacity : DEFAULT_CAPACITY);
        this.view =
            NativeBufferClass == null ? null : NativeBufferClass.from(this.buffer.buffer, 0, this.buffer.length);
    }

    /**
     * write a string, encoded as UTF-8
     * @param str
     */
    write(str: string): void {
        const len: number = str.length;
        let pos: number = this.length;

        if (len > NATIVE_THRESHOLD) {
            if (this.view !== null) {
                // a UTF-16 code unit is encoded with at most 3 bytes
                if (
                    pos + len * 3 > this.buffer.length &&
                    pos + NativeBufferClass!.byteLength(str, "utf8") > this.buffer.length
                ) {
                    this.grow(pos + NativeBufferClass!.byteLength(str, "utf8"));
                }

                const written: number = this.view!.write(str, pos);

                this.length = pos + written;
                this.extra += written - len;
                return;
            }

            this.encode(str);
            return;
        }

        // enough room for ascii strings
        if (pos + len > this.buffer.length) {
            this.grow(pos + len);
        }

        const buffer: Uint8Array = this.buffer;
        let i: number = 0;

        for (; i < len; i++) {
            const code: number = str.charCodeAt(i);

            if (code > 0x7f) {
                break;
            }

            buffer[pos++] = code;
        }

        this.length = pos;

        if (i < len) {
            this.encode(i === 0 ? str : str.slice(i));
        }
    }

    /**
     * write an ascii character
     * @param code character code, less than 0x80
     */
    writeByte(code: number): void {
        if (this.length === this.buffer.length) {
            this.grow(this.length + 1);
        }

        this.buffer[this.length++] = code;
    }

    /**
     * copy bytes already written: the bytes between `start` and `end` are written again at the end of the buffer
     * @param start start offset
     * @param end end offset
     * @param extra number of bytes minus the number of UTF-16 code units of the copied bytes
     */
    copy(start: number, end: number, extra: number): void {
        const pos: number = this.length;

        if (pos + end - start > this.buffer.length) {
            this.grow(pos + end - start);
        }

        this.buffer.copyWithin(pos, start, end);
        this.length = pos + end - start;
        this.extra += extra;
    }

    /**
     * length of the written css once decoded, in UTF-16 code units (`code.length`)
     */
    get codeLength(): number {
        return this.length - this.extra;
    }

    /**
     * drop the written bytes: the writer is reused. it gets a new id
     */
    reset(): void {
        this.id = nextWriterId();
        this.length = 0;
        this.extra = 0;
    }

    /**
     * drop the bytes written after a position
     * @param length position, a previous value of {@link length}
     * @param extra value of {@link extra} at this position
     */
    truncate(length: number, extra: number): void {
        this.length = length;
        this.extra = extra;
    }

    /**
     * last byte written, -1 when nothing is written
     */
    lastByte(): number {
        return this.length === 0 ? -1 : this.buffer[this.length - 1];
    }

    /**
     * make room for `size` more bytes
     * @param size
     */
    reserve(size: number): void {
        if (this.length + size > this.buffer.length) {
            this.grow(this.length + size);
        }
    }

    /**
     * the written bytes: the buffer, or `buffer.subarray(0, length)` when the buffer is larger than the written bytes
     */
    bytes(): Uint8Array {
        return this.length === this.buffer.length ? this.buffer : this.buffer.subarray(0, this.length);
    }

    /**
     * encode a string with the native encoder
     * @param str
     */
    private encode(str: string): void {
        let pos: number = this.length;

        // every code unit is read: the difference is the number of written bytes minus the length
        this.extra -= str.length + pos;

        while (true) {
            const result = encoder.encodeInto(str, pos === 0 ? this.buffer : this.buffer.subarray(pos));

            pos += result.written;

            if (result.read === str.length) {
                break;
            }

            // a UTF-16 code unit is encoded with at most 3 bytes
            str = str.slice(result.read);
            this.length = pos;
            this.grow(pos + str.length * 3);
        }

        this.length = pos;
        this.extra += pos;
    }

    /**
     * make room for at least `size` bytes. the capacity is at least doubled
     * @param size minimum capacity
     */
    private grow(size: number): void {
        let capacity: number = this.buffer.length * 2;

        if (capacity < size) {
            capacity = size;
        }

        const buffer: Uint8Array = new Uint8Array(capacity);

        buffer.set(this.length === this.buffer.length ? this.buffer : this.buffer.subarray(0, this.length));
        this.buffer = buffer;

        if (NativeBufferClass != null) {
            this.view = NativeBufferClass.from(buffer.buffer, 0, capacity);
        }
    }
}
