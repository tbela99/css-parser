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
 * encode the strings with the node.js `Buffer` class: faster than {@link TextEncoder.encodeInto}. the rendered bytes are
 * still stored in a `Uint8Array`
 * @param bufferClass node.js `Buffer`
 *
 * @internal
 */
export declare function useNativeBuffer(bufferClass: NativeBufferClass | null): void;
/**
 * the node.js `Buffer` class, null when it is not used (see {@link useNativeBuffer})
 *
 * @internal
 */
export declare function nativeBufferClass(): NativeBufferClass | null;
/**
 * default capacity of a writer, in bytes
 */
export declare const DEFAULT_CAPACITY: number;
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
export declare class Writer {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: Writer;
    /**
     * underlying buffer. only the first {@link length} bytes are meaningful. it is replaced when the writer grows
     */
    buffer: Uint8Array;
    /**
     * unique id of the content of the writer: it changes when the writer is {@link reset}
     */
    id: number;
    /**
     * number of bytes written. it can be decreased to drop the bytes written last
     */
    length: number;
    /**
     * number of bytes written minus the number of UTF-16 code units of the written strings: 0 when only ascii is
     * written. the length of the decoded css is {@link codeLength}
     */
    extra: number;
    /**
     * node.js `Buffer` view of {@link buffer}, null when `Buffer` is not available
     */
    private view;
    /**
     * @param capacity initial capacity in bytes
     */
    constructor(capacity?: number);
    /**
     * write a string, encoded as UTF-8
     * @param str
     */
    write(str: string): void;
    /**
     * write an ascii character
     * @param code character code, less than 0x80
     */
    writeByte(code: number): void;
    /**
     * copy bytes already written: the bytes between `start` and `end` are written again at the end of the buffer
     * @param start start offset
     * @param end end offset
     * @param extra number of bytes minus the number of UTF-16 code units of the copied bytes
     */
    copy(start: number, end: number, extra: number): void;
    /**
     * length of the written css once decoded, in UTF-16 code units (`code.length`)
     */
    get codeLength(): number;
    /**
     * drop the written bytes: the writer is reused. it gets a new id
     */
    reset(): void;
    /**
     * drop the bytes written after a position
     * @param length position, a previous value of {@link length}
     * @param extra value of {@link extra} at this position
     */
    truncate(length: number, extra: number): void;
    /**
     * last byte written, -1 when nothing is written
     */
    lastByte(): number;
    /**
     * make room for `size` more bytes
     * @param size
     */
    reserve(size: number): void;
    /**
     * the written bytes: the buffer, or `buffer.subarray(0, length)` when the buffer is larger than the written bytes
     */
    bytes(): Uint8Array;
    /**
     * encode a string with the native encoder
     * @param str
     */
    private encode;
    /**
     * make room for at least `size` bytes. the capacity is at least doubled
     * @param size minimum capacity
     */
    private grow;
}
